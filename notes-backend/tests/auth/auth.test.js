import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../../src/app.js';
import { setupLogin } from '../setupLogin.js';

describe('Auth API', () => {
  it('berhasil login dan mendapatkan accessToken dari cookie', async () => {
    const { accessToken, user } = await setupLogin();

    expect(accessToken).toBeTruthy();
    expect(user).toBeTruthy();
    expect(user.username).toBeTruthy();
  });

  it('berhasil akses /api/auth/me menggunakan agent login', async () => {
    const { agent } = await setupLogin();

    const response = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Data user berhasil diambil');
    expect(response.body.data.user).toBeTruthy();
  });

  it('berhasil akses /api/auth/me menggunakan authCookie manual', async () => {
    const { authCookie } = await setupLogin();

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.data.user).toBeTruthy();
  });
});