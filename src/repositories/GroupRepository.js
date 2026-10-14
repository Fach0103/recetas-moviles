const BaseRepository = require('./BaseRepository');
const Group = require('../models/Group');
const ES_COLLATION = require('../utils/esCollation');

class GroupRepository extends BaseRepository {
  constructor() {
    super(Group);
  }

  async findByOwnerSorted(ownerId) {
    return this.model
      .find({ owner: ownerId })
      .collation(ES_COLLATION)
      .sort({ name: 1 })
      .exec();
  }

  /** Trae, de una lista de ids, solo los que existen Y pertenecen a ese dueño. */
  async findByIdsAndOwner(ids, ownerId) {
    return this.model.find({ _id: { $in: ids }, owner: ownerId }).exec();
  }
}

module.exports = new GroupRepository();
