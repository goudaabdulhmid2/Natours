const express = require('express');
const viewController = require('./../controllers/viewController');
const authConroller = require('./../controllers/authController');
const bookingConroller = require('./../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingConroller.createBookingCheckout,
  authConroller.isLoggedIn,
  viewController.getOverview,
);
router.get('/tour/:slug', authConroller.isLoggedIn, viewController.getTour);
router.get('/login', authConroller.isLoggedIn, viewController.getLoginForm);
router.get('/me', authConroller.protect, viewController.getAccount);
router.get('/signup', viewController.getSignForm);
router.get(
  '/:slug/review',
  authConroller.isLoggedIn,
  authConroller.restructReview,
  viewController.getReviewForm,
);
router.get('/my-tours', authConroller.protect, viewController.getMyTour);
router.get(
  '/manageTours',
  authConroller.isLoggedIn,
  authConroller.restrictTo('admin'),
  viewController.manageTours,
);

router.get(
  '/:slug/update',
  authConroller.isLoggedIn,
  authConroller.restrictTo('admin'),
  viewController.getTourUpdate,
);

router.get(
  '/my-reviews',
  authConroller.isLoggedIn,
  viewController.getReviewForUser,
);

module.exports = router;
