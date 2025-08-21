// controllers/interaction.controller.js (Updated)
import { toggleLike, addComment, getComments, deleteComment, updateComment } from "../services/interaction.service.js";

// Helper function to validate post ID
const validatePostId = (postId) => {
	const parsedId = parseInt(postId);
	if (isNaN(parsedId) || parsedId <= 0) {
		return null;
	}
	return parsedId;
};

// Helper function to validate comment ID
const validateCommentId = (commentId) => {
	const parsedId = parseInt(commentId);
	if (isNaN(parsedId) || parsedId <= 0) {
		return null;
	}
	return parsedId;
};

export const toggleLikeController = async (req, res) => {
	try {
		const postId = validatePostId(req.params.postId);
		const userId = req.user.userId;

		if (!postId) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const likeResult = await toggleLike(userId, postId);

		return res.status(200).json({
			status: "success",
			message: likeResult.message,
			data: {
				isLiked: likeResult.isLiked,
				likeCount: likeResult.likeCount,
			},
		});
	} catch (controllerError) {
		console.error("Toggle Like Controller Error:", controllerError);

		if (controllerError.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to toggle like",
		});
	}
};

export const addCommentController = async (req, res) => {
	try {
		const postId = validatePostId(req.params.postId);
		const userId = req.user.userId;
		const { content } = req.body;

		if (!postId) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		if (!content || !content.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Comment content is required",
			});
		}

		const trimmedCommentContent = content.trim();

		// Additional validation for comment length
		if (trimmedCommentContent.length > 500) {
			return res.status(400).json({
				status: "error",
				message: "Comment cannot be longer than 500 characters",
			});
		}

		const newComment = await addComment(userId, postId, trimmedCommentContent);

		return res.status(201).json({
			status: "success",
			message: "Comment added successfully",
			data: { comment: newComment },
		});
	} catch (controllerError) {
		console.error("Add Comment Controller Error:", controllerError);

		if (controllerError.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to add comment",
		});
	}
};

export const getCommentsController = async (req, res) => {
	try {
		const postId = validatePostId(req.params.postId);

		if (!postId) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const postComments = await getComments(postId);

		return res.status(200).json({
			status: "success",
			message: "Comments fetched successfully",
			data: {
				comments: postComments,
				commentsCount: postComments.length,
			},
		});
	} catch (controllerError) {
		console.error("Get Comments Controller Error:", controllerError);

		if (controllerError.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to fetch comments",
		});
	}
};

export const deleteCommentController = async (req, res) => {
	try {
		const commentId = validateCommentId(req.params.commentId);
		const userId = req.user.userId;

		if (!commentId) {
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
	} catch (controllerError) {
		console.error("Delete Comment Controller Error:", controllerError);

		if (controllerError.message === "Comment not found") {
			return res.status(404).json({
				status: "error",
				message: "Comment not found",
			});
		}

		if (controllerError.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only delete your own comments",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to delete comment",
		});
	}
};

export const updateCommentController = async (req, res) => {
	try {
		const commentId = validateCommentId(req.params.commentId);
		const userId = req.user.userId;
		const { content } = req.body;

		if (!commentId) {
			return res.status(400).json({
				status: "error",
				message: "Invalid comment ID",
			});
		}

		if (!content || !content.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Comment content is required",
			});
		}

		const trimmedUpdatedContent = content.trim();

		// Additional validation for updated comment length
		if (trimmedUpdatedContent.length > 500) {
			return res.status(400).json({
				status: "error",
				message: "Comment cannot be longer than 500 characters",
			});
		}

		const updatedComment = await updateComment(userId, commentId, trimmedUpdatedContent);

		return res.status(200).json({
			status: "success",
			message: "Comment updated successfully",
			data: { comment: updatedComment },
		});
	} catch (controllerError) {
		console.error("Update Comment Controller Error:", controllerError);

		if (controllerError.message === "Comment not found") {
			return res.status(404).json({
				status: "error",
				message: "Comment not found",
			});
		}

		if (controllerError.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only update your own comments",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to update comment",
		});
	}
};
