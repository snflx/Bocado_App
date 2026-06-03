import mongoose from "mongoose";

export function notFound(_req, _res, next) {
  const error = new Error("Ruta no encontrada");
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let message = error.message || "Error interno del servidor";

  if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = "Identificador invalido";
  }

  if (error.code === 11000) {
    status = 409;
    message = "Ya existe un registro con esos datos";
  }

  if (error.name === "TimeoutError") {
    status = 503;
    message = "El servidor tardo demasiado en responder";
  }

  if (status === 500) {
    console.error("[ERROR]", error);
  }

  if (status === 500 && process.env.NODE_ENV === "production") {
    message = "Error interno del servidor";
  }

  res.status(status).json({ message, status });
}
