const mongoose = require('mongoose');
const Tour = require('./tourmodel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty.'],
    },
    rating: {
      type: Number,
      default: 1.0,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'User must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index(
  {
    tour: 1,
    user: 1,
  },
  { unique: true },
); // each combination of tour and user be unique

reviewSchema.pre(/^find/, function (next) {
  // this.populate([
  //   { path: 'tour', select: 'name' },
  //   { path: 'user', select: 'name photo' },
  // ]);

  this.populate({ path: 'user', select: 'name photo' }).populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

// static methods
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }

  // console.log(stats);
};

reviewSchema.post('save', async function () {
  // this.constructor refers to the model (Review)
  await this.constructor.calcAverageRatings(this.tour);
});

// in state if review update or deleted
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this in query middelwere access the query not document, here we want access the doc use this trick.
  this.r = await this.findOne();

  // okey, here when we try use calcRatingsAv the calcltion will be in the data before update, maybe you said we can use post insted of pre, that is sound good but we will stuck in problem we can not run the query

  // the trick we use to solve this problem we use this pre middelwere to pass this.r to post middelwere "middelwere life cycle"

  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); dose not work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
