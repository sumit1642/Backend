import {
	getAllTags,
	addTagToPost,
	removeTagFromPost,
	getPostsByTag,
	getUserLikedTags,
	getPostsByMultipleTags,
} from "../services/tag.service.js";
import { decodeAndValidateTagName, parseAndValidateMultipleTags } from "../utils/tag-validation.js";

const validatePostId = (postId) => {
	const parsedId = Number.parseInt(postId);
	if (isNaN(parsedId) || parsedId <= 0) {
		return null;
	}
	return parsedId;
};

export const getAllTagsController = async (req, res) => {
	try {
		const tags = await getAllTags();

		return res.status(200).json({
			status: "success",
			message: "Tags fetched successfully",
			data: { tags },
		});
	} catch (err) {
		console.error("Get All Tags Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Failed to fetch tags",
		});
	}
};

export const addTagToPostController = async (req, res) => {
	try {
		const postId = validatePostId(req.params.postId);
		const userId = req.user.userId;
		const { tagName } = req.body;

		if (!postId) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		if (!tagName || !tagName.trim()) {
			return res.status(400).json({
				status: "error",
				message: "Tag name is required",
			});
		}

		const trimmedTagName = tagName.trim().toLowerCase();
		if (trimmedTagName.length < 2) {
			return res.status(400).json({
				status: "error",
				message: "Tag name must be at least 2 characters long",
			});
		}

		if (trimmedTagName.length > 20) {
			return res.status(400).json({
				status: "error",
				message: "Tag name cannot be longer than 20 characters",
			});
		}

		const tag = await addTagToPost(postId, trimmedTagName, userId);

		return res.status(201).json({
			status: "success",
			message: "Tag added to post successfully",
			data: { tag },
		});
	} catch (err) {
		console.error("Add Tag To Post Controller Error:", err);

		if (err.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		if (err.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only add tags to your own posts",
			});
		}

		if (err.message === "Tag already exists on this post") {
			return res.status(409).json({
				status: "error",
				message: "Tag already exists on this post",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to add tag to post",
		});
	}
};

export const removeTagFromPostController = async (req, res) => {
	try {
		const postId = validatePostId(req.params.postId);
		const encodedTagName = req.params.tagName;
		const userId = req.user.userId;

		if (!postId) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const tagName = decodeAndValidateTagName(encodedTagName);
		if (!tagName) {
			return res.status(400).json({
				status: "error",
				message: "Invalid tag name format",
			});
		}

		await removeTagFromPost(postId, tagName, userId);

		return res.status(200).json({
			status: "success",
			message: "Tag removed from post successfully",
		});
	} catch (err) {
		console.error("Remove Tag From Post Controller Error:", err);

		if (err.message === "Post not found") {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		if (err.message === "Unauthorized") {
			return res.status(403).json({
				status: "error",
				message: "You can only remove tags from your own posts",
			});
		}

		if (err.message === "Tag not found") {
			return res.status(404).json({
				status: "error",
				message: "Tag not found",
			});
		}

		if (err.message === "Tag not found on this post") {
			return res.status(404).json({
				status: "error",
				message: "Tag not found on this post",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to remove tag from post",
		});
	}
};

export const getPostsByTagController = async (req, res) => {
	try {
		const encodedTagName = req.params.tagName;
		const userId = req.user?.userId;

		const tagName = decodeAndValidateTagName(encodedTagName);
		if (!tagName) {
			return res.status(400).json({
				status: "error",
				message: "Invalid tag name format",
			});
		}

		const posts = await getPostsByTag(tagName, userId);

		return res.status(200).json({
			status: "success",
			message: "Posts fetched successfully",
			data: { posts },
		});
	} catch (err) {
		console.error("Get Posts By Tag Controller Error:", err);

		if (err.message === "Tag not found") {
			return res.status(404).json({
				status: "error",
				message: "Tag not found",
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to fetch posts by tag",
		});
	}
};

/**
 * NEW: Get posts filtered by multiple tags (intersection logic)
 * Query parameter: ?tags=tag1,tag2,tag3
 */
export const getPostsByMultipleTagsController = async (req, res) => {
	try {
		const { tags: tagsString } = req.query;
		const userId = req.user?.userId;

		if (!tagsString) {
			return res.status(400).json({
				status: "error",
				message: "At least one tag is required. Use query parameter: ?tags=tag1,tag2",
			});
		}

		const tagNames = parseAndValidateMultipleTags(tagsString);
		if (!tagNames || tagNames.length === 0) {
			return res.status(400).json({
				status: "error",
				message: "Invalid tag names format. Tags must be comma-separated and valid.",
			});
		}

		const posts = await getPostsByMultipleTags(tagNames, userId);

		return res.status(200).json({
			status: "success",
			message: `Posts fetched successfully (filtered by ${tagNames.length} tag${tagNames.length > 1 ? "s" : ""})`,
			data: { posts, appliedTags: tagNames },
		});
	} catch (err) {
		console.error("Get Posts By Multiple Tags Controller Error:", err);

		if (err.message.includes("Tags not found")) {
			return res.status(404).json({
				status: "error",
				message: err.message,
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Failed to fetch posts by multiple tags",
		});
	}
};

export const getUserLikedTagsController = async (req, res) => {
	try {
		const userId = req.user.userId;
		const likedTags = await getUserLikedTags(userId);

		return res.status(200).json({
			status: "success",
			message: "Your liked tags fetched successfully",
			data: { tags: likedTags },
		});
	} catch (err) {
		console.error("Get User Liked Tags Controller Error:", err);
		return res.status(500).json({
			status: "error",
			message: "Failed to fetch your liked tags",
		});
	}
};
