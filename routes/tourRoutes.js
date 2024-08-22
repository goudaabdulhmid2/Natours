const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRoutes = require('./reviewRoutes');
const bookingRoutes = require('./bookingRoutes');
const router = express.Router();

// router.param('id', tourController.checkId);

// Nested route for reviews
// POST /tour/3343ffs/reviews  => simple nested route
// GET /tour/434rf/reviews
router.use('/:tourId/reviews', reviewRoutes); // all route end with /:tourId/reviews, redirected to review router

router.use('/:tourId/bookings', bookingRoutes);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-Plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

// tours-distance/223/center/40,45/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

router.route('/distances/:latlng/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.tourParse,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), // pass all of roles allwod to delete tour
    tourController.deleteTour,
  );

module.exports = router;
