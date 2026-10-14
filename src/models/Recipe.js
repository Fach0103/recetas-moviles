const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: String, trim: true }, // texto libre: "2", "1/2", "al gusto"
    unit: { type: String, trim: true }, // "g", "tazas", "unidades"...
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    // Versión normalizada del título (sin tildes/mayúsculas), usada para
    // el índice único y para ordenar alfabéticamente de forma consistente.
    titleNormalized: {
      type: String,
      required: true,
      unique: true,
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    ingredients: {
      type: [ingredientSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'La receta debe tener al menos un ingrediente',
      },
    },
    steps: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'La receta debe tener al menos un paso',
      },
    },
    prepTime: { type: Number, min: 0 }, // minutos
    servings: { type: Number, min: 1 },
    category: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    isPublic: { type: Boolean, default: false },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Relación muchos a muchos: una receta puede estar en varios grupos.
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: [],
      },
    ],
  },
  { timestamps: true }
);

recipeSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    ingredients: this.ingredients,
    steps: this.steps,
    prepTime: this.prepTime,
    servings: this.servings,
    category: this.category,
    image: this.image,
    isPublic: this.isPublic,
    author: this.author,
    groups: this.groups,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Recipe', recipeSchema);
