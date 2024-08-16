const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Uncaught Exceptions: bugs ocure in syncchronous code
// we should to put it here t the top before any other code executes

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('Uncaught Exceptions!');
  // we don't need to server here becuause the errors they are not happen async, so they are not going to have anything to do with server
  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connections successful! '));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port} requset....`);
});

// Unhandled promise rejection: means that somewhere in our code there is a promise that gadrid got rejected

// unhandledRejection event: allow us to handle all the error that occur in async code which were not handled

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('UNHANDLER REJECTION!');
  // by doing this by srver we give server basically time to finsh all the requset that are still panding
  server.close(() => {
    process.exit(1);
  });
});

// in the unhandled rejection crashing the app kill is optional but when Uncaught Exceptions we need to kill
