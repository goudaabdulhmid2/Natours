// every thing is not relted to express do it outside app
// express conffiguring
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppErorr = require('./utils/appErorr');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// Start express app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
///////////////////////////////////////////////////////////////////////
// GlOBAL middelware

// Serving static file
app.use(express.static(path.join(__dirname, 'public'))); // allow to me acsess all static file on public folder in views without write full path

// Set security HTTP headers
// app.use(helmet()); // And it's best to use this helmet package early in the middleware stack
// app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://*.cloudflare.com',
  'https://js.stripe.com/v3/',
  'https://checkout.stripe.com',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'https://www.myfonts.com/fonts/radomir-tinkov/gilroy/*',
  ' checkout.stripe.com',
];
const connectSrcUrls = [
  'https://*.mapbox.com/',
  'https://*.cloudflare.com',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:52191',
  '*.stripe.com',
];

const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ['*.stripe.com', '*.stripe.network'],
    },
  }),
);

// Development login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requsets from same AAPI
const limiter = rateLimit({
  max: 100, // 100 requset
  windowMs: 60 * 60 * 1000, // in one hour
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); // '/api' will affect to all routes start with api

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // And so now when we have a body larger than 10 kilobyte it will basically not be accepted

// This middleware is used to parse URL-encoded data (such as form submissions) in an Express application. It allows for handling complex objects (with extended: true) and limits the size of the payload to 10kb to prevent large, potentially harmful requests.
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  }),
);

app.use(cookieParser()); // parses data from cookies

// Data senitiation against NoSQL query injection
app.use(mongoSanitize());

//Data senitiation against XSS
app.use(xss()); // clean any user input from milisouse html and js code

// Prevent paarameter Polllution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // simply an array of properties allow duplicates in the query string
  }),
);

app.use(compression()); // compress all text send to client

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//////////////////////////////////////////////////////////////////
// routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

///////////////////////////////////////////////////////////////////
app.all('*', (req, res, next) => {
  next(new AppErorr(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
