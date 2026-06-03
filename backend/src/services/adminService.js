import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { serializeReviewAdmin } from "../utils/serializers/reviewSerializer.js";

export async function getStats() {
  const [totalUsers, totalReviews, reviewStats] = await Promise.all([
    User.countDocuments(),
    Review.countDocuments(),
    Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" }, minRating: { $min: "$rating" }, maxRating: { $max: "$rating" } } }
    ])
  ]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [reviewsThisWeek, newUsersThisWeek, ratingDistribution] = await Promise.all([
    Review.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Review.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const entry of ratingDistribution) {
    ratingDist[entry._id] = entry.count;
  }

  return {
    totalUsers,
    totalReviews,
    avgRating: reviewStats[0]?.avgRating ? Math.round(reviewStats[0].avgRating * 10) / 10 : 0,
    reviewsThisWeek,
    newUsersThisWeek,
    ratingDistribution: ratingDist
  };
}

export async function listUsers({ search, page, limit }) {
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    items: users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function updateUserRole({ id, role, requesterId }) {
  const user = await User.findById(id);
  if (!user) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  if (user._id.toString() === requesterId.toString()) {
    throw new HttpError(400, "No puedes cambiar tu propio rol");
  }

  user.role = role;
  await user.save();

  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function listAllReviews({ search, page, limit }) {
  const filter = {};
  if (search) {
    filter.$or = [
      { restaurantName: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    Review.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Review.countDocuments(filter)
  ]);

  return {
    items: items.map(serializeReviewAdmin),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function deleteReviewAsAdmin({ id }) {
  const review = await Review.findById(id);
  if (!review) {
    throw new HttpError(404, "Reseña no encontrada");
  }

  await review.deleteOne();
}
