// controllers/post.controller.js
import {
	createPost,
	getAllPosts,
	getPostById,
	updatePost,
	deletePost,
} from "../services/post.service.js";

export const createPostController = async (req, res) => {
	try {
		const { title, content, published = false } = req.body;
		const userId = req.user.userId;

		if (!title || !title.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Title is required",
			});
		}

		if (!content || !content.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Content is required",
			});
		}

		const post = await createPost({
			title: title.trim(),
			content: content.trim(),
			published: Boolean(published),
			userId,
		});

		return res.status(201).json({
			status: "success",
			message: "Post created successfully",
			data: { post },
		});
	} catch (err) {
		console.error("Create Post Controller Error:", err);

		if (err.message === "Title already exists") {
			return res.status(409).json({
				status: "error",
				message: "You already have a post with this title",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const getAllPostsController = async (req, res) => {
	try {
		const { published = "true" } = req.query;
		const userId = req.user?.userId;

		const posts = await getAllPosts({
			published: published === "true",
			userId,
		});

		return res.status(200).json({
			status: "success",
			message: "Posts fetched successfully",
			data: { posts },
		});
	} catch (err) {
		console.error("Get Posts Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const getPostByIdController = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user?.userId;

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const post = await getPostById(postId, userId);

		return res.status(200).json({
			status: "success",
			message: "Post fetched successfully",
			data: { post },
		});
	} catch (err) {
		console.error("Get Post By ID Controller Error:", err);

		if (err.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const updatePostController = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user.userId;
		const { title, content, published } = req.body;

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const updateData = {};
		if (title !== undefined) updateData.title = title.trim();
		if (content !== undefined) updateData.content = content.trim();
		if (published !== undefined) updateData.published = Boolean(published);

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				status: "error",
				message: "No update data provided",
			});
		}

		const post = await updatePost(postId, userId, updateData);

		return res.status(200).json({
			status: "success",
			message: "Post updated successfully",
			data: { post },
		});
	} catch (err) {
		console.error("Update Post Controller Error:", err);

		if (err.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		if (err.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only update your own posts",
			});
		}

		if (err.message === "Title already exists") {
			return res.status(409).json({
				status: "error",
				message: "You already have a post with this title",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const deletePostController = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user.userId;

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		await deletePost(postId, userId);

		return res.status(200).json({
			status: "success",
			message: "Post deleted successfully",
		});
	} catch (err) {
		console.error("Delete Post Controller Error:", err);

		if (err.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		if (err.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only delete your own posts",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};
