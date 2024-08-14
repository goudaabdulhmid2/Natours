class AppErorr extends Error {
  constructor(message, statusCode) {
    super(message); // in order to call the prent constructor

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    // This allows you to create custom Error objects with stack traces that exclude internal implementation details and provide more relevant information to the developer.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppErorr;
