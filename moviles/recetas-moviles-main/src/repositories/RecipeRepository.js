const BaseRepository = require('./BaseRepository');
const Recipe = require('../models/Recipe');
const ES_COLLATION = require('../utils/esCollation');

class RecipeRepository extends BaseRepository {
  constructor() {
    super(Recipe);
  }

  findByTitleNormalized(titleNormalized) {
    return this.findOne({ titleNormalized });
  }

  /** Lista ordenada alfabéticamente por título, con filtro opcional. */
  async findSortedAlphabetically(filter = {}) {
    return this.model
      .find(filter)
      .collation(ES_COLLATION)
      .sort({ titleNormalized: 1 })
      .exec();
  }

  findMineSorted(authorId) {
    return this.findSortedAlphabetically({ author: authorId });
  }

  findPublicSorted() {
    return this.findSortedAlphabetically({ isPublic: true });
  }
}

module.exports = new RecipeRepository();
