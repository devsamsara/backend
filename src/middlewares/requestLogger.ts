import morgan, { StreamOptions } from 'morgan';
import { LoggerUtils } from '../utils/logger.utils';

const stream: StreamOptions = {
  write: (message: string) => LoggerUtils.http(message.trim()),
};

const skip = () => process.env.NODE_ENV === 'test';

export const requestLogger = morgan(
    process.env.NODE_ENV === 'development' ? 'dev' : 'combined',
  { stream, skip },
);
