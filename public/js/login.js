import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfuly!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });

    if (res.data.status === 'success') location.reload(true).assign('/'); //  If the logout was successful, this reloads the current webpage. The true argument forces the page to reload from the server, ensuring that the user sees the logged-out state.
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
