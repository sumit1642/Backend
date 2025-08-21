// services/interaction.service.js (Updated)
import { prisma } from "../utils/prisma.js";

export const toggleLike = async (userId, postId) => {
	try {
		// Check if post exists with its tags
		const existingPost = await prisma.post.findUnique({
			where: { id: postId },
			include: {
				tags: {
					include: {
						tag: true,
					},
				},
			},
		});

		if (!existingPost) {
			throw new Error("Post not found");
		}

		// Use database transaction to ensure data consistency
		const toggleLikeResult = await prisma.$transaction(async (databaseTransaction) => {
			// Check if user already liked this post
			const existingLikeRecord = await databaseTransaction.like.findUnique({
				where: {
					userId_postId: {
						userId,
						postId,
					},
				},
			});

			let isLikedByUser;
			let responseMessage;

			if (existingLikeRecord) {
				// User wants to unlike the post
				await databaseTransaction.like.delete({
					where: {
						userId_postId: {
							userId,
							postId,
						},
					},
				});

				// Only remove user liked tags that are ONLY from this specific post
				// First, get all other posts this user has liked
				const userOtherLikedPosts = await databaseTransaction.like.findMany({
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
				for (const postTag of existingPost.tags) {
					if (!tagIdsFromOtherLikedPosts.has(postTag.tag.id)) {
						await databaseTransaction.userLikedTag.deleteMany({
							where: {
								userId,
								tagId: postTag.tag.id,
							},
						});
					}
				}

				isLikedByUser = false;
				responseMessage = "Post unliked successfully";
			} else {
				// User wants to like the post
				await databaseTransaction.like.create({
					data: {
						userId,
						postId,
					},
				});

				// Add user liked tags for this post's tags
				for (const postTag of existingPost.tags) {
					await databaseTransaction.userLikedTag.upsert({
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

				isLikedByUser = true;
				responseMessage = "Post liked successfully";
			}

			// Get updated total like count for this post
			const updatedLikeCount = await databaseTransaction.like.count({
				where: { postId },
			});

			return {
				isLiked: isLikedByUser,
				likeCount: updatedLikeCount,
				message: responseMessage,
			};
		});

		return toggleLikeResult;
	} catch (serviceError) {
		console.error("Toggle like service error:", serviceError);
		throw serviceError;
	}
};

export const addComment = async (userId, postId, commentContent) => {
	try {
		// Check if post exists
		const existingPost = await prisma.post.findUnique({
			where: { id: postId },
		});

		if (!existingPost) {
			throw new Error("Post not found");
		}

		// Additional validation for comment content
		if (!commentContent || commentContent.length < 1) {
			throw new Error("Comment content cannot be empty");
		}

		if (commentContent.length > 500) {
			throw new Error("Comment content cannot exceed 500 characters");
		}

		// Create new comment
		const newComment = await prisma.comment.create({
			data: {
				content: commentContent,
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

		return newComment;
	} catch (serviceError) {
		console.error("Add comment service error:", serviceError);
		throw serviceError;
	}
};

export const getComments = async (postId) => {
	try {
		// Check if post exists
		const existingPost = await prisma.post.findUnique({
			where: { id: postId },
		});

		if (!existingPost) {
			throw new Error("Post not found");
		}

		// Get all comments for this post
		const postComments = await prisma.comment.findMany({
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

		return postComments;
	} catch (serviceError) {
		console.error("Get comments service error:", serviceError);
		throw serviceError;
	}
};

export const deleteComment = async (userId, commentId) => {
	try {
		// Check if comment exists and get its details
		const existingComment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!existingComment) {
			throw new Error("Comment not found");
		}

		// Verify that user owns this comment
		if (existingComment.authorId !== userId) {
			throw new Error("Unauthorized");
		}

		// Delete the comment
		await prisma.comment.delete({
			where: { id: commentId },
		});

		return { message: "Comment deleted successfully" };
	} catch (serviceError) {
		console.error("Delete comment service error:", serviceError);
		throw serviceError;
	}
};

export const updateComment = async (userId, commentId, updatedContent) => {
	try {
		// Check if comment exists and get its details
		const existingComment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!existingComment) {
			throw new Error("Comment not found");
		}

		// Verify that user owns this comment
		if (existingComment.authorId !== userId) {
			throw new Error("Unauthorized");
		}

		// Additional validation for updated content
		if (!updatedContent || updatedContent.length < 1) {
			throw new Error("Updated comment content cannot be empty");
		}

		if (updatedContent.length > 500) {
			throw new Error("Updated comment content cannot exceed 500 characters");
		}

		// Update the comment with new content
		const updatedComment = await prisma.comment.update({
			where: { id: commentId },
			data: { content: updatedContent },
			include: {
				author: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		return updatedComment;
	} catch (serviceError) {
		console.error("Update comment service error:", serviceError);
		throw serviceError;
	}
};
