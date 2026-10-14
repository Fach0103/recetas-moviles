/**
 * Error de aplicación con código HTTP. Los Service lanzan esto;
 * el middleware de errores lo traduce a una respuesta JSON.
 */
class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'No autorizado') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Acceso prohibido') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404);
  }

  static conflict(message, details = null) {
    return new AppError(message, 409, details);
  }
}

module.exports = AppError;
