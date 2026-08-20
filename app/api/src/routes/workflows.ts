import { Router, Request, Response } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { Workflow, User, Counter, Execution } from '@trading-n8n/db';

const router = Router();

// Apply Clerk middleware to parse session tokens for all workflow routes
router.use(clerkMiddleware());

/**
 * GET /api/workflows
 * Retrieves a paginated, lightweight list of workflows filtered by tab.
 */
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }
    
    const user = await User.findOne({ clerk_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User record not found in the database' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const tab = (req.query.tab as string) || 'IN_PROGRESS';

    const filter: any = { user_id: user._id };

    if (tab === 'ARCHIVED') {
      filter.is_archived = true;
    } else if (tab === 'DEPLOYED') {
      filter.is_archived = false;
      filter.status = { $in: ['DEPLOYED', 'PAUSED'] };
    } else {
      // IN_PROGRESS tab
      filter.is_archived = false;
      filter.status = 'DRAFT';
    }

    const skip = (page - 1) * limit;

    const workflows = await Workflow.find(filter)
      .select('-draft_version.nodes -draft_version.edges -deployed_version.nodes -deployed_version.edges')
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Workflow.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: workflows,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Internal server error while fetching workflows' });
  }
});

/**
 * POST /api/workflows
 * Initializes a new, empty workflow with an auto-incrementing display identifier.
 */
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    const user = await User.findOne({ clerk_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User record not found in the database' });
    }

    // Use atomic counter pattern for sequential display IDs (workflow-1, workflow-2)
    const counter = await Counter.findOneAndUpdate(
      { _id: `workflowId-${user._id}` },
      { $inc: { sequence_value: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    
    const display_id = `workflow-${counter?.sequence_value || 1}`;
    const defaultName = `Untitled Workflow`;

    const workflow = new Workflow({
      user_id: user._id,
      display_id,
      name: defaultName,
      description: '',
      status: 'DRAFT',
      is_archived: false,
      draft_version: {
        nodes: [],
        edges: [],
        is_valid: false
      }
    });

    await workflow.save();
    
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Internal server error while creating workflow' });
  }
});

/**
 * GET /api/workflows/:display_id
 * Fetches the complete workflow document, including full graph arrays, by its display identifier.
 */
router.get('/:display_id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    const user = await User.findOne({ clerk_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User record not found in the database' });
    }

    const workflow = await Workflow.findOne({ 
      display_id: req.params.display_id,
      user_id: user._id 
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Requested workflow was not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Internal server error while fetching workflow' });
  }
});

/**
 * PUT /api/workflows/:display_id
 * Updates workflow metadata and/or the draft version graph. 
 */
router.put('/:display_id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    const user = await User.findOne({ clerk_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User record not found in the database' });
    }

    const workflow = await Workflow.findOne({ 
      display_id: req.params.display_id,
      user_id: user._id 
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Requested workflow was not found' });
    }

    const { name, description, nodes, edges, status } = req.body;

    // Apply metadata updates if provided
    if (name !== undefined) workflow.name = name;
    if (description !== undefined) workflow.description = description;

    // Allow PAUSED/DEPLOYED status toggling if it's already deployed
    if (status !== undefined) {
      if ((workflow.status === 'DEPLOYED' || workflow.status === 'PAUSED') && (status === 'DEPLOYED' || status === 'PAUSED')) {
        workflow.status = status;
      }
    }

    // Apply graph modifications and execute state management logic
    if (nodes || edges) {
      if (nodes) workflow.draft_version.nodes = nodes;
      if (edges) workflow.draft_version.edges = edges;

      // Invalidate if nodes/edges change so it must be re-validated explicitly via /validate
      workflow.draft_version.is_valid = false;
    }

    await workflow.save();
    
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Internal server error while updating workflow' });
  }
});

/**
 * POST /api/workflows/:display_id/validate
 * Validates the draft graph via BFS traversal.
 */
