const tokenService = require('../utils/TokenService');
const AppError = require('../utils/AppError');

/**
 * Verifica el header "Authorization: Bearer <token>" y, si es válido,
 * agrega req.userId para que los controladores sepan quién hace la petición.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Falta el token de autenticación'));
  }

  try {
    const payload = tokenService.verify(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
}

module.exports = authMiddleware;
