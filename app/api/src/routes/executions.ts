import { Router, Request, Response } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { Execution, Workflow, User } from '@trading-n8n/db';

const router = Router();

router.use(clerkMiddleware());

/**
 * GET /api/executions
 * Retrieves a paginated list of all executions across all workflows for the authenticated user.
 */
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = await User.findOne({ clerk_id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;

    const executions = await Execution.find({ user_id: user._id, workflow_deleted: { $ne: true } })
      .sort({ started_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('workflow_id', 'display_id name description')
      .lean();

    const total = await Execution.countDocuments({ user_id: user._id, workflow_deleted: { $ne: true } });

    return res.status(200).json({
      executions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching global executions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/executions/workflow/:display_id
 * Retrieves a paginated list of executions for a specific workflow.
 */
router.get('/workflow/:display_id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = await User.findOne({ clerk_id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const workflow = await Workflow.findOne({ display_id: req.params.display_id, user_id: user._id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = 20; // more items per page on the split-screen view

    const executions = await Execution.find({ workflow_id: workflow._id, user_id: user._id })
      .sort({ started_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Execution.countDocuments({ workflow_id: workflow._id, user_id: user._id });

    return res.status(200).json({
      executions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/executions/:display_id/cancel
 * Cancels a RUNNING or PENDING execution.
 */
router.post('/:display_id/cancel', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = await User.findOne({ clerk_id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const execution = await Execution.findOne({ display_id: req.params.display_id, user_id: user._id });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });

    if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot cancel execution in ${execution.status} state` });
    }

    execution.status = 'CANCELED';
    execution.ended_at = new Date();
    await execution.save();

    return res.status(200).json({ message: 'Execution canceled', execution });
  } catch (error) {
    console.error('Error canceling execution:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/executions/:display_id
 * Retrieves a single execution by display_id with all node details.
 */
router.get('/:display_id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = await User.findOne({ clerk_id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Use display_id or _id for fallback
    let execution = await Execution.findOne({ display_id: req.params.display_id, user_id: user._id }).lean();
    if (!execution) {
      execution = await Execution.findOne({ _id: req.params.display_id, user_id: user._id }).lean();
    }
    
    if (!execution) return res.status(404).json({ error: 'Execution not found' });

    return res.status(200).json(execution);
  } catch (error) {
    console.error('Error fetching execution:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
