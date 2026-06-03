export { getStoredSession, saveSession, clearSession } from "./api/client.js";
export { register, login } from "./api/auth.js";
export { listReviews, createReview, updateReview, deleteReview } from "./api/reviews.js";
export { getStats, listUsers, updateUserRole, listReviews as adminListReviews, deleteReview as adminDeleteReview } from "./api/admin.js";

import { register, login } from "./api/auth.js";
import { listReviews, createReview, updateReview, deleteReview } from "./api/reviews.js";
import * as admin from "./api/admin.js";

export const api = {
  register,
  login,
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  admin
};
