const groupService = require('../services/GroupService');

class GroupController {
  constructor(service) {
    this.groupService = service;
    this.create = this.create.bind(this);
    this.listMine = this.listMine.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.getDeletePreview = this.getDeletePreview.bind(this);
    this.getRecipes = this.getRecipes.bind(this);
  }

  async create(req, res, next) {
    try {
      const group = await this.groupService.create(req.userId, req.body);
      res.status(201).json({ group });
    } catch (err) {
      next(err);
    }
  }

  async listMine(req, res, next) {
    try {
      const groups = await this.groupService.listMine(req.userId);
      res.status(200).json({ groups });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const group = await this.groupService.getById(req.params.id, req.userId);
      res.status(200).json({ group });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const group = await this.groupService.update(req.params.id, req.userId, req.body);
      res.status(200).json({ group });
    } catch (err) {
      next(err);
    }
  }

  async getDeletePreview(req, res, next) {
    try {
      const preview = await this.groupService.getDeletePreview(req.params.id, req.userId);
      res.status(200).json(preview);
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await this.groupService.remove(req.params.id, req.userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getRecipes(req, res, next) {
    try {
      const recipes = await this.groupService.getRecipes(req.params.id, req.userId);
      res.status(200).json({ recipes });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GroupController(groupService);
