// routes/post.routes.js
import express from "express";
import {
	createPostController,
	deletePostController,
	getAllPostsController,
} from "../controllers/post.controller.js";
import { requireAuth } from "../middleware/posts.middleware.js";

export const postRoute = express.Router();

postRoute.get("/", getAllPostsController);
postRoute.post("/create", requireAuth, createPostController);
postRoute.delete("/delete/:postId", requireAuth, deletePostController);
