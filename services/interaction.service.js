// services/interaction.service.js
import { prisma } from "../utils/prisma.js";

export const toggleLike = async (userId, postId) => {
	try {
		// Check if post exists
		const post = await prisma.post.findUnique({
			where: { id: postId },
			include: {
				tags: {
					include: {
						tag: true,
					},
				},
			},
		});

		if (!post) {
			throw new Error("Post not found");
		}

		// Use transaction to ensure data consistency
		const result = await prisma.$transaction(async (transactionClient) => {
			// Check if user already liked this post
			const existingLike = await transactionClient.like.findUnique({
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
				await transactionClient.like.delete({
					where: {
						userId_postId: {
							userId,
							postId,
						},
					},
				});

				// FIXED: Only remove user liked tags that are ONLY from this specific post
				// First, get all other posts this user has liked
				const userOtherLikedPosts = await transactionClient.like.findMany({
					where: {
						userId,
						postId: {
							not: postId, // Exclude the current post being unliked
						},
					},
					include: {
						post: {
							include: {
								tags: {
									include: {
										tag: true,
									},
								},
							},
						},
					},
				});

				// Get all tag IDs from other liked posts
				const tagIdsFromOtherLikedPosts = new Set();
				userOtherLikedPosts.forEach((likedPost) => {
					likedPost.post.tags.forEach((postTag) => {
						tagIdsFromOtherLikedPosts.add(postTag.tag.id);
					});
				});

				// Only remove liked tags that are NOT in other liked posts
				for (const postTag of post.tags) {
					if (!tagIdsFromOtherLikedPosts.has(postTag.tag.id)) {
						await transactionClient.userLikedTag.deleteMany({
							where: {
								userId,
								tagId: postTag.tag.id,
							},
						});
					}
				}

				isLiked = false;
				message = "Post unliked successfully";
			} else {
				// Like the post
				await transactionClient.like.create({
					data: {
						userId,
						postId,
					},
				});

				// Add user liked tags for this post's tags
				for (const postTag of post.tags) {
					await transactionClient.userLikedTag.upsert({
						where: {
							userId_tagId: {
								userId,
								tagId: postTag.tag.id,
							},
						},
						update: {}, // Do nothing if already exists
						create: {
							userId,
							tagId: postTag.tag.id,
						},
					});
				}

				isLiked = true;
				message = "Post liked successfully";
			}

			// Get updated like count
			const likeCount = await transactionClient.like.count({
				where: { postId },
			});

			return { isLiked, likeCount, message };
		});

		return result;
	} catch (error) {
		console.error("Toggle like error:", error);
		throw error;
	}
};

export const addComment = async (userId, postId, content) => {
	try {
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
	} catch (error) {
		console.error("Add comment error:", error);
		throw error;
	}
};

export const getComments = async (postId) => {
	try {
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
	} catch (error) {
		console.error("Get comments error:", error);
		throw error;
	}
};

export const deleteComment = async (userId, commentId) => {
	try {
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
	} catch (error) {
		console.error("Delete comment error:", error);
		throw error;
	}
};

export const updateComment = async (userId, commentId, content) => {
	try {
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
	} catch (error) {
		console.error("Update comment error:", error);
		throw error;
	}
};
