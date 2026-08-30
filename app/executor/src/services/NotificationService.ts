import nodemailer from 'nodemailer';
import { createLogger } from '@trading-n8n/logger';
import { User, Execution, Workflow } from '@trading-n8n/db';

const logger = createLogger('NOTIFICATIONS');

export class NotificationService {
  private static transporter: nodemailer.Transporter | null = null;

  static async initialize() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info('Initialized SMTP transport', { host: process.env.SMTP_HOST });
    } else {
      logger.info('SMTP credentials not configured, falling back to Ethereal test account');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        logger.info('Initialized Ethereal SMTP transport');
      } catch (err) {
        logger.error('Failed to create Ethereal test account', { error: err });
      }
    }
  }

  static async sendExecutionFailureEmail(executionId: string, errorMsg?: string) {
    if (!this.transporter) await this.initialize();
    if (!this.transporter) return;

    try {
      // Fetch Execution
      const execution = await Execution.findById(executionId);
      if (!execution) {
        logger.warn('Failed to send email: Execution not found', { executionId });
        return;
      }

      // Fetch Workflow
      const workflow = await Workflow.findById(execution.workflow_id);
      const workflowName = workflow ? workflow.name : 'Unknown Workflow';

      // Fetch User
      const user = await User.findById(execution.user_id);
      if (!user || !user.email) {
        logger.warn('Failed to send email: User or email not found', { userId: execution.user_id });
        return;
      }

      // Send Email
      const info = await this.transporter.sendMail({
        from: '"Trading Engine" <noreply@trading-engine.local>',
        to: user.email,
        subject: `Execution Failed: ${workflowName}`,
        text: `Your workflow "${workflowName}" (Execution ${execution.display_id}) failed.\n\nError: ${errorMsg || 'Unknown error'}\n\nPlease check your dashboard.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
            <h2 style="color: #ef4444;">Workflow Execution Failed</h2>
            <p>Your workflow <strong>${workflowName}</strong> (Execution <code>${execution.display_id}</code>) has encountered a failure.</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 24px 0;">
              <code style="color: #991b1b; white-space: pre-wrap;">${errorMsg || 'Unknown error'}</code>
            </div>
            <p>Please log in to your dashboard to view the node logs and investigate.</p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 32px;">This is an automated message from the Trading Engine.</p>
          </div>
        `,
      });

      logger.info('Failure email dispatched', { 
        executionId, 
        to: user.email, 
        messageId: info.messageId 
      });

      // Ethereal Preview URL
      if (info.messageId && !process.env.SMTP_HOST) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info(`Ethereal email preview available: ${previewUrl}`);
        }
      }

    } catch (error: any) {
      logger.error('Failed to dispatch execution failure email', { executionId, error: error.message });
    }
  }
}
