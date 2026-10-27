import 'dotenv/config';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../src/app.js';

function getCookieValue(setCookieHeaders, cookieName) {
  const cookies = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];

  const cookie = cookies.find((item) => {
    return item?.startsWith(`${cookieName}=`);
  });

  if (!cookie) {
    return null;
  }

  const value = cookie.split(';')[0].split('=')[1];

  return decodeURIComponent(value);
}

function requireEnv(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`ENV ${key} belum diatur`);
  }

  return value;
}

export async function setupLogin(options = {}) {
  const identifier = 'zainuri'; 

  const captchaSecret = requireEnv('CAPTCHA_SECRET');

  const agent = request.agent(app);

  const captchaResponse = await agent
    .get('/api/auth/captcha')
    .expect(200);

  const captchaToken = getCookieValue(
    captchaResponse.headers['set-cookie'],
    'captcha_token'
  );

  if (!captchaToken) {
    throw new Error('Cookie captcha_token tidak ditemukan');
  }

  const decodedCaptcha = jwt.verify(captchaToken, captchaSecret);

  if (!decodedCaptcha.correctOptionId) {
    throw new Error('correctOptionId tidak ditemukan di captcha_token');
  }

  const loginResponse = await agent
    .post('/api/auth/login')
    .send({
      identifier,
      captchaOptionId: decodedCaptcha.correctOptionId
    })
    .expect(200);

  const accessToken = getCookieValue(
    loginResponse.headers['set-cookie'],
    'auth_token'
  );

  if (!accessToken) {
    throw new Error('Cookie auth_token tidak ditemukan');
  }

  const authCookie = `auth_token=${accessToken}`;

  return {
    agent,
    accessToken,
    authCookie,
    user: loginResponse.body.data.user,
    loginResponse
  };
}