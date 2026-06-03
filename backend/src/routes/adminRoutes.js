import { Router } from "express";
import { getStats, listUsers, updateUserRole, listAllReviews, adminDeleteReview } from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  adminDeleteReviewSchema,
  listAllReviewsSchema,
  listUsersSchema,
  updateUserRoleSchema
} from "../schemas/adminSchemas.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", getStats);
router.get("/users", validate(listUsersSchema), listUsers);
router.patch("/users/:id/role", validate(updateUserRoleSchema), updateUserRole);
router.get("/reviews", validate(listAllReviewsSchema), listAllReviews);
router.delete("/reviews/:id", validate(adminDeleteReviewSchema), adminDeleteReview);

export default router;
