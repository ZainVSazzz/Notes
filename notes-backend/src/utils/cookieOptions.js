// ponytail: parse ms dari JWT_EXPIRES_IN string; upgrade ke `ms` lib jika format makin kompleks
function parseJwtMaxAge(expiresIn) {
  if (!expiresIn) return 36000000; // default 10h

  const match = String(expiresIn).match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 36000000;

  const num = Number(match[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 };

  return num * (unit[match[2]] || 86400000);
}

const jwtMaxAge = parseJwtMaxAge(process.env.JWT_EXPIRES_IN);

// Deteksi HTTPS dari CLIENT_URL
const clientUrl = process.env.CLIENT_URL || '';
const isHttps = clientUrl.startsWith('https://');

// Jika pakai HTTPS → secure + sameSite none (cross-origin support)
// Jika pakai HTTP → tidak secure, sameSite false (tidak kirim header SameSite, agar cookie terkirim cross-port)
const secure = isHttps;
const sameSite = isHttps ? 'none' : false;

export const authCookieOptions = {
  httpOnly: true,
  secure,
  sameSite,
  maxAge: jwtMaxAge,
  path: '/'
};

export const captchaCookieOptions = {
  httpOnly: true,
  secure,
  sameSite,
  maxAge: Number(process.env.CAPTCHA_COOKIE_MAX_AGE || 180000),
  path: '/'
};

export const clearCookieOptions = {
  httpOnly: true,
  secure,
  sameSite,
  path: '/'
};
