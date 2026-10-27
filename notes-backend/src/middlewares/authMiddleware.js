import { verifyAuthToken, createAuthToken, shouldRefreshToken } from "../utils/jwt.js";
import { sendFail } from "../utils/response.js";
import { authCookieOptions, clearCookieOptions } from "../utils/cookieOptions.js";

export function authMiddleware(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    return sendFail(req, res, {
      statusCode: 401,
      message: "Token tidak ditemukan, silakan login",
      event: "auth.token.missing",
    });
  }

  try {
    const decoded = verifyAuthToken(token);

    req.user = decoded;

    // Auto-refresh: token hampir expired → issue token baru via cookie
    if (shouldRefreshToken(decoded)) {
      const newToken = createAuthToken(decoded);
      res.cookie("auth_token", newToken, authCookieOptions);
    }

    return next();
  } catch (error) {
    // Token tidak valid/kedaluwarsa: hapus cookie basi agar client tidak
    // terus-terusan mengirim token mati dan bisa langsung login ulang.
    res.clearCookie("auth_token", clearCookieOptions);

    if (error.name === "TokenExpiredError") {
      return sendFail(req, res, {
        statusCode: 401,
        message: "Sesi anda telah berakhir, silakan login kembali",
        event: "auth.token.expired",
        meta: {
          expiredAt: error.expiredAt,
        },
      });
    }

    return sendFail(req, res, {
      statusCode: 401,
      message: "Token tidak valid, silakan login kembali",
      event: "auth.token.invalid",
    });
  }
}
