import { Router, Request, Response } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { Workflow, User, Counter } from '@trading-n8n/db';

const router = Router();

// Apply Clerk middleware to parse session tokens for all workflow routes
router.use(clerkMiddleware());

/**
 * GET /api/workflows
 * Retrieves a lightweight list of all workflows for the authenticated user.
 * Excludes heavy payload arrays (nodes and edges) to optimize dashboard load times.
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

    const workflows = await Workflow.find({ user_id: user._id })
      .select('-draft_version.nodes -draft_version.edges -deployed_version.nodes -deployed_version.edges')
      .sort({ updated_at: -1 });

    res.json(workflows);
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
      { _id: 'workflowId' },
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
 * Automatically re-evaluates the validation status and manages state transitions.
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

    const { name, description, nodes, edges } = req.body;

    // Apply metadata updates if provided
    if (name !== undefined) workflow.name = name;
    if (description !== undefined) workflow.description = description;

    // Apply graph modifications and execute state management logic
    if (nodes || edges) {
      if (nodes) workflow.draft_version.nodes = nodes;
      if (edges) workflow.draft_version.edges = edges;

      // Preliminary validation: workflow must contain at least one valid trigger node
      const hasTrigger = workflow.draft_version.nodes.some((n: any) => n.data?.kind === 'trigger');
      workflow.draft_version.is_valid = hasTrigger;

      // State Transition: Downgrade active workflows to IN_EDIT status upon modification
      if (workflow.status === 'DEPLOYED') {
        workflow.status = 'IN_EDIT';
      }
    }

    await workflow.save();
    
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Internal server error while updating workflow' });
  }
});

export default router;
