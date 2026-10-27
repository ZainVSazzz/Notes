import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { requestId } from './middlewares/requestId.js';
import { httpLogger, httpErrorLogger } from './middlewares/httpLogger.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';

import authRoute from './modules/auth/route.js';
import { sendFail, sendSuccess } from './utils/response.js';
import catatanRoute from './modules/catatan/route.js';
import uploadRoute from './modules/upload/route.js';
import cabangRoute from './modules/cabang/route.js';

dotenv.config({
  quiet: true
});

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
}));

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestId);
app.use(httpLogger);

app.use('/images', express.static('public/images'));
app.get('/', (req, res) => {
  return sendSuccess(req, res, {
    message: 'Notes Forum API aktif',
    data: null,
    event: 'app.health.success'
  });
});

app.use('/api/auth', authRoute);
app.use('/api/catatan', catatanRoute);
app.use('/api/uploads', uploadRoute);
app.use('/api/cabang', cabangRoute);

app.use((req, res) => {
  return sendFail(req, res, {
    statusCode: 404,
    message: 'Endpoint tidak ditemukan',
    event: 'app.route.not_found',
    meta: {
      url: req.originalUrl
    }
  });
});

app.use(httpErrorLogger);
app.use(errorMiddleware);

export default app;