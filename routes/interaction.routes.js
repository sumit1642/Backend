// routes/interaction.routes.js
import express from "express";
import {
	toggleLikeController,
	addCommentController,
	getCommentsController,
	deleteCommentController,
	updateCommentController,
} from "../controllers/interaction.controller.js";
import { requireAuth } from "../middleware/posts.middleware.js";
import { validateCommentData } from "../middleware/posts.middleware.js";

export const interactionRoute = express.Router();

// Like routes
interactionRoute.post("/posts/:postId/like", requireAuth, toggleLikeController);

// Comment routes
interactionRoute.get("/posts/:postId/comments", getCommentsController); // Public
interactionRoute.post(
	"/posts/:postId/comments",
	requireAuth,
	validateCommentData,
	addCommentController,
);
interactionRoute.put(
	"/comments/:commentId",
	requireAuth,
	validateCommentData,
	updateCommentController,
);
interactionRoute.patch(
	"/comments/:commentId",
	requireAuth,
	validateCommentData,
	updateCommentController,
);
interactionRoute.delete("/comments/:commentId", requireAuth, deleteCommentController);
