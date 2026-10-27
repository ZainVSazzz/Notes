import express from 'express';
import {
  getPublicCatatan,
  getPublicCatatanDetail,
  getMyCatatan,
  getMyCatatanDetail,
  getTrashCatatan,
  createCatatan,
  updateCatatan,
  updateStatusCatatan,
  moveToTrashCatatan,
  restoreCatatan,
  copyIsiCatatan,
  copySolusiCatatan
} from './controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { sendFail } from '../../utils/response.js';

const router = express.Router();

const SORT_OPTIONS = ['terbaru', 'terlama', 'populer', 'unpopuler'];
const STATUS_OPTIONS = ['public', 'private'];

function validateIdParam(req, res, next) {
  const { id } = req.params;

  if (!id || Number.isNaN(Number(id)) || Number(id) <= 0) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'ID catatan tidak valid',
      event: 'catatan.validation.invalid_id',
      meta: {
        id
      }
    });
  }

  next();
}

function validateListQuery(req, res, next) {
  const { page, limit, sort } = req.query;

  if (page && (Number.isNaN(Number(page)) || Number(page) <= 0)) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Page tidak valid',
      event: 'catatan.validation.invalid_page',
      meta: {
        page
      }
    });
  }

  if (limit && (Number.isNaN(Number(limit)) || Number(limit) <= 0)) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Limit tidak valid',
      event: 'catatan.validation.invalid_limit',
      meta: {
        limit
      }
    });
  }

  if (sort && !SORT_OPTIONS.includes(sort)) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Sort tidak valid',
      event: 'catatan.validation.invalid_sort',
      meta: {
        sort
      }
    });
  }

  next();
}

function validateMyListQuery(req, res, next) {
  const { status } = req.query;

  if (status && !STATUS_OPTIONS.includes(status)) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Status catatan tidak valid',
      event: 'catatan.validation.invalid_status',
      meta: {
        status
      }
    });
  }

  next();
}

function validateCreateRequest(req, res, next) {
  const { judul, solusi, status } = req.body;

  if (!judul || String(judul).trim() === '') {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Judul wajib diisi',
      event: 'catatan.validation.required',
      meta: {
        field: 'judul'
      }
    });
  }

  if (!solusi || String(solusi).trim() === '') {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Solusi wajib diisi',
      event: 'catatan.validation.required',
      meta: {
        field: 'solusi'
      }
    });
  }

  if (status && !STATUS_OPTIONS.includes(status)) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Status catatan tidak valid',
      event: 'catatan.validation.invalid_status',
      meta: {
        status
      }
    });
  }

  next();
}

function validateUpdateRequest(req, res, next) {
  const allowedFields = ['judul', 'gambar', 'isi', 'solusi', 'status'];
  const bodyKeys = Object.keys(req.body || {});
  const hasAllowedField = bodyKeys.some((key) => allowedFields.includes(key));

  if (!hasAllowedField) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Tidak ada data yang diupdate',
      event: 'catatan.validation.empty_update'
    });
  }

  if (
    req.body.judul !== undefined &&
    String(req.body.judul).trim() === ''
  ) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Judul tidak boleh kosong',
      event: 'catatan.validation.empty_field',
      meta: {
        field: 'judul'
      }
    });
  }

  if (
    req.body.solusi !== undefined &&
    String(req.body.solusi).trim() === ''
  ) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Solusi tidak boleh kosong',
      event: 'catatan.validation.empty_field',
      meta: {
        field: 'solusi'
      }
    });
  }

  if (
    req.body.status !== undefined &&
    !STATUS_OPTIONS.includes(req.body.status)
  ) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Status catatan tidak valid',
      event: 'catatan.validation.invalid_status',
      meta: {
        status: req.body.status
      }
    });
  }

  next();
}

function validateStatusRequest(req, res, next) {
  const { status } = req.body;

  if (!status || !STATUS_OPTIONS.includes(status)) {
    return sendFail(req, res, {
      statusCode: 400,
      message: 'Status catatan tidak valid',
      event: 'catatan.validation.invalid_status',
      meta: {
        status
      }
    });
  }

  next();
}

router.get('/public', validateListQuery, getPublicCatatan);
router.get('/public/:id', validateIdParam, getPublicCatatanDetail);

router.get('/my', authMiddleware, validateListQuery, validateMyListQuery, getMyCatatan);
router.get('/my/:id', authMiddleware, validateIdParam, getMyCatatanDetail);

router.get('/trash', authMiddleware, validateListQuery, getTrashCatatan);

router.post('/', authMiddleware, validateCreateRequest, createCatatan);

router.patch('/:id', authMiddleware, validateIdParam, validateUpdateRequest, updateCatatan);
router.patch('/:id/status', authMiddleware, validateIdParam, validateStatusRequest, updateStatusCatatan);
router.patch('/:id/delete', authMiddleware, validateIdParam, moveToTrashCatatan);
router.patch('/:id/restore', authMiddleware, validateIdParam, restoreCatatan);

router.post('/:id/copy-isi', authMiddleware, validateIdParam, copyIsiCatatan);
router.post('/:id/copy-solusi', authMiddleware, validateIdParam, copySolusiCatatan);

export default router;