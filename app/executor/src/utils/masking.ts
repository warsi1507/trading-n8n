/**
 * Safely masks sensitive keys in any object/JSON payload before logging to DB/Redis.
 */
const SENSITIVE_KEYS = [
  'api_key',
  'apikey',
  'api-key',
  'secret',
  'secret_key',
  'password',
  'token',
  'access_token',
  'private_key',
  'auth'
];

export function maskSensitiveData(data: any): any {
  if (!data) return data;
  
  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  const maskedObj: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );

    if (isSensitive && typeof value === 'string') {
      // Show first 3 chars if it's long enough, otherwise just mask entirely
      maskedObj[key] = value.length > 6 ? `${value.substring(0, 3)}...********` : '********';
    } else if (typeof value === 'object' && value !== null) {
      maskedObj[key] = maskSensitiveData(value);
    } else {
      maskedObj[key] = value;
    }
  }

  return maskedObj;
}
