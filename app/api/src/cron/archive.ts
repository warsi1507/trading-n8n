import cron from 'node-cron';
import { Workflow } from '@trading-n8n/db';

// Run every day at 00:00 UTC
export const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily archival cleanup task...');
    try {
      // 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Workflow.deleteMany({
        is_archived: true,
        archived_at: { $lte: thirtyDaysAgo }
      });

      console.log(`[CRON] Archival cleanup completed. Deleted ${result.deletedCount} old archived workflows.`);
    } catch (error) {
      console.error('[CRON] Error running archival cleanup:', error);
    }
  }, {
    timezone: 'UTC'
  });
};
