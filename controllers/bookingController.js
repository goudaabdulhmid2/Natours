const Tour = require('./../models/tourmodel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppErorr = require('./../utils/appErorr');
const stripe = require('stripe')(process.env.STRIPE_SECRT_KEY);
const factory = require('./../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2) Cheak if tour booked out or not
  if (tour.startDates.id(req.params.dateID).soldOut)
    return next(new AppErorr('This tour date is fully booked!', 400));

  // 3) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}&date=${req.params.dateID}`, // the user weil be redirected to this URL, not secure
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    metadata: {
      dateID: req.params.dateID, // Pass the dateId here
      user: req.user.id,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This only TEMPORARY, because it's Unsecure: everyone can make booking without paiying
//   const { tour, user, price, date } = req.query;
//   const tourDate = await Tour.findById(tour);

//   if (!tour || !user || !price || !tourDate || !date) return next();

//   const booking = await Booking.create({
//     tour,
//     user,
//     price,
//     date: tourDate.startDates.id(date).date,
//   });

//   if (!booking) return next();

//   // increses date booking
//   await tourDate.incressedBooking(date);

//   res.redirect(req.originalUrl.split('?')[0]); // create new requset to `${req.protocol}://${req.get('host')}/
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const { dateID, user } = session.metadata;
  const price = session.line_items[0].price_data.unit_amount / 100;

  const tourDate = await Tour.findById(tour);
  const booking = await Booking.create({
    tour,
    user,
    price,
    date: tourDate.startDates.id(dateID).date,
  });

  // increses date booking
  await tourDate.incressedBooking(date);
};

exports.webhookCheckOut = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRT,
    );
  } catch (err) {
    res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status.json({ received: true });
};
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.creatOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updataBooking = factory.updateOne(Booking);
