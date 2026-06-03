import { request } from "./client.js";

export function listReviews(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/reviews${query ? `?${query}` : ""}`, { token });
}

export function createReview(token, payload) {
  return request("/reviews", {
    token,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateReview(token, id, payload) {
  return request(`/reviews/${id}`, {
    token,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteReview(token, id) {
  return request(`/reviews/${id}`, {
    token,
    method: "DELETE"
  });
}
