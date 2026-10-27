import { db } from '../../config/db.js';

class CatatanModel {
  getSortOrder(sort = 'terbaru') {
    const sortMap = {
      terbaru: 'updtime DESC, id DESC',
      terlama: 'updtime ASC, id ASC',
      populer: 'klik DESC, updtime DESC',
      unpopuler: 'klik ASC, updtime DESC'
    };

    return sortMap[sort] || sortMap.terbaru;
  }

  buildSearchWhere(search, params) {
    if (!search || String(search).trim() === '') {
      return '';
    }

    const keyword = `%${String(search).trim()}%`;

    params.push(keyword, keyword, keyword, keyword);

    return `
      AND (
        judul LIKE ?
        OR isi LIKE ?
        OR solusi LIKE ?
        OR nama LIKE ?
      )
    `;
  }

  buildPagination(page, limit) {
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number(limit) > 0 ? Number(limit) : 10;

    const finalLimit = safeLimit > 50 ? 50 : safeLimit;
    const offset = (safePage - 1) * finalLimit;

    return {
      page: safePage,
      limit: finalLimit,
      offset
    };
  }

  async findPublicCatatan({
    page = 1,
    limit = 10,
    search = '',
    sort = 'terbaru'
  }) {
    const pagination = this.buildPagination(page, limit);
    const orderBy = this.getSortOrder(sort);

    const params = ['public', 'show'];
    const searchWhere = this.buildSearchWhere(search, params);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM catatanapp
      WHERE status = ?
      AND keterangan = ?
      ${searchWhere}
    `;

    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT
        id,
        judul,
        gambar,
        isi,
        solusi,
        tanggal,
        updtime,
        nama,
        status,
        keterangan,
        klik
      FROM catatanapp
      WHERE status = ?
      AND keterangan = ?
      ${searchWhere}
      ORDER BY ${orderBy}
      LIMIT ${pagination.limit}
      OFFSET ${pagination.offset}
    `;

    const [rows] = await db.execute(dataSql, params);

    return {
      rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPage: Math.ceil(total / pagination.limit)
      }
    };
  }

  async findPublicCatatanById(id) {
    const sql = `
      SELECT
        id,
        judul,
        gambar,
        isi,
        solusi,
        tanggal,
        updtime,
        nama,
        status,
        keterangan,
        klik
      FROM catatanapp
      WHERE id = ?
      AND status = 'public'
      AND keterangan = 'show'
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [id]);

    return rows[0] || null;
  }

  async findMyCatatan({
    ownerName,
    page = 1,
    limit = 10,
    search = '',
    status = '',
    sort = 'terbaru'
  }) {
    const pagination = this.buildPagination(page, limit);
    const orderBy = this.getSortOrder(sort);

    const params = [ownerName, 'show'];

    let statusWhere = '';

    if (status === 'public' || status === 'private') {
      statusWhere = 'AND status = ?';
      params.push(status);
    }

    const searchWhere = this.buildSearchWhere(search, params);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM catatanapp
      WHERE nama = ?
      AND keterangan = ?
      ${statusWhere}
      ${searchWhere}
    `;

    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT
        id,
        judul,
        gambar,
        isi,
        solusi,
        tanggal,
        updtime,
        nama,
        status,
        keterangan,
        klik
      FROM catatanapp
      WHERE nama = ?
      AND keterangan = ?
      ${statusWhere}
      ${searchWhere}
      ORDER BY ${orderBy}
      LIMIT ${pagination.limit}
      OFFSET ${pagination.offset}
    `;

    const [rows] = await db.execute(dataSql, params);

    return {
      rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPage: Math.ceil(total / pagination.limit)
      }
    };
  }

  async findTrashCatatan({
    ownerName,
    page = 1,
    limit = 10,
    search = '',
    sort = 'terbaru'
  }) {
    const pagination = this.buildPagination(page, limit);
    const orderBy = this.getSortOrder(sort);

    const params = [ownerName, 'hide'];
    const searchWhere = this.buildSearchWhere(search, params);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM catatanapp
      WHERE nama = ?
      AND keterangan = ?
      ${searchWhere}
    `;

    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT
        id,
        judul,
        gambar,
        isi,
        solusi,
        tanggal,
        updtime,
        nama,
        status,
        keterangan,
        klik
      FROM catatanapp
      WHERE nama = ?
      AND keterangan = ?
      ${searchWhere}
      ORDER BY ${orderBy}
      LIMIT ${pagination.limit}
      OFFSET ${pagination.offset}
    `;

    const [rows] = await db.execute(dataSql, params);

    return {
      rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPage: Math.ceil(total / pagination.limit)
      }
    };
  }

  async findMyCatatanById(id, ownerName) {
    const sql = `
      SELECT
        id,
        judul,
        gambar,
        isi,
        solusi,
        tanggal,
        updtime,
        nama,
        status,
        keterangan,
        klik
      FROM catatanapp
      WHERE id = ?
      AND nama = ?
      AND keterangan = 'show'
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [id, ownerName]);

    return rows[0] || null;
  }

  async findAccessibleCatatanForCopy(id, ownerName) {
    const sql = `
      SELECT
        id,
        judul,
        isi,
        solusi,
        nama,
        status,
        keterangan,
        klik
      FROM catatanapp
      WHERE id = ?
      AND keterangan = 'show'
      AND (
        status = 'public'
        OR nama = ?
      )
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [id, ownerName]);

    return rows[0] || null;
  }

  async createCatatan(payload) {
    const sql = `
      INSERT INTO catatanapp
      (
        judul,
        gambar,
        isi,
        solusi,
        nama,
        status,
        keterangan,
        klik
      )
      VALUES (?, ?, ?, ?, ?, ?, 'show', 1)
    `;

    const [result] = await db.execute(sql, [
      payload.judul,
      payload.gambar || null,
      payload.isi || null,
      payload.solusi,
      payload.nama,
      payload.status
    ]);

    return result.insertId;
  }

  async updateCatatan(id, ownerName, payload) {
    const fields = [];
    const params = [];

    if (payload.judul !== undefined) {
      fields.push('judul = ?');
      params.push(payload.judul);
    }

    if (payload.gambar !== undefined) {
      fields.push('gambar = ?');
      params.push(payload.gambar || null);
    }

    if (payload.isi !== undefined) {
      fields.push('isi = ?');
      params.push(payload.isi || null);
    }

    if (payload.solusi !== undefined) {
      fields.push('solusi = ?');
      params.push(payload.solusi);
    }

    if (payload.status !== undefined) {
      fields.push('status = ?');
      params.push(payload.status);
    }

    if (fields.length === 0) {
      return 0;
    }

    params.push(id, ownerName);

    const sql = `
      UPDATE catatanapp
      SET ${fields.join(', ')}
      WHERE id = ?
      AND nama = ?
      AND keterangan = 'show'
    `;

    const [result] = await db.execute(sql, params);

    return result.affectedRows;
  }

  async updateStatus(id, ownerName, status) {
    const sql = `
      UPDATE catatanapp
      SET status = ?
      WHERE id = ?
      AND nama = ?
      AND keterangan = 'show'
    `;

    const [result] = await db.execute(sql, [status, id, ownerName]);

    return result.affectedRows;
  }

  async updateKeterangan(id, ownerName, keterangan) {
    const sql = `
      UPDATE catatanapp
      SET keterangan = ?
      WHERE id = ?
      AND nama = ?
    `;

    const [result] = await db.execute(sql, [keterangan, id, ownerName]);

    return result.affectedRows;
  }

  async incrementKlik(id) {
    const sql = `
      UPDATE catatanapp
      SET klik = COALESCE(klik, 0) + 1
      WHERE id = ?
    `;

    await db.execute(sql, [id]);
  }
}

export const catatanModel = new CatatanModel();