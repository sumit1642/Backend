// services/interaction.service.js
import { prisma } from "../utils/prisma.js";

export const toggleLike = async (userId, postId) => {
	// Check if post exists
	const post = await prisma.post.findUnique({
		where: { id: postId },
	});

	if (!post) {
		throw new Error("Post not found");
	}

	// Check if user already liked this post
	const existingLike = await prisma.like.findUnique({
		where: {
			userId_postId: {
				userId,
				postId,
			},
		},
	});

	let isLiked;
	let message;

	if (existingLike) {
		// Unlike the post
		await prisma.like.delete({
			where: {
				userId_postId: {
					userId,
					postId,
				},
			},
		});
		isLiked = false;
		message = "Post unliked successfully";
	} else {
		// Like the post
		await prisma.like.create({
			data: {
				userId,
				postId,
			},
		});
		isLiked = true;
		message = "Post liked successfully";
	}

	// Get updated like count
	const likeCount = await prisma.like.count({
		where: { postId },
	});

	return { isLiked, likeCount, message };
};

export const addComment = async (userId, postId, content) => {
	// Check if post exists
	const post = await prisma.post.findUnique({
		where: { id: postId },
	});

	if (!post) {
		throw new Error("Post not found");
	}

	// Create comment
	const comment = await prisma.comment.create({
		data: {
			content,
			postId,
			authorId: userId,
		},
		include: {
			author: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return comment;
};

export const getComments = async (postId) => {
	// Check if post exists
	const post = await prisma.post.findUnique({
		where: { id: postId },
	});

	if (!post) {
		throw new Error("Post not found");
	}

	// Get comments
	const comments = await prisma.comment.findMany({
		where: { postId },
		orderBy: { createdAt: "desc" },
		include: {
			author: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return comments;
};

export const deleteComment = async (userId, commentId) => {
	// Check if comment exists and user owns it
	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
	});

	if (!comment) {
		throw new Error("Comment not found");
	}

	if (comment.authorId !== userId) {
		throw new Error("Unauthorized");
	}

	// Delete comment
	await prisma.comment.delete({
		where: { id: commentId },
	});
};

export const updateComment = async (userId, commentId, content) => {
	// Check if comment exists and user owns it
	const existingComment = await prisma.comment.findUnique({
		where: { id: commentId },
	});

	if (!existingComment) {
		throw new Error("Comment not found");
	}

	if (existingComment.authorId !== userId) {
		throw new Error("Unauthorized");
	}

	// Update comment
	const comment = await prisma.comment.update({
		where: { id: commentId },
		data: { content },
		include: {
			author: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return comment;
};
