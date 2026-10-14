const jwt = require('jsonwebtoken');

class TokenService {
  sign(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('Falta JWT_SECRET en las variables de entorno');
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  verify(token) {
    const secret = process.env.JWT_SECRET;
    return jwt.verify(token, secret);
  }
}

module.exports = new TokenService();
