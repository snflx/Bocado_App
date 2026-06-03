import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new HttpError(401, "Token de autenticacion requerido");
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select("_id name email role");

    if (!user) {
      throw new HttpError(401, "Usuario no encontrado para este token");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new HttpError(401, "Token invalido o expirado"));
    }
    next(error);
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") {
    return next(new HttpError(403, "Se requieren permisos de administrador"));
  }
  next();
}

export const requireAuthAndAdmin = [requireAuth, requireAdmin];
