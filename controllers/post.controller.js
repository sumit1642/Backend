// controllers/post.controller.js
import {
	createPostService,
	getAllPostsService,
	deletePostService,
} from "../services/post.service.js";

export const createPostController = async (req, res) => {
	try {
		await createPostService(req, res);
	} catch (err) {
		console.error("Create Post Controller Error:", err);
		return res.status(500).json({ msg: "Error in create post controller" });
	}
};

export const getAllPostsController = async (req, res) => {
	try {
		await getAllPostsService(req, res);
	} catch (err) {
		console.error("Get Posts Controller Error:", err);
		return res.status(500).json({ msg: "Error in get posts controller" });
	}
};

export const deletePostController = async (req, res) => {
	try {
		await deletePostService(req, res);
	} catch (err) {
		console.error("Delete Post Controller Error:", err);
		return res.status(500).json({ msg: "Error in delete post controller" });
	}
};