router.post('/:display_id/validate', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ clerk_id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const workflow = await Workflow.findOne({ display_id: req.params.display_id, user_id: user._id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const nodes = workflow.draft_version.nodes;
    const edges = workflow.draft_version.edges;

    const triggerNodes = nodes.filter(n => n.data.kind === 'trigger');
    if (triggerNodes.length === 0) {
      workflow.draft_version.is_valid = false;
      await workflow.save();
      return res.json({ is_valid: false, message: 'Workflow must have at least one trigger node.' });
    }

    const actionNodeIds = new Set(nodes.filter(n => n.data.kind === 'action').map(n => n.id));
    const visited = new Set<string>();
    const queue: string[] = triggerNodes.map(n => n.id);

    // Build adjacency list for fast BFS
    const adj = new Map<string, string[]>();
    for (const e of edges) {
      if (!adj.has(e.source)) adj.set(e.source, []);
      adj.get(e.source)!.push(e.target);
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!visited.has(curr)) {
        visited.add(curr);
        actionNodeIds.delete(curr);
        
        if (adj.has(curr)) {
          queue.push(...adj.get(curr)!);
        }
      }
    }

    const is_valid = actionNodeIds.size === 0;
    workflow.draft_version.is_valid = is_valid;
    await workflow.save();

    if (!is_valid) {
      return res.json({ is_valid: false, message: 'All action nodes must be reachable from a trigger node.' });
    }

    res.json({ is_valid: true, workflow });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workflows/:display_id/deploy
 * Deploys a validated draft version to production.
 */
router.post('/:display_id/deploy', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ clerk_id: userId });
    const workflow = await Workflow.findOne({ display_id: req.params.display_id, user_id: user?._id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    if (!workflow.draft_version.is_valid) {
      return res.status(400).json({ error: 'Cannot deploy an invalid workflow.' });
    }

    workflow.deployed_version = { ...workflow.draft_version };
    workflow.status = 'DEPLOYED';
    workflow.is_active = true;
    
    await workflow.save();

    // Cascade: If deploying a new version, cancel any running executions of the old version
    await Execution.updateMany(
      { workflow_id: workflow._id, status: { $in: ['PENDING', 'RUNNING'] } },
      { $set: { status: 'CANCELED', ended_at: new Date() } }
    );

    res.json(workflow);
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workflows/:display_id/toggle
 * Toggles a deployed workflow between DEPLOYED (active) and PAUSED (inactive).
 */
router.post('/:display_id/toggle', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ clerk_id: userId });
    const workflow = await Workflow.findOne({ display_id: req.params.display_id, user_id: user?._id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    if (workflow.status === 'DRAFT') {
      return res.status(400).json({ error: 'Cannot toggle a draft workflow. Deploy it first.' });
    }

    if (workflow.is_active) {
      workflow.is_active = false;
      workflow.status = 'PAUSED';
    } else {
      workflow.is_active = true;
      workflow.status = 'DEPLOYED';
    }
    
    await workflow.save();
    res.json(workflow);
  } catch (error) {
    console.error('Toggle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workflows/:display_id/archive
 * Soft-deletes a workflow and reverts status to DRAFT.
 */
router.post('/:display_id/archive', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ clerk_id: userId });
    const workflow = await Workflow.findOne({ display_id: req.params.display_id, user_id: user?._id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    workflow.is_archived = true;
    workflow.archived_at = new Date();
    
    // The Mongoose pre('save') hook handles setting status to DRAFT and is_active to false
    await workflow.save();

    // Cascade: mark active executions as CANCELED, and all as workflow_deleted
    await Execution.updateMany(
      { workflow_id: workflow._id, status: { $in: ['PENDING', 'RUNNING'] } },
      { $set: { status: 'CANCELED', ended_at: new Date() } }
    );
    await Execution.updateMany(
      { workflow_id: workflow._id },
      { $set: { workflow_deleted: true } }
    );

    res.json(workflow);
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workflows/:display_id/unarchive
 * Restores a soft-deleted workflow.
 */
router.post('/:display_id/unarchive', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ clerk_id: userId });
    const workflow = await Workflow.findOne({ display_id: req.params.display_id, user_id: user?._id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    workflow.is_archived = false;
    workflow.archived_at = null;
    
    await workflow.save();
    res.json(workflow);
  } catch (error) {
    console.error('Unarchive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
