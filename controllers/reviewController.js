// const appError = require('./../utils/appErorr');
// const catchAsync = require('./../utils/catchAsync');
const Review = require('./../models/reviweModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; // get user from protict middleware

  next();
};

exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.creatReview = factory.creatOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
