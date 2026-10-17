const BaseRepository = require('./BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmail(email) {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  // Trae el usuario incluyendo el password (login lo necesita, por defecto está oculto)
  findByEmailWithPassword(email) {
    return this.findOne(
      { email: email.toLowerCase().trim() },
      { withSelect: '+password' }
    );
  }
}

module.exports = new UserRepository();
