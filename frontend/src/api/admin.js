import { request } from "./client.js";

export function getStats(token) {
  return request("/admin/stats", { token });
}

export function listUsers(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/users${query ? `?${query}` : ""}`, { token });
}

export function updateUserRole(token, id, role) {
  return request(`/admin/users/${id}/role`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ role })
  });
}

export function listReviews(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/reviews${query ? `?${query}` : ""}`, { token });
}

export function deleteReview(token, id) {
  return request(`/admin/reviews/${id}`, {
    token,
    method: "DELETE"
  });
}
