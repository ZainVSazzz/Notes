import { db } from '../../config/db.js';

class AuthModel {
  async findUserByUsernameOrNik(identifier) {
    const sql = `
      SELECT 
        id,
        username,
        nik,
        name,
        role,
        status,
        created_at,
        updated_at
      FROM users
      WHERE username = ? OR nik = ?
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [identifier, identifier]);

    return rows[0] || null;
  }

  async findUserById(id) {
    const sql = `
      SELECT 
        id,
        username,
        nik,
        name,
        role,
        status,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [id]);

    return rows[0] || null;
  }
}

export const authModel = new AuthModel();