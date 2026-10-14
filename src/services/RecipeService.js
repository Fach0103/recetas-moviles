const recipeRepository = require('../repositories/RecipeRepository');
const groupRepository = require('../repositories/GroupRepository');
const normalizeText = require('../utils/normalizeText');
const AppError = require('../utils/AppError');

class RecipeService {
  constructor(repository, groupsRepo) {
    this.recipeRepository = repository;
    this.groupRepository = groupsRepo;
  }

  async create(authorId, data) {
    const payload = this._validateAndBuildPayload(data);
    await this._assertTitleAvailable(payload.titleNormalized);

    const recipe = await this.recipeRepository.create({
      ...payload,
      author: authorId,
      groups: [],
    });
    return recipe.toPublicJSON();
  }

  /** "Mis recetas": todas las del usuario, públicas o privadas. */
  async listMine(authorId) {
    const recipes = await this.recipeRepository.findMineSorted(authorId);
    return recipes.map((r) => r.toPublicJSON());
  }

  /** "Recetas generales": públicas, de cualquier usuario. */
  async listPublic() {
    const recipes = await this.recipeRepository.findPublicSorted();
    return recipes.map((r) => r.toPublicJSON());
  }

  async getById(recipeId, requesterId) {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) throw AppError.notFound('Receta no encontrada');

    const isOwner = recipe.author.toString() === requesterId;
    if (!recipe.isPublic && !isOwner) {
      throw AppError.forbidden('No tienes acceso a esta receta');
    }
    return recipe.toPublicJSON();
  }

  async update(recipeId, requesterId, data) {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) throw AppError.notFound('Receta no encontrada');
    if (recipe.author.toString() !== requesterId) {
      throw AppError.forbidden('Solo el autor puede editar esta receta');
    }

    const payload = this._validateAndBuildPayload(data, { partial: true });

    if (payload.titleNormalized && payload.titleNormalized !== recipe.titleNormalized) {
      await this._assertTitleAvailable(payload.titleNormalized);
    }

    const updated = await this.recipeRepository.updateById(recipeId, payload);
    return updated.toPublicJSON();
  }

  async remove(recipeId, requesterId) {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) throw AppError.notFound('Receta no encontrada');
    if (recipe.author.toString() !== requesterId) {
      throw AppError.forbidden('Solo el autor puede borrar esta receta');
    }

    // Al borrar una receta solo desaparece ella misma; los grupos a los
    // que pertenecía (recipe.groups) no se tocan, porque la relación vive
    // en este documento, no en el de Group.
    await this.recipeRepository.deleteById(recipeId);
    return true;
  }

  /** Usado por UserService al borrar una cuenta: elimina todas sus recetas. */
  async removeAllByAuthor(authorId) {
    await this.recipeRepository.deleteMany({ author: authorId });
  }

  /**
   * Reemplaza la lista de grupos de una receta. Una receta puede estar
   * en varios grupos a la vez; solo el autor de la receta puede asignarla,
   * y solo a grupos que también le pertenezcan a él.
   */
  async setGroups(recipeId, requesterId, groupIds) {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) throw AppError.notFound('Receta no encontrada');
    if (recipe.author.toString() !== requesterId) {
      throw AppError.forbidden('Solo el autor puede modificar los grupos de esta receta');
    }

    if (!Array.isArray(groupIds)) {
      throw AppError.badRequest('groupIds debe ser un arreglo de ids de grupo');
    }

    const uniqueIds = [...new Set(groupIds.map(String))];

    if (uniqueIds.length > 0) {
      const found = await this.groupRepository.findByIdsAndOwner(uniqueIds, requesterId);
      if (found.length !== uniqueIds.length) {
        throw AppError.badRequest('Uno o más grupos no existen o no te pertenecen');
      }
    }

    const updated = await this.recipeRepository.updateById(recipeId, { groups: uniqueIds });
    return updated.toPublicJSON();
  }

  _validateAndBuildPayload(data, { partial = false } = {}) {
    const {
      title,
      description,
      ingredients,
      steps,
      prepTime,
      servings,
      category,
      image,
      isPublic,
    } = data;

    const payload = {};

    if (!partial || title !== undefined) {
      if (!title || !title.trim()) {
        throw AppError.badRequest('El título es obligatorio');
      }
      payload.title = title.trim();
      payload.titleNormalized = normalizeText(title);
    }

    if (!partial || ingredients !== undefined) {
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw AppError.badRequest('Debes agregar al menos un ingrediente');
      }
      payload.ingredients = ingredients.map((ing) => ({
        name: (ing.name || '').trim(),
        quantity: ing.quantity ? String(ing.quantity).trim() : '',
        unit: ing.unit ? String(ing.unit).trim() : '',
      }));
      if (payload.ingredients.some((ing) => !ing.name)) {
        throw AppError.badRequest('Cada ingrediente necesita un nombre');
      }
    }

    if (!partial || steps !== undefined) {
      if (!Array.isArray(steps) || steps.length === 0) {
        throw AppError.badRequest('Debes agregar al menos un paso');
      }
      payload.steps = steps.map((s) => String(s).trim()).filter(Boolean);
      if (payload.steps.length === 0) {
        throw AppError.badRequest('Los pasos no pueden estar vacíos');
      }
    }

    if (description !== undefined) payload.description = String(description).trim();
    if (prepTime !== undefined) payload.prepTime = Number(prepTime);
    if (servings !== undefined) payload.servings = Number(servings);
    if (category !== undefined) payload.category = String(category).trim();
    if (image !== undefined) payload.image = String(image).trim();
    if (isPublic !== undefined) payload.isPublic = Boolean(isPublic);

    return payload;
  }

  async _assertTitleAvailable(titleNormalized) {
    const existing = await this.recipeRepository.findByTitleNormalized(titleNormalized);
    if (existing) {
      throw AppError.conflict('Ya existe una receta con ese título');
    }
  }
}

module.exports = new RecipeService(recipeRepository, groupRepository);
