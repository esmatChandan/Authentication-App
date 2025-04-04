import authController from '../controllers/authControllers.js'; // Ensure the correct file name & extension
import Router from 'express-promise-router'; // Import Router correctly

const router = Router(); // Initialize router

// Check if user exists
router.post('/check-user', authController.checkUser);

// Register new user
router.post('/register', authController.register);

// Verify email
router.post('/verify', authController.verify);

// Login
router.post('/login', authController.login);

export default router;
