import { Credential } from '@trading-n8n/db';
import crypto from 'crypto';
import { createLogger } from '@trading-n8n/logger';

const logger = createLogger('VAULT_SERVICE');

export class VaultService {
  // Ultra-fast RAM cache for decrypted API keys
  private static cache: Map<string, string> = new Map();

  /**
   * Pre-loads and decrypts a credential into memory.
   * Should be called when a workflow is deployed or the system boots.
   */
  static async preloadCredential(credentialId: string): Promise<void> {
    if (this.cache.has(credentialId)) return;

    try {
      const cred = await Credential.findById(credentialId);
      if (!cred) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      const key = process.env.ENCRYPTION_KEY;
      if (!key || key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
      }

      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(cred.iv, 'hex');
      const authTagBuffer = Buffer.from(cred.auth_tag, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(cred.encrypted_value, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.cache.set(credentialId, decrypted);
      logger.debug('Pre-loaded credential into RAM', { credentialId });
    } catch (err: any) {
      logger.error('Failed to pre-load credential', { credentialId, error: err.message });
    }
  }

  /**
   * Instantly retrieves a decrypted credential from RAM.
   * Falls back to database (slow) only if it wasn't pre-loaded.
   */
  static async getDecryptedCredential(credentialId: string): Promise<string> {
    if (this.cache.has(credentialId)) {
      return this.cache.get(credentialId)!;
    }

    logger.warn('Cache miss for credential! Falling back to slow MongoDB query.', { credentialId });
    await this.preloadCredential(credentialId);
    
    const decrypted = this.cache.get(credentialId);
    if (!decrypted) {
      throw new Error(`Failed to decrypt credential: ${credentialId}`);
    }
    
    return decrypted;
  }

  /**
   * Clears the entire credential cache.
   */
  static clearCache(): void {
    this.cache.clear();
    logger.info('Vault cache cleared');
  }
}
