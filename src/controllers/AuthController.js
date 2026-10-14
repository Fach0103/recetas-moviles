const userService = require('../services/UserService');

class AuthController {
  constructor(service) {
    this.userService = service;
    // bind para poder pasar los métodos directo a Express sin perder "this"
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await this.userService.register({ name, email, password });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.userService.login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController(userService);
