import express from 'express';
import multer from 'multer';

import { uploadImage } from './controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { sendFail, sendSuccess } from '../../utils/response.js';

const router = express.Router();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error('Format gambar tidak didukung'));
      return;
    }

    cb(null, true);
  }
});

function uploadSingleImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (error) {
      return sendFail(req, res, {
        statusCode: 400,
        message: error.message || 'Upload gambar gagal',
        event: 'upload.image.failed'
      });
    }

    next();
  });
}

router.get('/test', (req, res) => {
  return sendSuccess(req, res, {
    message: 'Upload route aktif',
    data: null,
    event: 'upload.test.success'
  });
});

router.post(
  '/image',
  authMiddleware,
  uploadSingleImage,
  uploadImage
);

export default router;