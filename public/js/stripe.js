import axios from 'axios';
import { showAlert } from './alerts';
import { loadStripe } from '@stripe/stripe-js';

export const bookTour = async (tourID, dateID) => {
  const stripe = await loadStripe(
    'pk_test_51Pn9VhAbTSDiQvdAJGnitFeZ0whGfmmf5tnfGZzlTR3fxj5ky9zx3AWZ7ZAtQB74inJkZtCOOIE7S28mtMAkdPso004dd3YcYx',
  );
  // 1) Get checkhout session from API
  try {
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourID}/${dateID}`,
    );
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
