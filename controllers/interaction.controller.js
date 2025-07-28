// controllers/interaction.controller.js
import {
	toggleLike,
	addComment,
	getComments,
	deleteComment,
	updateComment,
} from "../services/interaction.service.js";

export const toggleLikeController = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user.userId;

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const result = await toggleLike(userId, postId);

		return res.status(200).json({
			status: "success",
			message: result.message,
			data: {
				isLiked: result.isLiked,
				likeCount: result.likeCount,
			},
		});
	} catch (err) {
		console.error("Toggle Like Controller Error:", err);

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

export const addCommentController = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user.userId;
		const { content } = req.body;

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const comment = await addComment(userId, postId, content.trim());

		return res.status(201).json({
			status: "success",
			message: "Comment added successfully",
			data: { comment },
		});
	} catch (err) {
		console.error("Add Comment Controller Error:", err);

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

export const getCommentsController = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const comments = await getComments(postId);

		return res.status(200).json({
			status: "success",
			message: "Comments fetched successfully",
			data: { comments },
		});
	} catch (err) {
		console.error("Get Comments Controller Error:", err);

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

export const deleteCommentController = async (req, res) => {
	try {
		const commentId = parseInt(req.params.commentId);
		const userId = req.user.userId;

		if (isNaN(commentId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid comment ID",
			});
		}

		await deleteComment(userId, commentId);

		return res.status(200).json({
			status: "success",
			message: "Comment deleted successfully",
		});
	} catch (err) {
		console.error("Delete Comment Controller Error:", err);

		if (err.message === "Comment not found") {
			return res.status(404).json({
				status: "error",
				message: "Comment not found",
			});
		}

		if (err.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only delete your own comments",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const updateCommentController = async (req, res) => {
	try {
		const commentId = parseInt(req.params.commentId);
		const userId = req.user.userId;
		const { content } = req.body;

		if (isNaN(commentId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid comment ID",
			});
		}

		const comment = await updateComment(userId, commentId, content.trim());

		return res.status(200).json({
			status: "success",
			message: "Comment updated successfully",
			data: { comment },
		});
	} catch (err) {
		console.error("Update Comment Controller Error:", err);

		if (err.message === "Comment not found") {
			return res.status(404).json({
				status: "error",
				message: "Comment not found",
			});
		}

		if (err.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only update your own comments",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};
