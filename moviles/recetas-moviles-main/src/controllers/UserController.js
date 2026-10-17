const userService = require('../services/UserService');

class UserController {
  constructor(service) {
    this.userService = service;
    this.getMe = this.getMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.deleteMe = this.deleteMe.bind(this);
  }

  async getMe(req, res, next) {
    try {
      const user = await this.userService.getById(req.userId);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const user = await this.userService.updateProfile(req.userId, {
        name,
        email,
        password,
      });
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  async deleteMe(req, res, next) {
    try {
      await this.userService.deleteAccount(req.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController(userService);
