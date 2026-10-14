const { Router } = require('express');
const userController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware); // todas las rutas de /users requieren token

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

module.exports = router;
