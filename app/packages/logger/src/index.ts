const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const SENSITIVE_KEYS = ["api_key", "apikey", "api_secret", "apisecret", "private_key", "privatekey", "password", "token", "secret"];

function maskObject(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(maskObject);
  }

  const masked: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk));
    if (isSensitive && typeof value === "string") {
      masked[key] = "********";
    } else if (typeof value === "object") {
      masked[key] = maskObject(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private formatMessage(level: string, color: string, message: string, context?: any) {
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

    let logString = "";
    if (isProd) {
      logString = `[${timestamp}] [${this.service}] ${level}: ${message}`;
    } else {
      logString = `${colors.gray}[${timestamp}]${colors.reset} ${colors.cyan}[${this.service}]${colors.reset} ${color}${level}:${colors.reset} ${message}`;
    }
    
    if (context) {
      const maskedContext = maskObject(context);
      if (isProd) {
        logString += ` ${JSON.stringify(maskedContext)}`;
      } else {
        logString += `\n${colors.gray}${JSON.stringify(maskedContext, null, 2)}${colors.reset}`;
      }
    }
    
    return logString;
  }

  info(message: string, context?: any) {
    console.log(this.formatMessage("INFO", colors.green, message, context));
  }

  warn(message: string, context?: any) {
    console.warn(this.formatMessage("WARN", colors.yellow, message, context));
  }

  error(message: string, context?: any) {
    console.error(this.formatMessage("ERROR", colors.red, message, context));
  }

  debug(message: string, context?: any) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage("DEBUG", colors.blue, message, context));
    }
  }
}

export function createLogger(service: string) {
  return new Logger(service);
}
