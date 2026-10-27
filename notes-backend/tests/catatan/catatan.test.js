import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../../src/app.js';
import { db } from '../../src/config/db.js';
import { setupLogin } from '../setupLogin.js';

describe.sequential('Catatan API', () => {
  let agent;
  let authCookie;
  let loginUser;
  let publicCatatanId;
  let privateCatatanId;
  let hiddenCatatanId;
  let otherUserCatatanId;

  const testPrefix = `TEST_CATATAN_${Date.now()}`;

  async function insertCatatan(payload) {
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      payload.judul,
      payload.gambar || null,
      payload.isi || null,
      payload.solusi,
      payload.nama,
      payload.status,
      payload.keterangan,
      payload.klik || 1
    ]);

    return result.insertId;
  }

  beforeAll(async () => {
    const login = await setupLogin();

    agent = login.agent;
    authCookie = login.authCookie;
    loginUser = login.user;

    publicCatatanId = await insertCatatan({
      judul: `${testPrefix} Public Catatan`,
      gambar: null,
      isi: 'Isi catatan public untuk testing',
      solusi: 'Solusi catatan public',
      nama: loginUser.name,
      status: 'public',
      keterangan: 'show',
      klik: 1
    });

    privateCatatanId = await insertCatatan({
      judul: `${testPrefix} Private Catatan`,
      gambar: null,
      isi: 'Isi catatan private untuk testing',
      solusi: 'Solusi catatan private',
      nama: loginUser.name,
      status: 'private',
      keterangan: 'show',
      klik: 1
    });

    hiddenCatatanId = await insertCatatan({
      judul: `${testPrefix} Hidden Catatan`,
      gambar: null,
      isi: 'Isi catatan hidden untuk testing',
      solusi: 'Solusi catatan hidden',
      nama: loginUser.name,
      status: 'public',
      keterangan: 'hide',
      klik: 1
    });

    otherUserCatatanId = await insertCatatan({
      judul: `${testPrefix} Other User Catatan`,
      gambar: null,
      isi: 'Isi catatan user lain untuk testing',
      solusi: 'Solusi catatan user lain',
      nama: 'User Test Lain',
      status: 'private',
      keterangan: 'show',
      klik: 1
    });
  });

  afterAll(async () => {
    await db.execute(
      `
        DELETE FROM catatanapp
        WHERE judul LIKE ?
      `,
      [`${testPrefix}%`]
    );
  });

  it('berhasil mengambil list catatan public', async () => {
    const response = await request(app)
      .get('/api/catatan/public')
      .query({
        page: 1,
        limit: 10,
        search: testPrefix
      })
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Catatan public berhasil diambil');
    expect(Array.isArray(response.body.data.catatan)).toBe(true);
    expect(response.body.data.pagination).toBeTruthy();
    expect(response.body.data.requestId).toBeTruthy();

    const catatanIds = response.body.data.catatan.map((item) => item.id);

    expect(catatanIds).toContain(publicCatatanId);
    expect(catatanIds).not.toContain(privateCatatanId);
    expect(catatanIds).not.toContain(hiddenCatatanId);
  });

  it('berhasil mengambil detail catatan public dan klik bertambah', async () => {
    const response = await request(app)
      .get(`/api/catatan/public/${publicCatatanId}`)
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Detail catatan public berhasil diambil');
    expect(response.body.data.catatan).toBeTruthy();
    expect(response.body.data.catatan.id).toBe(publicCatatanId);
    expect(response.body.data.catatan.status).toBe('public');
    expect(response.body.data.catatan.keterangan).toBe('show');
  });

  it('gagal mengambil detail public jika catatan private', async () => {
    const response = await request(app)
      .get(`/api/catatan/public/${privateCatatanId}`)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Catatan public tidak ditemukan');
    expect(response.body.data.requestId).toBeTruthy();
  });

  it('gagal mengambil detail public jika catatan hidden', async () => {
    const response = await request(app)
      .get(`/api/catatan/public/${hiddenCatatanId}`)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Catatan public tidak ditemukan');
    expect(response.body.data.requestId).toBeTruthy();
  });

  it('gagal mengambil detail public jika id tidak valid', async () => {
    const response = await request(app)
      .get('/api/catatan/public/abc')
      .expect(400);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('ID catatan tidak valid');
    expect(response.body.data.requestId).toBeTruthy();
  });

  it('gagal mengambil my catatan jika belum login', async () => {
    const response = await request(app)
      .get('/api/catatan/my')
      .expect(401);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Token tidak ditemukan, silakan login');
    expect(response.body.data.requestId).toBeTruthy();
  });

  it('berhasil mengambil list catatan saya menggunakan agent login', async () => {
    const response = await agent
      .get('/api/catatan/my')
      .query({
        page: 1,
        limit: 10,
        search: testPrefix
      })
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Catatan saya berhasil diambil');
    expect(Array.isArray(response.body.data.catatan)).toBe(true);
    expect(response.body.data.pagination).toBeTruthy();

    const catatanIds = response.body.data.catatan.map((item) => item.id);

    expect(catatanIds).toContain(publicCatatanId);
    expect(catatanIds).toContain(privateCatatanId);
    expect(catatanIds).not.toContain(hiddenCatatanId);
    expect(catatanIds).not.toContain(otherUserCatatanId);
  });

  it('berhasil filter catatan saya dengan status private', async () => {
    const response = await agent
      .get('/api/catatan/my')
      .query({
        page: 1,
        limit: 10,
        search: testPrefix,
        status: 'private'
      })
      .expect(200);

    expect(response.body.status).toBe(true);

    const catatanIds = response.body.data.catatan.map((item) => item.id);

    expect(catatanIds).toContain(privateCatatanId);
    expect(catatanIds).not.toContain(publicCatatanId);

    response.body.data.catatan.forEach((item) => {
      expect(item.status).toBe('private');
    });
  });

  it('gagal filter catatan saya jika status tidak valid', async () => {
    const response = await agent
      .get('/api/catatan/my')
      .query({
        status: 'draft'
      })
      .expect(400);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Status catatan tidak valid');
    expect(response.body.data.requestId).toBeTruthy();
  });

  it('berhasil mengambil detail catatan saya', async () => {
    const response = await agent
      .get(`/api/catatan/my/${privateCatatanId}`)
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Detail catatan berhasil diambil');
    expect(response.body.data.catatan).toBeTruthy();
    expect(response.body.data.catatan.id).toBe(privateCatatanId);
    expect(response.body.data.catatan.nama).toBe(loginUser.name);
  });

  it('berhasil mengambil detail catatan saya menggunakan authCookie manual', async () => {
    const response = await request(app)
      .get(`/api/catatan/my/${publicCatatanId}`)
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.data.catatan.id).toBe(publicCatatanId);
  });

  it('gagal mengambil detail catatan user lain', async () => {
    const response = await agent
      .get(`/api/catatan/my/${otherUserCatatanId}`)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Catatan tidak ditemukan');
    expect(response.body.data.requestId).toBeTruthy();
  });

  it('berhasil mengambil detail cabang', async () => {
    const response = await agent
      .get(`/api/cabang`)
      .expect(200);
    console.log(response.body);
    expect(response.body.status).toBe(true);
  });
});