import { catatanModel } from './model.js';
import {
  sendSuccess,
  sendFail
} from '../../utils/response.js';

function getOwnerName(req) {
  return req.user?.name;
}

function buildCopyText(catatan) {
  return [
    catatan.judul,
    '',
    catatan.isi || '',
    '',
    'Penyelesaian:',
    catatan.solusi || ''
  ].join('\n').trim();
}

export async function getPublicCatatan(req, res, next) {
  try {
    const result = await catatanModel.findPublicCatatan({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      sort: req.query.sort
    });

    return sendSuccess(req, res, {
      message: 'Catatan public berhasil diambil',
      data: {
        catatan: result.rows,
        pagination: result.pagination
      },
      event: 'catatan.public.list.success',
      meta: {
        total: result.pagination.total,
        sort: req.query.sort || 'terbaru'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicCatatanDetail(req, res, next) {
  try {
    const { id } = req.params;

    const catatan = await catatanModel.findPublicCatatanById(id);

    if (!catatan) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Catatan public tidak ditemukan',
        event: 'catatan.public.detail.not_found',
        meta: {
          catatanId: id
        }
      });
    }

    return sendSuccess(req, res, {
      message: 'Detail catatan public berhasil diambil',
      data: {
        catatan
      },
      event: 'catatan.public.detail.success',
      meta: {
        catatanId: id
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyCatatan(req, res, next) {
  try {
    const ownerName = getOwnerName(req);

    const result = await catatanModel.findMyCatatan({
      ownerName,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      sort: req.query.sort
    });

    return sendSuccess(req, res, {
      message: 'Catatan saya berhasil diambil',
      data: {
        catatan: result.rows,
        pagination: result.pagination
      },
      event: 'catatan.my.list.success',
      meta: {
        total: result.pagination.total,
        ownerName,
        sort: req.query.sort || 'terbaru'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyCatatanDetail(req, res, next) {
  try {
    const { id } = req.params;
    const ownerName = getOwnerName(req);

    const catatan = await catatanModel.findMyCatatanById(id, ownerName);

    if (!catatan) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Catatan tidak ditemukan',
        event: 'catatan.my.detail.not_found',
        meta: {
          catatanId: id,
          ownerName
        }
      });
    }

    return sendSuccess(req, res, {
      message: 'Detail catatan berhasil diambil',
      data: {
        catatan
      },
      event: 'catatan.my.detail.success',
      meta: {
        catatanId: id,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getTrashCatatan(req, res, next) {
  try {
    const ownerName = getOwnerName(req);

    const result = await catatanModel.findTrashCatatan({
      ownerName,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      sort: req.query.sort
    });

    return sendSuccess(req, res, {
      message: 'Keranjang sampah berhasil diambil',
      data: {
        catatan: result.rows,
        pagination: result.pagination
      },
      event: 'catatan.trash.list.success',
      meta: {
        total: result.pagination.total,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createCatatan(req, res, next) {
  try {
    const ownerName = getOwnerName(req);

    const catatanId = await catatanModel.createCatatan({
      judul: req.body.judul,
      gambar: req.body.gambar,
      isi: req.body.isi,
      solusi: req.body.solusi,
      nama: ownerName,
      status: req.body.status || 'private'
    });

    const catatan = await catatanModel.findMyCatatanById(catatanId, ownerName);

    return sendSuccess(req, res, {
      statusCode: 201,
      message: 'Catatan berhasil dibuat',
      data: {
        catatan
      },
      event: 'catatan.create.success',
      meta: {
        catatanId,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCatatan(req, res, next) {
  try {
    const { id } = req.params;
    const ownerName = getOwnerName(req);

    const affectedRows = await catatanModel.updateCatatan(id, ownerName, {
      judul: req.body.judul,
      gambar: req.body.gambar,
      isi: req.body.isi,
      solusi: req.body.solusi,
      status: req.body.status
    });

    if (affectedRows === 0) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Catatan tidak ditemukan atau tidak bisa diupdate',
        event: 'catatan.update.not_found',
        meta: {
          catatanId: id,
          ownerName
        }
      });
    }

    const catatan = await catatanModel.findMyCatatanById(id, ownerName);

    return sendSuccess(req, res, {
      message: 'Catatan berhasil diupdate',
      data: {
        catatan
      },
      event: 'catatan.update.success',
      meta: {
        catatanId: id,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatusCatatan(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ownerName = getOwnerName(req);

    const affectedRows = await catatanModel.updateStatus(id, ownerName, status);

    if (affectedRows === 0) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Catatan tidak ditemukan atau status tidak bisa diubah',
        event: 'catatan.status.not_found',
        meta: {
          catatanId: id,
          ownerName,
          status
        }
      });
    }

    const catatan = await catatanModel.findMyCatatanById(id, ownerName);

    return sendSuccess(req, res, {
      message: 'Status catatan berhasil diubah',
      data: {
        catatan
      },
      event: 'catatan.status.success',
      meta: {
        catatanId: id,
        ownerName,
        status
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function moveToTrashCatatan(req, res, next) {
  try {
    const { id } = req.params;
    const ownerName = getOwnerName(req);

    const affectedRows = await catatanModel.updateKeterangan(id, ownerName, 'hide');

    if (affectedRows === 0) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Catatan tidak ditemukan atau tidak bisa dihapus',
        event: 'catatan.delete.not_found',
        meta: {
          catatanId: id,
          ownerName
        }
      });
    }

    return sendSuccess(req, res, {
      message: 'Catatan berhasil dipindahkan ke keranjang sampah',
      data: {
        id: Number(id),
        keterangan: 'hide'
      },
      event: 'catatan.delete.success',
      meta: {
        catatanId: id,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreCatatan(req, res, next) {
  try {
    const { id } = req.params;
    const ownerName = getOwnerName(req);

    const affectedRows = await catatanModel.updateKeterangan(id, ownerName, 'show');

    if (affectedRows === 0) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Catatan tidak ditemukan atau tidak bisa direstore',
        event: 'catatan.restore.not_found',
        meta: {
          catatanId: id,
          ownerName
        }
      });
    }

    const catatan = await catatanModel.findMyCatatanById(id, ownerName);

    return sendSuccess(req, res, {
      message: 'Catatan berhasil direstore',
      data: {
        catatan
      },
      event: 'catatan.restore.success',
      meta: {
        catatanId: id,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function copyIsiCatatan(req, res, next) {
  try {
    const { id } = req.params;
    const ownerName = getOwnerName(req);

    const catatan = await catatanModel.findAccessibleCatatanForCopy(id, ownerName);

    if (!catatan) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Catatan tidak ditemukan atau tidak bisa dicopy',
        event: 'catatan.copy_isi.not_found',
        meta: {
          catatanId: id,
          ownerName
        }
      });
    }

    await catatanModel.incrementKlik(id);

    catatan.klik = Number(catatan.klik || 0) + 1;

    return sendSuccess(req, res, {
      message: 'Isi catatan berhasil dicopy',
      data: {
        copyText: catatan.isi || '',
        catatan: {
          id: catatan.id,
          klik: catatan.klik
        }
      },
      event: 'catatan.copy_isi.success',
      meta: {
        catatanId: id,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function copySolusiCatatan(req, res, next) {
  try {
    const { id } = req.params;
    const ownerName = getOwnerName(req);

    const catatan = await catatanModel.findAccessibleCatatanForCopy(id, ownerName);

    if (!catatan) {
      return sendFail(req, res, {
        statusCode: 404,
        message: 'Solusi catatan tidak ditemukan atau tidak bisa dicopy',
        event: 'catatan.copy_solusi.not_found',
        meta: {
          catatanId: id,
          ownerName
        }
      });
    }

    return sendSuccess(req, res, {
      message: 'Solusi catatan berhasil dicopy',
      data: {
        copyText: catatan.solusi || '',
        catatan: {
          id: catatan.id,
          klik: catatan.klik
        }
      },
      event: 'catatan.copy_solusi.success',
      meta: {
        catatanId: id,
        ownerName
      }
    });
  } catch (error) {
    next(error);
  }
}