import { uploadModel } from './model.js';
import { sendSuccess, sendFail } from '../../utils/response.js';

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return sendFail(req, res, {
        statusCode: 400,
        message: 'File gambar wajib diupload',
        event: 'upload.image.empty'
      });
    }

    const result = uploadModel.saveImage(req.file);

    return sendSuccess(req, res, {
      statusCode: 201,
      message: result.reused
        ? 'Gambar sudah ada, menggunakan file yang sama'
        : 'Gambar berhasil diupload',
      data: {
        imageUrl: result.imageUrl,
        filename: result.filename,
        reused: result.reused
      },
      event: result.reused
        ? 'upload.image.reused'
        : 'upload.image.success',
      meta: {
        filename: result.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        reused: result.reused
      }
    });
  } catch (error) {
    next(error);
  }
}