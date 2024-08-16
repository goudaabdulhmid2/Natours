const crypto = require('crypto');
const User = require('./../models/usermodel');
const Booking = require('./../models/bookingModel');
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appErorr');
const Email = require('./../utils/email');

const signToken = (id) => {
  // (payload,secret,optaions) => secret should be at least 32 chars, header create auto
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // cookie is basically just a small piece of text that a server can send to clients.Then when the client receives a cookie, it will automatically store it and then automatically send it back along with all future requests to the same server.
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    secure: false, // the cookie will only be sent on an encrypted connection.
    httpOnly: true, // this will make it that cookie can not be accessed or modified in any way by the browser and so this is important in order to prevent those cross-site scripting attacks.so all the browser is gonna do when we set httpOnly to true is to basically  receive the cookie, store it, and then send it automatically along with every request.
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfrim: req.body.passwordConfrim,
    photo: req.body.photo,
    passwordCahngeAt: req.body.passwordCahngeAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Cheak if email and password exitst
  if (!email || !password) {
    return next(new AppError('Please provide Email and Password '), 400);
  }

  // 2) Check if user exists && password is exist
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Incorrect Email or Password ', 401));
  }
  if (user.isLocked()) {
    return next(new AppError('Your account is locked. Try again letter', 403));
  }
  const correct = await user?.correctPassword(password, user.password);
  if (!correct) {
    return next(new AppError('Incorrect Email or Password ', 401));
  }

  // 3) If everything is ok. send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'looggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;
  if (!token) {
    return next(new AppError('You are not log in', 401));
  }

  // 2) verfication token
  // By using promisify, you convert callback-based functions to return promises, allowing you to use async/await
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded); // { id: '6675e8cc884f0a325c3dcd87', iat: 1719162915, exp: 1726938915 }

  // 3) cehck if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonginig to this token is not longer exist.',
        401,
      ),
    ); // Unauthorized
  }
  // 4) check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  // GRANT access to protected route
  req.user = currentUser; // important
  res.locals.user = currentUser;
  next();
});

// only for renderd pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verfiy token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      // 2) check user if still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser; // any variable in there will be access in pug templates
    } catch (err) {
      return next();
    }
  }
  next();
};

// authorization is It's verifying if a certain user has the rights to interact with a certain resource.
// if a certain user is allowed to access a certain resource,even if he is logged in.So not all logged in users will be able to perform the same actions in our API, all right?

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array
    if (!roles.includes(req.user.role)) {
      // 403 means forbidden
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.restructReview = catchAsync(async (req, res, next) => {
  // 1) find booking
  const booking = await Booking.findOne({
    user: req.user,
    tour: req.params.tourId,
  });

  // 2) If no booking found, return an error
  if (!booking)
    return next(
      new AppError('You can only review tours you have booked!', 403),
    );

  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on user email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) generate the random reset token
  const resetToken = user.createPasswordToken();

  // modify the data when wee call it and need to save it
  await user.save({ validateBeforeSave: false }); // This will then deactivate all the validaters

  // we need to simply add a try-catch block right here. because we actually want to do more than simply send an error down to the client,
  try {
    // 3) send it to user email
    const restURL = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}`;
    await new Email(user, restURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email,. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfrim = req.body.passwordConfrim;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changePasswordAt property for the user
  // 4) Log the user in, send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) check if psoted current password is coorect
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfrim = req.body.passwordConfrim;
  await user.save();
  // 4) loh user in, send jwt
  createSendToken(user, 200, res);

  // why we don't use findByIdAndUpdate? for two reason the validation we put in user schame when we comper confirmPassword with password will not work. "Don't use update with anything related to password". second resone all pre-saved midleware not going to work.
});
