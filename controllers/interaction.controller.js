// controllers/interaction.controller.js
import {
	toggleLikeService,
	addCommentService,
	getCommentsService,
	deleteCommentService,
	updateCommentService,
} from "../services/interaction.service.js";

export const toggleLikeController = async (req, res) => {
	try {
		await toggleLikeService(req, res);
	} catch (err) {
		console.error("Toggle Like Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in toggle like controller",
		});
	}
};

export const addCommentController = async (req, res) => {
	try {
		await addCommentService(req, res);
	} catch (err) {
		console.error("Add Comment Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in add comment controller",
		});
	}
};

export const getCommentsController = async (req, res) => {
	try {
		await getCommentsService(req, res);
	} catch (err) {
		console.error("Get Comments Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in get comments controller",
		});
	}
};

export const deleteCommentController = async (req, res) => {
	try {
		await deleteCommentService(req, res);
	} catch (err) {
		console.error("Delete Comment Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in delete comment controller",
		});
	}
};

export const updateCommentController = async (req, res) => {
	try {
		await updateCommentService(req, res);
	} catch (err) {
		console.error("Update Comment Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Error in update comment controller",
		});
	}
};
