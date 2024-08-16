const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authContoller = require('./../controllers/authController');
const router = express.Router({ mergeParams: true });

router.use(authContoller.protect);
router.get(
  '/checkout-session/:tourID/:dateID',
  bookingController.getCheckoutSession,
);

router.use(authContoller.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .delete(bookingController.deleteBooking)
  .patch(bookingController.updataBooking);

module.exports = router;
