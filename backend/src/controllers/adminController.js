import * as adminService from "../services/adminService.js";

export async function getStats(req, res, next) {
  try {
    const data = await adminService.getStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const data = await adminService.listUsers(req.validated.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const data = await adminService.updateUserRole({ ...req.validated.params, ...req.validated.body, requesterId: req.user._id });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function listAllReviews(req, res, next) {
  try {
    const data = await adminService.listAllReviews(req.validated.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteReview(req, res, next) {
  try {
    await adminService.deleteReviewAsAdmin({ id: req.validated.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
