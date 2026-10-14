/**
 * Repository base: encapsula el acceso a datos de un modelo Mongoose.
 * Ninguna otra capa (Service, Controller) debe importar Mongoose
 * directamente; todas pasan por aquí o por una subclase de esto.
 */
class BaseRepository {
  constructor(model) {
    if (!model) {
      throw new Error('BaseRepository requiere un modelo de Mongoose');
    }
    this.model = model;
  }

  async create(data) {
    const doc = await this.model.create(data);
    return doc;
  }

  async findById(id, { withSelect } = {}) {
    let query = this.model.findById(id);
    if (withSelect) query = query.select(withSelect);
    return query.exec();
  }

  async findOne(filter, { withSelect } = {}) {
    let query = this.model.findOne(filter);
    if (withSelect) query = query.select(withSelect);
    return query.exec();
  }

  async find(filter = {}, options = {}) {
    const { sort, withSelect, populate } = options;
    let query = this.model.find(filter);
    if (withSelect) query = query.select(withSelect);
    if (sort) query = query.sort(sort);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async updateById(id, data) {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(filter) {
    return this.model.deleteMany(filter).exec();
  }

  async updateMany(filter, data) {
    return this.model.updateMany(filter, data).exec();
  }

  async countDocuments(filter = {}) {
    return this.model.countDocuments(filter).exec();
  }
}

module.exports = BaseRepository;
