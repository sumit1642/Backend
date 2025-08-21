// routes/interaction.routes.js (Updated with Rate Limiting and Debouncing)
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
import {
	createInteractionDebounceMiddleware,
	likeInteractionRateLimit,
	commentInteractionRateLimit,
} from "../middleware/interaction.debounce.middleware.js";

export const interactionRoute = express.Router();

// Create debounce middleware for different interaction types
const debouncedLikeInteraction = createInteractionDebounceMiddleware("TOGGLE_LIKE");
const debouncedAddCommentInteraction = createInteractionDebounceMiddleware("ADD_COMMENT");
const debouncedUpdateCommentInteraction = createInteractionDebounceMiddleware("UPDATE_COMMENT");

// Helper function to check if user is making rapid interactions
function isUserMakingRapidInteractions(req) {
	const lastInteractionTime = req.headers["x-last-interaction-time"];
	const currentTime = Date.now();
	const rapidInteractionThreshold = 2000; // 2 seconds

	if (lastInteractionTime && currentTime - parseInt(lastInteractionTime) < rapidInteractionThreshold) {
		return true;
	}
	return false;
}

// Like/Unlike routes with conditional debouncing and rate limiting
interactionRoute.post("/posts/:postId/like", likeInteractionRateLimit, requireAuth, (req, res, next) => {
	// Add user ID to request body for debounce processing
	req.body.userId = req.user.userId;

	// Check if user is making rapid like interactions
	const isRapidInteraction = isUserMakingRapidInteractions(req);
	const forceDebounce = req.headers["x-force-debounce"] === "true";

	if (isRapidInteraction || forceDebounce) {
		// Use debouncing for rapid interactions to prevent spam
		return debouncedLikeInteraction(req, res, next);
	} else {
		// Process immediately for single, deliberate interactions
		return toggleLikeController(req, res);
	}
});

// Comment viewing route (no rate limiting for reading)
interactionRoute.get("/posts/:postId/comments", getCommentsController);

// Add comment route with conditional debouncing
interactionRoute.post(
	"/posts/:postId/comments",
	commentInteractionRateLimit,
	requireAuth,
	validateCommentData,
	(req, res, next) => {
		req.body.userId = req.user.userId;

		// Check for rapid comment creation attempts
		const isRapidCommentCreation = req.headers["x-rapid-comment"] === "true";
		const isSpamPrevention = isUserMakingRapidInteractions(req);

		if (isRapidCommentCreation || isSpamPrevention) {
			return debouncedAddCommentInteraction(req, res, next);
		} else {
			return addCommentController(req, res);
		}
	},
);

// Update comment route (always use debouncing to prevent edit spam)
interactionRoute.put(
	"/comments/:commentId",
	commentInteractionRateLimit,
	requireAuth,
	validateCommentData,
	(req, res, next) => {
		req.body.userId = req.user.userId;

		// Always debounce comment updates to prevent spam editing
		return debouncedUpdateCommentInteraction(req, res, next);
	},
);

interactionRoute.patch(
	"/comments/:commentId",
	commentInteractionRateLimit,
	requireAuth,
	validateCommentData,
	(req, res, next) => {
		req.body.userId = req.user.userId;
		return debouncedUpdateCommentInteraction(req, res, next);
	},
);

// Delete comment route (immediate processing - destructive actions shouldn't be debounced)
interactionRoute.delete("/comments/:commentId", requireAuth, deleteCommentController);
