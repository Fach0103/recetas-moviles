const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/UserRepository');
const tokenService = require('../utils/TokenService');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;

class UserService {
  constructor(repository, tokens) {
    this.userRepository = repository;
    // Se inyecta de forma perezosa (ver deleteAccount) para evitar un
    // require circular: RecipeService no depende de UserService.
    this.tokenService = tokens;
  }

  async register({ name, email, password }) {
    if (!name || !email || !password) {
      throw AppError.badRequest('name, email y password son obligatorios');
    }
    if (password.length < 6) {
      throw AppError.badRequest('La contraseña debe tener al menos 6 caracteres');
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw AppError.conflict('Ya existe una cuenta con ese email');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
    });

    const token = this._issueToken(user);
    return { user: user.toPublicJSON(), token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw AppError.badRequest('email y password son obligatorios');
    }

    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const token = this._issueToken(user);
    return { user: user.toPublicJSON(), token };
  }

  async getById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return user.toPublicJSON();
  }

  async updateProfile(userId, { name, email, password }) {
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) throw AppError.badRequest('El nombre no puede estar vacío');
      updates.name = name.trim();
    }

    if (email !== undefined) {
      const normalized = email.toLowerCase().trim();
      const existing = await this.userRepository.findByEmail(normalized);
      if (existing && existing._id.toString() !== userId) {
        throw AppError.conflict('Ese email ya está en uso');
      }
      updates.email = normalized;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        throw AppError.badRequest('La contraseña debe tener al menos 6 caracteres');
      }
      updates.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest('No se enviaron campos para actualizar');
    }

    const user = await this.userRepository.updateById(userId, updates);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return user.toPublicJSON();
  }

  async deleteAccount(userId) {
    const user = await this.userRepository.deleteById(userId);
    if (!user) throw AppError.notFound('Usuario no encontrado');

    // Cascada: al borrar la cuenta desaparecen sus recetas y sus grupos.
    // require() aquí (no arriba) evita el ciclo de módulos.
    const recipeService = require('./RecipeService');
    const groupService = require('./GroupService');
    await recipeService.removeAllByAuthor(userId);
    await groupService.removeAllByOwner(userId);

    return true;
  }

  _issueToken(user) {
    return this.tokenService.sign({ sub: user._id.toString() });
  }
}

module.exports = new UserService(userRepository, tokenService);
