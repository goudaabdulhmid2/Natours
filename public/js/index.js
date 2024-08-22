import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout, signup } from './login';
import { updateSettings } from './updateSetting';
import { bookTour } from './stripe';
import { writeReview } from './review';
import { deleteTour } from './admin';
import { updateTour } from './admin';
//Dom ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateData = document.querySelector('.form-user-data');
const updatePassword = document.querySelector('.form-user-password');
const bookingBtn = document.getElementById('book-tour');
const signupForm = document.querySelector('.form--signup');
const reviewForm = document.querySelector('.form--review');
const submitReviewBtn = document.getElementById('submit-review');
const deleteBtns = document.querySelectorAll('.deleteBtn');
const updateTourBtn = document.querySelector('.form--admin');
// Values
const dateID = document.getElementById('tour-date-id');
// Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (updateData) {
  updateData.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });
}

if (updatePassword) {
  updatePassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfrim = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfrim },
      'password',
    );
    document.querySelector('.btn--save-password').textContent = 'SAVE password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookingBtn) {
  bookingBtn.addEventListener('click', (e) => {
    // e.target => element was clicked
    e.target.textContent = 'Processing...';
    const tourID = e.target.dataset.tourId;
    bookTour(tourID, dateID.value);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfrim = document.getElementById('password-confirm').value;

    signup(name, email, password, passwordConfrim);
  });
}

if (reviewForm) {
  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const tourID = submitReviewBtn.getAttribute('data-tour-id');
    const rating = document.getElementById('rating').value;
    const review = document.getElementById('review').value;
    writeReview(tourID, rating, review);
  });
}

if (deleteBtns) {
  deleteBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const confirmDelete = confirm(
        'Are you sure you want to delete this tour? This action cannot be undone.',
      );

      if (confirmDelete) {
        const tourID = e.target.dataset.tourId;
        deleteTour(tourID);
      }
    });
  });
}
if (updateTourBtn) {
  updateTourBtn.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('duration', document.getElementById('duration').value);
    formData.append(
      'maxGroupSize',
      document.getElementById('maxGroupSize').value,
    );
    formData.append('difficulty', document.getElementById('difficulty').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('summary', document.getElementById('summary').value);
    formData.append(
      'description',
      document.getElementById('description').value,
    );

    const photoFile = document.getElementById('photo').files[0];
    if (photoFile) {
      formData.append('imageCover', photoFile);
    }

    // Append multiple images (for tour.images)
    const images = document.getElementById('images').files;
    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    const startLocationDescription = document.getElementById(
      'startLocation_description',
    ).value;
    const startLocationCoordinates = document
      .getElementById('startLocation_coordinates')
      .value.split(',')
      .map((coord) => parseFloat(coord.trim()));
    const startLocationAddress = document.getElementById(
      'startLocation_address',
    ).value;

    formData.append('startLocation[description]', startLocationDescription);
    formData.append('startLocation[address]', startLocationAddress);
    formData.append('startLocation[type]', 'Point');
    formData.append(
      'startLocation[coordinates][]',
      startLocationCoordinates[0],
    );
    formData.append(
      'startLocation[coordinates][]',
      startLocationCoordinates[1],
    );

    const selectedGuides = [
      ...document.getElementById('guides').selectedOptions,
    ].map((option) => option.value);
    selectedGuides.forEach((guide) => formData.append('guides[]', guide));

    // Handle startDates

    const startDates = document.querySelectorAll('.form__start-date');

    startDates.forEach((startDate, index) => {
      const date = startDate.querySelector(
        `input[name="startDates[${index}][date]"]`,
      ).value;
      const participants = startDate.querySelector(
        `input[name="startDates[${index}][participants]"]`,
      ).value;
      const soldOut = startDate.querySelector(
        `input[name="startDates[${index}][soldOut]"]`,
      ).checked;

      formData.append(
        `startDates[${index}][date]`,
        new Date(date).toISOString(),
      );
      formData.append(`startDates[${index}][participants]`, participants);
      formData.append(`startDates[${index}][soldOut]`, soldOut);
    });

    const locations = document.querySelectorAll('.location-group');

    locations.forEach((location, index) => {
      const description = location.querySelector(
        `input[name="locations[${index}][description]"]`,
      ).value;
      const coordinates = location
        .querySelector(`input[name="locations[${index}][coordinates]"]`)
        .value.split(',')
        .map((coord) => parseFloat(coord.trim()));
      const address = location.querySelector(
        `input[name="locations[${index}][address]"]`,
      ).value;
      const day = location.querySelector(
        `input[name="locations[${index}][day]"]`,
      ).value;

      formData.append(`locations[${index}][description]`, description);
      formData.append(`locations[${index}][coordinates][]`, coordinates[0]);
      formData.append(`locations[${index}][coordinates][]`, coordinates[1]);
      formData.append(`locations[${index}][address]`, address);
      formData.append(`locations[${index}][day]`, parseInt(day, 10));
    });

    const tourId = e.target.querySelector('#update-tour').dataset.tourId;
    // for (let pair of formData.entries()) {
    //   console.log(pair[0], pair[1]);
    // }

    updateTour(tourId, formData);
  });
}
