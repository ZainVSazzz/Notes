import { authModel } from "./model.js";
import { generateCaptcha, verifyCaptchaToken } from "../../utils/captcha.js";
import { createAuthToken } from "../../utils/jwt.js";
import {
  authCookieOptions,
  captchaCookieOptions,
  clearCookieOptions,
} from "../../utils/cookieOptions.js";
import { sendSuccess, sendFail } from "../../utils/response.js";

export async function getCaptcha(req, res, next) {
  try {
    const captcha = generateCaptcha();

    res.cookie("captcha_token", captcha.token, captchaCookieOptions);

    return sendSuccess(req, res, {
      message: "Captcha berhasil dibuat",
      data: {
        questionSvg: captcha.questionSvg,
        options: captcha.options,
        expiresIn: captcha.expiresIn
      },
      event: "auth.captcha.created",
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, captchaOptionId } = req.body;

    const isCaptchaValid = verifyCaptchaToken(
      req.cookies.captcha_token,
      captchaOptionId,
    );

    res.clearCookie("captcha_token", clearCookieOptions);

    if (!isCaptchaValid) {
      return sendFail(req, res, {
        statusCode: 400,
        message: "Captcha tidak valid atau sudah kedaluwarsa",
        event: "auth.login.invalid_captcha",
        meta: {
          identifier,
        },
      });
    }

    const user = await authModel.findUserByUsernameOrNik(identifier);

    if (!user) {
      return sendFail(req, res, {
        statusCode: 404,
        message: "Username atau NIK tidak terdaftar",
        event: "auth.login.user_not_found",
        meta: {
          identifier,
        },
      });
    }

    if (user.status !== "active") {
      return sendFail(req, res, {
        statusCode: 403,
        message: "Akun tidak aktif",
        event: "auth.login.inactive_user",
        meta: {
          targetUserId: user.id,
          username: user.username,
        },
      });
    }

    const token = createAuthToken(user);

    res.cookie("auth_token", token, authCookieOptions);

    return sendSuccess(req, res, {
      message: "Login berhasil",
      data: {
        user,
      },
      event: "auth.login.success",
      meta: {
        targetUserId: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    res.clearCookie("auth_token", clearCookieOptions);

    return sendSuccess(req, res, {
      message: "Logout berhasil",
      data: null,
      event: "auth.logout.success",
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authModel.findUserById(req.user.id);

    if (!user) {
      return sendFail(req, res, {
        statusCode: 404,
        message: "User tidak ditemukan",
        event: "auth.me.user_not_found",
        meta: {
          targetUserId: req.user.id,
        },
      });
    }

    return sendSuccess(req, res, {
      message: "Data user berhasil diambil",
      data: {
        user,
      },
      event: "auth.me.success",
      meta: {
        targetUserId: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
}
