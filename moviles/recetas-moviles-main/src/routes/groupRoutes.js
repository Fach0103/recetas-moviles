const { Router } = require('express');
const groupController = require('../controllers/GroupController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Los grupos son privados: siempre requieren estar logueado.
router.use(authMiddleware);

router.post('/', groupController.create);
router.get('/', groupController.listMine);
router.get('/:id', groupController.getById);
router.put('/:id', groupController.update);
router.get('/:id/delete-preview', groupController.getDeletePreview);
router.delete('/:id', groupController.remove);
router.get('/:id/recipes', groupController.getRecipes);

module.exports = router;
