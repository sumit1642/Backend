import express from "express";
import {
	toggleLikeController,
	addCommentController,
	getCommentsController,
	getCommentsPaginatedController,
	deleteCommentController,
	updateCommentController,
	getLikeCountController,
	getBatchLikeStatusController,
} from "../controllers/interaction.controller.js";
import { requireAuth } from "../middleware/posts.middleware.js";
import { validateCommentData } from "../middleware/posts.middleware.js";

export const interactionRoute = express.Router();

// Like routes (require authentication for mutations)
interactionRoute.post("/posts/:postId/like", requireAuth, toggleLikeController);

interactionRoute.get("/posts/:postId/like-count", getLikeCountController);

interactionRoute.post("/posts/batch/like-status", getBatchLikeStatusController);

// Comment routes
interactionRoute.get("/posts/:postId/comments", getCommentsController);
interactionRoute.get("/posts/:postId/comments/paginated", getCommentsPaginatedController);
interactionRoute.post("/posts/:postId/comments", requireAuth, validateCommentData, addCommentController);
interactionRoute.put("/comments/:commentId", requireAuth, validateCommentData, updateCommentController);
interactionRoute.patch("/comments/:commentId", requireAuth, validateCommentData, updateCommentController);
interactionRoute.delete("/comments/:commentId", requireAuth, deleteCommentController);
