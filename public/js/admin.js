import axios from 'axios';
import { showAlert } from './alerts';

export const deleteTour = async (tourId) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `http://127.0.0.1:8000/api/v1/tours/${tourId}`,
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Delete successfuly!');

      location.assign('/manageTours');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const updateTour = async (tourId, data) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:8000/api/v1/tours/${tourId}`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Tour updated successfully!');
      window.setTimeout(() => {
        location.assign('/manageTours');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
