import * as reviewService from "../services/reviewService.js";

export async function listReviews(req, res, next) {
  try {
    const data = await reviewService.listReviews({ ...req.validated.query, viewerId: req.user._id, userId: req.user._id });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getReview(req, res, next) {
  try {
    const data = await reviewService.getReviewById({ id: req.validated.params.id, viewerId: req.user._id });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function createReview(req, res, next) {
  try {
    const data = await reviewService.createReview({ data: req.validated.body, userId: req.user._id });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateReview(req, res, next) {
  try {
    const data = await reviewService.updateReview({ id: req.validated.params.id, data: req.validated.body, userId: req.user._id });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    await reviewService.deleteReview({ id: req.validated.params.id, userId: req.user._id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
