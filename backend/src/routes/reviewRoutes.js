import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createReview,
  deleteReview,
  getReview,
  listReviews,
  updateReview
} from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createReviewSchema,
  listReviewsSchema,
  reviewIdSchema,
  updateReviewSchema
} from "../schemas/reviewSchemas.js";

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes, intente de nuevo mas tarde", status: 429 }
});

router.use(requireAuth);
router.get("/", validate(listReviewsSchema), listReviews);
router.post("/", writeLimiter, validate(createReviewSchema), createReview);
router.get("/:id", validate(reviewIdSchema), getReview);
router.put("/:id", writeLimiter, validate(updateReviewSchema), updateReview);
router.delete("/:id", writeLimiter, validate(reviewIdSchema), deleteReview);

export default router;
