import { Review } from "../models/Review.js";
import { HttpError } from "../utils/httpError.js";
import { serializeReview } from "../utils/serializers/reviewSerializer.js";

const sortMap = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 }
};

export async function listReviews({ page, limit, search, sort, rating, mine, viewerId, userId }) {
  const filter = {};
  if (search) filter.$text = { $search: search };
  if (rating) filter.rating = rating;
  if (mine === "true") filter.user = userId;

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name email")
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter)
  ]);

  return {
    items: items.map((review) => serializeReview(review, { viewerId })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getReviewById({ id, viewerId }) {
  const review = await Review.findById(id).populate("user", "name email");

  if (!review) {
    throw new HttpError(404, "Resena no encontrada");
  }

  return { review: serializeReview(review, { viewerId }) };
}

export async function createReview({ data, userId }) {
  const review = await Review.create({ ...data, user: userId });
  await review.populate("user", "name email");

  return { review: serializeReview(review, { viewerId: userId }) };
}

export async function updateReview({ id, data, userId }) {
  const review = await Review.findById(id);

  if (!review) {
    throw new HttpError(404, "Resena no encontrada");
  }

  if (review.user.toString() !== userId.toString()) {
    throw new HttpError(403, "Solo puede modificar sus propias resenas");
  }

  Object.assign(review, data);
  await review.save();
  await review.populate("user", "name email");

  return { review: serializeReview(review, { viewerId: userId }) };
}

export async function deleteReview({ id, userId }) {
  const review = await Review.findById(id);

  if (!review) {
    throw new HttpError(404, "Resena no encontrada");
  }

  if (review.user.toString() !== userId.toString()) {
    throw new HttpError(403, "Solo puede eliminar sus propias resenas");
  }

  await review.deleteOne();
}
