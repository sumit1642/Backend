// routes/tag.routes.js
import express from "express";
import {
	getAllTagsController,
	addTagToPostController,
	removeTagFromPostController,
	getPostsByTagController,
	getUserLikedTagsController,
} from "../controllers/tag.controller.js";
import { requireAuth, optionalAuth, validateTagData } from "../middleware/posts.middleware.js";

export const tagRoute = express.Router();

// Public routes
tagRoute.get("/", getAllTagsController); // Get all tags
tagRoute.get("/:tagId/posts", optionalAuth, getPostsByTagController); // Get posts by tag

// Protected routes (require authentication)
tagRoute.get("/liked", requireAuth, getUserLikedTagsController); // Get user's liked tags
tagRoute.post("/posts/:postId", requireAuth, validateTagData, addTagToPostController); // Add tag to post
tagRoute.delete("/posts/:postId/:tagId", requireAuth, removeTagFromPostController); // Remove tag from post
