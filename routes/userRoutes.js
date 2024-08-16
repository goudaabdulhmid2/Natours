const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const bookingRoutes = require('./bookingRoutes');

const router = express.Router();
router.use('/:userId/bookings', bookingRoutes);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// all routes after this point need to protect
router.use(authController.protect); // middewere run in sequance.

router.patch('/updateMyPassword', authController.updatePassword);
router.get(
  '/me',

  userController.getMe,
  userController.getUser,
);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/deleteMe', userController.delatMe);

// all routes after this point allow just for admin
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUser)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
