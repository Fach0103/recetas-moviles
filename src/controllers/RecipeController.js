const recipeService = require('../services/RecipeService');

class RecipeController {
  constructor(service) {
    this.recipeService = service;
    this.create = this.create.bind(this);
    this.listMine = this.listMine.bind(this);
    this.listPublic = this.listPublic.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.setGroups = this.setGroups.bind(this);
  }

  async create(req, res, next) {
    try {
      const recipe = await this.recipeService.create(req.userId, req.body);
      res.status(201).json({ recipe });
    } catch (err) {
      next(err);
    }
  }

  async listMine(req, res, next) {
    try {
      const recipes = await this.recipeService.listMine(req.userId);
      res.status(200).json({ recipes });
    } catch (err) {
      next(err);
    }
  }

  async listPublic(req, res, next) {
    try {
      const recipes = await this.recipeService.listPublic();
      res.status(200).json({ recipes });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const recipe = await this.recipeService.getById(req.params.id, req.userId);
      res.status(200).json({ recipe });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const recipe = await this.recipeService.update(req.params.id, req.userId, req.body);
      res.status(200).json({ recipe });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await this.recipeService.remove(req.params.id, req.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async setGroups(req, res, next) {
    try {
      const { groupIds } = req.body;
      const recipe = await this.recipeService.setGroups(req.params.id, req.userId, groupIds);
      res.status(200).json({ recipe });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RecipeController(recipeService);
