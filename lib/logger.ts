import { CONFIG } from '@/config/config';
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const extras = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${extras}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: false }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: CONFIG.logLevel,
  format: !CONFIG.isDev ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;