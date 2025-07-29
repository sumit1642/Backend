// routes/post.routes.js
import express from "express";
import { optionalAuth, requireAuth, validatePostData } from "../middleware/posts.middleware.js";
import {
	createPostController,
	deletePostController,
	getAllPostsController,
	getMyPostsController,
	getPostByIdController,
	getUserPostsController,
	updatePostController,
} from "../controllers/post.controller.js";

export const postRoute = express.Router();

// Public routes (accessible without login)
postRoute.get("/user/:userId", optionalAuth, getUserPostsController);
postRoute.get("/", optionalAuth, getAllPostsController);
postRoute.get("/:postId", optionalAuth, getPostByIdController);

// Protected routes (require login)
postRoute.get("/my/posts", requireAuth, getMyPostsController);
postRoute.post("/", requireAuth, validatePostData, createPostController);
postRoute.put("/:postId", requireAuth, validatePostData, updatePostController);
postRoute.patch("/:postId", requireAuth, validatePostData, updatePostController);
postRoute.delete("/:postId", requireAuth, deletePostController);
