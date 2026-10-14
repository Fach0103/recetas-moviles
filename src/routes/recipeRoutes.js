const { Router } = require('express');
const recipeController = require('../controllers/RecipeController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');

const router = Router();

// Rutas específicas antes que "/:id" para que no choquen con el param.
router.get('/mine', authMiddleware, recipeController.listMine);
router.get('/', optionalAuthMiddleware, recipeController.listPublic);

router.post('/', authMiddleware, recipeController.create);
router.get('/:id', optionalAuthMiddleware, recipeController.getById);
router.put('/:id', authMiddleware, recipeController.update);
router.delete('/:id', authMiddleware, recipeController.remove);
router.put('/:id/groups', authMiddleware, recipeController.setGroups);

module.exports = router;
