import { Workflow } from '@trading-n8n/db';
import { activeTriggers } from './ActiveTriggers';
import { workflowCache } from './WorkflowCache';
import { wsManager } from '../ws/WebSocketManager';
import { VaultService } from '../services/VaultService';
import { createLogger } from '@trading-n8n/logger';
import { timeManager } from '../engine/TimeManager';

const logger = createLogger('TRIGGER_LOADER');

export class TriggerLoader {
  /**
   * Fetches all DEPLOYED workflows from MongoDB and loads their triggers,
   * workflow graphs, and API credentials into RAM.
   */
  static async loadAllTriggers(): Promise<void> {
    try {
      activeTriggers.clear();
      workflowCache.clear();
      VaultService.clearCache();

      const workflows = await Workflow.find({ status: 'DEPLOYED' });
      let loadedCount = 0;

      for (const wf of workflows) {
        if (!wf.deployed_version || !wf.deployed_version.nodes) continue;

        const workflowId = wf._id.toString();

        // Cache the full workflow graph for the Engine
        workflowCache.set(workflowId, {
          workflowId,
          userId: wf.user_id.toString(),
          nodes: wf.deployed_version.nodes,
          edges: wf.deployed_version.edges,
        });

        for (const node of wf.deployed_version.nodes) {
          // Load trigger definitions
          if (node.type === 'price-trigger' && node.data && node.data.metadata) {
            const metadata = node.data.metadata as any;
            if (metadata.asset && metadata.price !== undefined) {
              activeTriggers.addTrigger({
                workflowId,
                userId: wf.user_id.toString(),
                nodeId: node.id,
                asset: metadata.asset,
                targetPrice: Number(metadata.price),
              });
              loadedCount++;
            }
          }
          
          // Pre-load action credentials into RAM
          if (node.data && node.data.kind === 'action' && node.data.metadata) {
            const metadata = node.data.metadata as any;
            if (metadata.credentials) {
              for (const credId of Object.values(metadata.credentials)) {
                await VaultService.preloadCredential(credId as string);
              }
            }
          }
        }
      }

      logger.info('Loaded deployed workflows into memory', {
        triggers: loadedCount,
        workflows: workflows.length,
      });

      // Tell managers to update their logic based on the new cache
      wsManager.syncSubscriptions();
      timeManager.syncTimers();

    } catch (err: any) {
      logger.error('Failed to load triggers from MongoDB', { error: err.message });
    }
  }
}
