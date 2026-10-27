import { db } from '../../config/db.js';

class MasterModel {
  async getCabang() {
    const [rows] = await db.execute(`
      SELECT
        kode_cab,
        nama_cab
      FROM m_cabang
      ORDER BY kode_cab ASC
    `);

    return rows;
  }
}

export const masterModel = new MasterModel();