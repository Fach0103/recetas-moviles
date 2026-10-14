const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del grupo es obligatorio'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Nota: la relación con las recetas NO vive aquí. Vive en
    // Recipe.groups[], para no duplicar la misma relación en dos lugares
    // y arriesgarse a que se desincronicen.
  },
  { timestamps: true }
);

groupSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    owner: this.owner,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Group', groupSchema);
