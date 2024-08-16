import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout, signup } from './login';
import { updateSettings } from './updateSetting';
import { bookTour } from './stripe';

//Dom ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateData = document.querySelector('.form-user-data');
const updatePassword = document.querySelector('.form-user-password');
const bookingBtn = document.getElementById('book-tour');
const signupForm = document.querySelector('.form--signup');
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
