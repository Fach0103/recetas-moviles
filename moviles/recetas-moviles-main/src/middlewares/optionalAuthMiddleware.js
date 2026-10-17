const tokenService = require('../utils/TokenService');

/**
 * Igual que authMiddleware, pero no bloquea la petición si no hay token.
 * Si el token es válido, agrega req.userId. Si no hay token o es inválido,
 * sigue sin userId (lo usan rutas públicas que cambian de comportamiento
 * cuando el usuario sí está logueado, ej. GET /recipes/:id).
 */
function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = tokenService.verify(token);
      req.userId = payload.sub;
    } catch (err) {
      // token inválido/expirado: se ignora, la petición sigue como anónima
    }
  }

  next();
}

module.exports = optionalAuthMiddleware;
