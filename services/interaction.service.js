// services/interaction.service.js
import { prisma } from "../utils/prisma.js";
import { checkRateLimit } from "../utils/like-rate-limiter.js";
import { getCachedLikeCount, setCachedLikeCount, invalidateLikeCache } from "../utils/like-cache.js";

export const toggleLike = async (userId, postId) => {
	try {
		// Check rate limits
		const rateLimitCheck = await checkRateLimit(userId, postId);
		if (!rateLimitCheck.allowed) {
			const error = new Error(rateLimitCheck.reason);
			error.statusCode = 429;
			error.retryAfter = rateLimitCheck.retryAfter;
			throw error;
		}

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

				// Only remove user liked tags that are ONLY from this specific post
				const userOtherLikedPosts = await transactionClient.like.findMany({
					where: {
						userId,
						postId: {
							not: postId,
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

				const tagIdsFromOtherLikedPosts = new Set();
				userOtherLikedPosts.forEach((likedPost) => {
					likedPost.post.tags.forEach((postTag) => {
						tagIdsFromOtherLikedPosts.add(postTag.tag.id);
					});
				});

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
						update: {},
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

		invalidateLikeCache(postId);

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

export const getCommentsPaginated = async (postId, limit = 5, offset = 0) => {
	try {
		// Check if post exists
		const post = await prisma.post.findUnique({
			where: { id: postId },
		});

		if (!post) {
			throw new Error("Post not found");
		}

		// Get total count of comments for this post
		const total = await prisma.comment.count({
			where: { postId },
		});

		// Get paginated comments
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
			take: limit,
			skip: offset,
		});

		// Calculate pagination metadata
		const hasMore = offset + limit < total;
		const nextOffset = offset + limit;

		return {
			comments,
			pagination: {
				total,
				limit,
				offset,
				hasMore,
				nextOffset,
			},
		};
	} catch (error) {
		console.error("Get comments paginated error:", error);
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

export const getLikeCount = async (postId) => {
	try {
		// Check if post exists
		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { id: true },
		});

		if (!post) {
			throw new Error("Post not found");
		}

		// Check cache first
		const cachedCount = getCachedLikeCount(postId);
		if (cachedCount !== null) {
			return cachedCount;
		}

		// Get from database
		const likeCount = await prisma.like.count({
			where: { postId },
		});

		// Cache the result
		setCachedLikeCount(postId, likeCount);

		return likeCount;
	} catch (error) {
		console.error("Get like count error:", error);
		throw error;
	}
};

export const getBatchLikeStatus = async (postIds, userId = null) => {
	try {
		// Validate postIds
		if (!Array.isArray(postIds) || postIds.length === 0) {
			throw new Error("Invalid post IDs");
		}

		if (postIds.length > 50) {
			throw new Error("Maximum 50 posts allowed per request");
		}

		// Check if all posts exist
		const posts = await prisma.post.findMany({
			where: {
				id: {
					in: postIds,
				},
			},
			select: { id: true },
		});

		if (posts.length !== postIds.length) {
			throw new Error("One or more posts not found");
		}

		// Get like counts for all posts
		const likeCounts = await prisma.like.groupBy({
			by: ["postId"],
			where: {
				postId: {
					in: postIds,
				},
			},
			_count: true,
		});

		// Get user's like status if authenticated
		let userLikes = [];
		if (userId) {
			userLikes = await prisma.like.findMany({
				where: {
					userId,
					postId: {
						in: postIds,
					},
				},
				select: { postId: true, createdAt: true },
			});
		}

		// Build response object
		const result = {};
		postIds.forEach((postId) => {
			const likeData = likeCounts.find((lc) => lc.postId === postId);
			const userLike = userLikes.find((ul) => ul.postId === postId);

			result[postId] = {
				count: likeData?._count || 0,
				isLikedByUser: !!userLike,
				likedAt: userLike?.createdAt || null,
			};
		});

		return result;
	} catch (error) {
		console.error("Get batch like status error:", error);
		throw error;
	}
};
