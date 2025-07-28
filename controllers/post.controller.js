// controllers/post.controller.js
import {
	createPostService,
	getAllPostsService,
	getPostByIdService,
	updatePostService,
	deletePostService,
} from "../services/post.service.js";

export const createPostController = async (req, res) => {
	try {
		await createPostService(req, res);
	} catch (err) {
		console.error("Create Post Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in create post controller",
		});
	}
};

export const getAllPostsController = async (req, res) => {
	try {
		await getAllPostsService(req, res);
	} catch (err) {
		console.error("Get Posts Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in get posts controller",
		});
	}
};

export const getPostByIdController = async (req, res) => {
	try {
		await getPostByIdService(req, res);
	} catch (err) {
		console.error("Get Post By ID Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in get post by ID controller",
		});
	}
};

export const updatePostController = async (req, res) => {
	try {
		await updatePostService(req, res);
	} catch (err) {
		console.error("Update Post Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in update post controller",
		});
	}
};

export const deletePostController = async (req, res) => {
	try {
		await deletePostService(req, res);
	} catch (err) {
		console.error("Delete Post Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in delete post controller",
		});
	}
};
