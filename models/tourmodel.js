const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./usermodel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 char'],
      minlength: [10, 'A tour name must have more or equal than 10 char'],
      // validate: [validator.isAlpha, 'Tour name must only contain chars '],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour  must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    rating: {
      type: Number,
      default: 4.5,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below reguler price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour mush have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      // the type should be string because basically, this will simply be the name of the image, which then later we will be able to read from the file system, that is a very common practice we could store the entire image as well in the database but that's not a good idea, we simply leave the images somewhere in the file system and then put the name of the image itself in the database as a filed
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enun: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// with out index mongo has to look at each document one by one, but with index become more efficint
// tourSchema.index({ price: 1 }); indvial index // 1 => asending order, -1 => deasending order
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // tell mongo this startlocatin should be indexed to a 2dsphere

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review', // The model to use for population
  foreignField: 'tour', // The field in the Review model that matches the localField
  localField: '_id', // The field in the Tour model to match with foreignField
});

tourSchema.pre('save', function (next) {
  // this => we have access to the document that is being processed
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id)); // result all of this here promise
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// /^find/ match any string start by find

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  // this > point to the current query
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordCahngeAt -faildLoginAttempts',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// ================================================
// Aggergation Middelware
// tourSchema.pre('aggregate', function (next) {
//   // this > point to the current aggregate
//   // unshift add at the begin of array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
// =================================================
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
