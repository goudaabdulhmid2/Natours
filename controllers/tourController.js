const Tour = require('./../models/tourmodel');
const AppErorr = require('./../utils/appErorr');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');
// ===========================================================================

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cp) => {
  if (file.mimetype.startsWith('image')) {
    cp(null, true);
  } else {
    cp(new AppErorr('Not an image! Please upload only images', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// upload.single('image'); => one field, req.file
// upload.array('images', 5); => one field but has multiple image, req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  // Move to the next as soon as this part is complated, this the reason why we use pronise.all
  await Promise.all(
    req.files.images.map(async (img, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(img.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );
  next();
});

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.creatOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
// aggregation pipeline can mainplute data in a couple of different steps
exports.getTourStats = catchAsync(async (req, res, next) => {
  // we pass array called stages, the documents pass through these stages one by one step by step in the defined sequence as we define. each of stage is object
  // match is basically to select or filter certain documents .
  //group is allows us to group documents together, basically using accomulater
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1, // 1 for acending
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }, // id now is difficulty
    // },
  ]);
  res.status(200).json({
    statsu: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  // unwind deconstruct an array field from the input documents and then output one document for each element of the array
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, // array
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getTourWithin = catchAsync(async (req, res, next) => {
  //  '/tours-within/:distance/center/:latlng/unit/:unit'

  let { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // convert here is necessary because mongodb need in radians
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    return next(
      new AppErorr(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );

  // $geoWithin => it finds document with certain geometry

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  // '/distances/:latlng/:unit'
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    return next(
      new AppErorr(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );

  // $geoNear always need to be first in the piieline, is that it require at least one our fields contains a geo index, if you have one geoNear auto will use it if u write it or not but if you have multiple you should write it byself
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
