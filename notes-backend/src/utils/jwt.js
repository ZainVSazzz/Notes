import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '10h';

// ponytail: fraction of total lifetime; tune if needed
const REFRESH_THRESHOLD_RATIO = 0.25;

export function createAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      nik: user.nik,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Cek apakah token hampir expired (sisa < 25% dari total lifetime).
 * Return { shouldRefresh, decoded } — caller decide mau refresh atau tidak.
 */
export function shouldRefreshToken(decoded) {
  if (!decoded.iat || !decoded.exp) return false;

  const totalLifetime = decoded.exp - decoded.iat;
  const remaining = decoded.exp - Math.floor(Date.now() / 1000);

  return remaining < totalLifetime * REFRESH_THRESHOLD_RATIO;
}