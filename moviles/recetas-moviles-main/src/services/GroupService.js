const mongoose = require('mongoose');
const groupRepository = require('../repositories/GroupRepository');
const recipeRepository = require('../repositories/RecipeRepository');
const AppError = require('../utils/AppError');

class GroupService {
  constructor(repository, recipesRepo) {
    this.groupRepository = repository;
    this.recipeRepository = recipesRepo;
  }

  async create(ownerId, { name, description }) {
    if (!name || !name.trim()) {
      throw AppError.badRequest('El nombre del grupo es obligatorio');
    }
    const group = await this.groupRepository.create({
      name: name.trim(),
      description: description ? String(description).trim() : '',
      owner: ownerId,
    });
    return group.toPublicJSON();
  }

  async listMine(ownerId) {
    const groups = await this.groupRepository.findByOwnerSorted(ownerId);
    return groups.map((g) => g.toPublicJSON());
  }

  async getById(groupId, requesterId) {
    const group = await this._findOwnedOrThrow(groupId, requesterId);
    return group.toPublicJSON();
  }

  async update(groupId, requesterId, { name, description }) {
    await this._findOwnedOrThrow(groupId, requesterId);

    const updates = {};
    if (name !== undefined) {
      if (!name.trim()) throw AppError.badRequest('El nombre del grupo no puede estar vacío');
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = String(description).trim();
    }
    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest('No se enviaron campos para actualizar');
    }

    const updated = await this.groupRepository.updateById(groupId, updates);
    return updated.toPublicJSON();
  }

  /**
   * Para que el front muestre el aviso ANTES de confirmar el borrado:
   * cuántas recetas se van a borrar (solo están en este grupo) y
   * cuántas se van a conservar (también están en otros grupos).
   */
  async getDeletePreview(groupId, requesterId) {
    await this._findOwnedOrThrow(groupId, requesterId);

    const recipes = await this.recipeRepository.find({ groups: groupId });
    const willDelete = recipes.filter((r) => r.groups.length === 1).length;
    const willKeep = recipes.length - willDelete;

    return {
      totalRecipesInGroup: recipes.length,
      recipesToDelete: willDelete,
      recipesToKeep: willKeep,
    };
  }

  /**
   * Borra el grupo. Las recetas que están SOLO en este grupo se borran
   * por completo. Las que también están en otros grupos se conservan,
   * simplemente salen de este grupo.
   */
  async remove(groupId, requesterId) {
    await this._findOwnedOrThrow(groupId, requesterId);

    const recipes = await this.recipeRepository.model.find({ groups: groupId });

    const soloIds = recipes.filter((r) => r.groups.length === 1).map((r) => r._id);
    const sharedIds = recipes.filter((r) => r.groups.length > 1).map((r) => r._id);

    if (soloIds.length > 0) {
      await this.recipeRepository.model.deleteMany({ _id: { $in: soloIds } });
    }
    if (sharedIds.length > 0) {
      await this.recipeRepository.model.updateMany(
        { _id: { $in: sharedIds } },
        { $pull: { groups: groupId } }
      );
    }

    await this.groupRepository.model.findByIdAndDelete(groupId);

    return { deletedRecipes: soloIds.length, keptRecipes: sharedIds.length };
  }

  /** Recetas que pertenecen a este grupo, ordenadas alfabéticamente. */
  async getRecipes(groupId, requesterId) {
    await this._findOwnedOrThrow(groupId, requesterId);
    const recipes = await this.recipeRepository.findSortedAlphabetically({ groups: groupId });
    return recipes.map((r) => r.toPublicJSON());
  }

  /** Usado por UserService al borrar una cuenta: borra todos sus grupos. */
  async removeAllByOwner(ownerId) {
    await this.groupRepository.deleteMany({ owner: ownerId });
  }

  async _findOwnedOrThrow(groupId, requesterId) {
    const group = await this.groupRepository.findById(groupId);
    if (!group) throw AppError.notFound('Grupo no encontrado');
    if (group.owner.toString() !== requesterId) {
      throw AppError.forbidden('Solo el dueño puede acceder a este grupo');
    }
    return group;
  }
}

module.exports = new GroupService(groupRepository, recipeRepository);
