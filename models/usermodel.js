const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'You should enter name.'],
  },
  email: {
    type: String,
    required: [true, 'You should enter email.'],
    validate: [validator.isEmail, 'Enter a valid email'],
    lowercase: true,
    unique: true,
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'You should enter password'],
    minlength: 8,
    select: false,
  },
  passwordConfrim: {
    type: String,
    required: [true, 'You should confirm your password'],
    validate: {
      // This only works on CREATE AND SAVE!!
      // as reasone whenever we want to update the user we will always have to use save as well,and not for example find out and update like we did with tours
      validator: function (val) {
        return val === this.password;
      },
      message: 'Password are not the same.',
    },
  },
  passwordCahngeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  faildLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next(); // mongoose mathod

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12); // this hash is asynchronous version

  // Delete passwordConfirm field
  this.passwordConfrim = undefined; // we put a required validation in this faild, you might wonder why this works? it's a required input
  next();
});

userSchema.pre('save', function (next) {
  // So, basically, we want to exit this middleware function right away, if the password has not been modified or if the document is new, and so we can use the isNew property.
  if (!this.isModified('password') || this.isNew) return next();

  // and so again, sometimes it happens that this token is created a bit before the changed password timestamp has actually been created.And so, we just need to fix that by subtracting one second.So, basically, a thousand milliseconds.And so that then will put the passwordChangedAt one second

  this.passwordCahngeAt = Date.now() - 1000;
  next();
});

// quary midelware
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// we do this here not in authcont because this is really related to the data itself
// instance method: method is gonna be available on all documents of certain collection

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function () {
  // If locked return nothing
  if (this.isLocked()) return this;

  // if not, increment
  this.faildLoginAttempts += 1;

  if (this.faildLoginAttempts >= 5) {
    this.lockUntil = Date.now() + 10 * 60 * 1000;
    this.faildLoginAttempts = 0;
  }

  await this.save({ validateBeforeSave: false });
  return this;
};

userSchema.methods.resetLoginAttempt = async function () {
  this.faildLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save({ validateBeforeSave: false });
  return this;
};

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // because we set select false for password, this.password will not be avaliable
  const isCorrect = await bcrypt.compare(candidatePassword, userPassword);
  if (isCorrect) {
    await this.resetLoginAttempt(); // reset
  } else {
    await this.incrementLoginAttempts(); // increment
  }
  return isCorrect;
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // token was issued at
  // this point to the current document
  let changedTimestamp;
  if (this.passwordCahngeAt) {
    changedTimestamp = parseInt(this.passwordCahngeAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  // false means not cahnge
  return false;
};

userSchema.methods.createPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; // dosn't make sense to encrypt it when we send it to user, send encrypt version to DB
};

const User = mongoose.model('User', userSchema);
module.exports = User;
