const { Router } = require('express');
const authController = require('../controllers/AuthController');

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
