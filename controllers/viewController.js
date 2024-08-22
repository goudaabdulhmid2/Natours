const Tour = require('./../models/tourmodel');
const User = require('./../models/usermodel');
const Booking = require('./../models/bookingModel');
const Review = require('./../models/reviweModel');
const catchAsync = require('./../utils/catchAsync');
const tourController = require('./../controllers/tourController');
const AppError = require('./../utils/appErorr');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3)Render that templates using tour data
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.manageTours = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3)Render that templates using tour data
  res.status(200).render('manageTour', {
    title: 'Manage Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data. for the requsted tour (including reviews and guides)
  const user = res.locals.user;
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  let hasBookedTour = false;
  if (user) {
    const booking = await Booking.findOne({ tour: tour._id, user: user._id });
    if (booking) hasBookedTour = true;
  }

  if (!tour) return next(new AppError('No Tour with this name!.', 404));

  // 2) Build template
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    hasBookedTour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign Up',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTour = catchAsync(async (req, res, next) => {
  // 1) find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2) find tours with the returnd ids
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } }); // select tour which havr id in tourIds

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.getReviewForm = (req, res) => {
  console.log(req.params.tourId);
  res.status(200).render('review', {
    title: `${req.params.slug} Tour Review`,
    tourId: req.params.tourId,
  });
};

exports.getTourUpdate = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug });
  const guides = await User.find({ role: { $in: ['guide', 'lead-guide'] } });

  res.status(200).render('updateTour', {
    title: `${req.params.slug} Update`,
    tour,
    guides,
  });
});

exports.getReviewForUser = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user._id });

  res.status(200).render('myReviews', {
    title: 'My Reviews',
    reviews,
  });
});
