export function serializeReview(review, { viewerId } = {}) {
  const ownerId = review.user?._id?.toString?.() || review.user?.toString?.();

  return {
    id: review._id,
    restaurantName: review.restaurantName,
    city: review.city,
    rating: review.rating,
    comment: review.comment,
    visitDate: review.visitDate,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    owner: review.user && review.user.name
      ? { id: review.user._id, name: review.user.name, email: review.user.email }
      : { id: review.user },
    canEdit: viewerId ? ownerId === viewerId.toString() : false
  };
}

export function serializeReviewAdmin(review) {
  return {
    id: review._id,
    restaurantName: review.restaurantName,
    city: review.city,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    owner: review.user
      ? { id: review.user._id, name: review.user.name, email: review.user.email }
      : null
  };
}
