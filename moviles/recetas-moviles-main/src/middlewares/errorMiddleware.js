const AppError = require('../utils/AppError');

/**
 * Middleware global de errores. Traduce errores de AppError, de
 * validación de Mongoose y de índices únicos a una respuesta JSON
 * consistente: { message, details }.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details,
    });
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Datos inválidos', details });
  }

  // Índice único duplicado (ej. email repetido)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({
      message: `Ya existe un registro con ese ${field}`,
      details: err.keyValue,
    });
  }

  // CastError: id con formato inválido
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identificador inválido' });
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({ message: 'Error interno del servidor' });
}

function notFoundMiddleware(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorMiddleware, notFoundMiddleware };
