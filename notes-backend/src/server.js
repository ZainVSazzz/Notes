import dotenv from 'dotenv';
import app from './app.js';
import { logger } from './config/logger.js';

dotenv.config();

const PORT = process.env.APP_PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on ${PORT}`);
});