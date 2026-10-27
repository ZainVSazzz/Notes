import express from 'express';
import {
  getCaptcha,
  login,
  logout,
  me
} from './controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { sendFail } from '../../utils/response.js';

const router = express.Router();

function validateLoginRequest(req, res, next) {
  const { identifier, captchaOptionId } = req.body;

  if (!identifier || String(identifier).trim() === '') {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Username atau NIK wajib diisi',
      event: 'auth.login.validation_failed',
      meta: {
        field: 'identifier'
      }
    });
  }

  if (!captchaOptionId || String(captchaOptionId).trim() === '') {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Pilihan captcha wajib dipilih',
      event: 'auth.login.validation_failed',
      meta: {
        field: 'captchaOptionId'
      }
    });
  }

  next();
}

router.get('/captcha', getCaptcha);
router.post('/login', validateLoginRequest, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

export default router;