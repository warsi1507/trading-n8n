import { Execution, Counter } from '@trading-n8n/db';
import { createLogger } from '@trading-n8n/logger';
import { ExecutionContext } from './Context';
import { RedisLogger } from '../redis/RedisLogger';
import { VaultService } from '../services/VaultService';
import { workflowCache } from '../cache/WorkflowCache';
import type { AppNode, TradingMetadata, SupportedAsset } from '@trading-n8n/common';
import * as backpackExecutor from '../executors/backpack';
import * as hyperliquidExecutor from '../executors/hyperliquid';
import * as lighterExecutor from '../executors/lighter';

const logger = createLogger('ENGINE');

export class WorkflowEngine {
  /**
   * Fires an execution for a specific workflow starting from a specific trigger node.
   */
  static async execute(workflowId: string, triggerNodeId: string, initialPayload: any = {}): Promise<void> {
    try {
      // Read workflow graph from RAM cache (zero MongoDB latency)
      const cached = workflowCache.get(workflowId);
      if (!cached) {
        throw new Error('Workflow not found in cache. It may have been paused or removed.');
      }

      const { nodes, edges, userId } = cached;

      // Atomic display ID using the same Counter pattern as the API
      const counter = await Counter.findOneAndUpdate(
        { _id: `executionId-${workflowId}` },
        { $inc: { sequence_value: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      const displayId = (counter?.sequence_value || 1).toString();

      // Initialize Execution document in MongoDB
      const executionNodes = nodes.map(n => ({
        node_id: n.id,
        status: 'PENDING' as const
      }));

      const execution = await Execution.create({
        workflow_id: workflowId,
        user_id: userId,
        status: 'RUNNING',
        display_id: displayId,
        started_at: new Date(),
        nodes: executionNodes
      });

      const executionId = execution._id.toString();
      const executionStart = Date.now();

      await RedisLogger.logEvent({
        workflowId,
        executionId,
        status: 'RUNNING',
        startedAt: new Date()
      });

      const context = new ExecutionContext();
      const processedNodeIds = new Set<string>();
      
      let currentNodes = [triggerNodeId];
      let hasFailed = false;

      // BFS Traversal
      while (currentNodes.length > 0) {
        const nextNodes: string[] = [];

        // Execute all nodes at this depth in parallel
        const results = await Promise.allSettled(
          currentNodes.map(async (nodeId) => {
            const nodeDef = nodes.find(n => n.id === nodeId);
            if (!nodeDef) return;

            processedNodeIds.add(nodeId);
            const nodeStart = Date.now();

            await RedisLogger.logEvent({
              workflowId,
              executionId,
              nodeId,
              status: 'RUNNING',
              startedAt: new Date()
            });

            try {
              const output = await this.executeNode(nodeDef, context, initialPayload);
              context.setNodeData(nodeId, output);

              const nodeDuration = Date.now() - nodeStart;

              await RedisLogger.logEvent({
                workflowId,
                executionId,
                nodeId,
                status: 'SUCCESS',
                endedAt: new Date(),
                durationMs: nodeDuration,
                outputData: JSON.stringify(output)
              });

              // Collect downstream nodes
              const connectedEdges = edges.filter(e => e.source === nodeId);
              return connectedEdges.map(e => e.target);
            } catch (err: any) {
              await RedisLogger.logEvent({
                workflowId,
                executionId,
                nodeId,
                status: 'FAILED',
                endedAt: new Date(),
                durationMs: Date.now() - nodeStart,
                error: err.message
              });
              throw err; // Re-throw so Promise.allSettled marks it as rejected
            }
          })
        );

        // Check results for failures
        for (const result of results) {
          if (result.status === 'rejected') {
            hasFailed = true;
          } else if (result.status === 'fulfilled' && result.value) {
            nextNodes.push(...result.value);
          }
        }
        
        if (hasFailed) break;
        currentNodes = nextNodes;
      }

      // Mark all unprocessed nodes as SKIPPED
      for (const node of nodes) {
        if (!processedNodeIds.has(node.id)) {
          await RedisLogger.logEvent({
            workflowId,
            executionId,
            nodeId: node.id,
            status: 'SKIPPED',
          });
        }
      }

      // Finalize global execution
      const executionDuration = Date.now() - executionStart;

      if (hasFailed) {
        await RedisLogger.logEvent({
          workflowId,
          executionId,
          status: 'FAILED',
          endedAt: new Date(),
          durationMs: executionDuration,
          error: 'A node in the workflow failed.'
        });
      } else {
        await RedisLogger.logEvent({
          workflowId,
          executionId,
          status: 'SUCCESS',
          endedAt: new Date(),
          durationMs: executionDuration,
        });
      }

    } catch (err: any) {
      logger.error('Failed to start execution', { workflowId, error: err.message });
    }
  }

  /**
   * Determines node type and executes business logic.
   */
  private static async executeNode(node: AppNode, context: ExecutionContext, initialPayload: any): Promise<any> {
    const { type, data } = node;

    // Trigger Node (Already fired, just pass payload forward)
    if (data.kind === 'trigger') {
      return { ...initialPayload, triggeredAt: new Date().toISOString() };
    }

    // Action Nodes
    if (data.kind === 'action') {
      const metadata = data.metadata as unknown as TradingMetadata;

      if (!metadata.platform) {
        throw new Error(`Action node "${data.name}" has no platform configured`);
      }
      if (!metadata.symbol) {
        throw new Error(`Action node "${data.name}" has no asset symbol configured`);
      }
      if (!metadata.qty || metadata.qty <= 0) {
        throw new Error(`Action node "${data.name}" has an invalid quantity`);
      }

      // Decrypt all credential values from the Vault (served from RAM — zero latency)
      const decryptedKeys: Record<string, string> = {};
      if (metadata.credentials) {
        for (const [keyName, credId] of Object.entries(metadata.credentials)) {
          decryptedKeys[keyName] = await VaultService.getDecryptedCredential(credId as string);
        }
      }

      const order = {
        asset: metadata.symbol as SupportedAsset,
        qty: metadata.qty,
        type: metadata.type,
      };

      logger.info('Dispatching trade order', {
        platform: metadata.platform,
        asset: order.asset,
        type: order.type,
        qty: order.qty,
      });

      switch ((metadata.platform as string)?.toLowerCase()) {
        case 'backpack':
          return await backpackExecutor.execute(order, decryptedKeys);

        case 'hyperliquid':
          return await hyperliquidExecutor.execute(order, decryptedKeys);

        case 'lighter':
        case 'lighter.xyz':
          return await lighterExecutor.execute(order, decryptedKeys);

        default:
          throw new Error(`Unsupported platform: ${metadata.platform}`);
      }
    }

    throw new Error(`Unsupported node kind: ${data.kind}`);
  }
}
