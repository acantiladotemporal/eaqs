import type { APIRoute } from 'astro';
import {
  CHECKOUT_CLOSE_AT_ISO,
  COURSE_LAUNCH_PRICE_EUR,
  COURSE_SEAT_LIMIT,
  COURSE_STANDARD_PRICE_EUR,
  getCheckoutState,
} from '../../../lib/course-data';
import { getPaidEnrollmentCount } from '../../../lib/server/enrollments';

export const prerender = false;

export const GET: APIRoute = async () => {
  const paidSeats = await getPaidEnrollmentCount();
  const state = getCheckoutState(paidSeats, new Date());

  return new Response(
    JSON.stringify({
      ...state,
      seatLimit: COURSE_SEAT_LIMIT,
      priceNow: COURSE_LAUNCH_PRICE_EUR,
      priceAfter: COURSE_STANDARD_PRICE_EUR,
      closesAtIso: CHECKOUT_CLOSE_AT_ISO,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

