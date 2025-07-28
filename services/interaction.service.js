// services/interaction.service.js
import { prisma } from "../utils/prisma.js";

// LIKE FUNCTIONALITY
export const toggleLikeService = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user.userId;

		if (isNaN(postId)) {
			return res.status(400).json({ 
				status: "error",
				message: "Invalid post ID" 
			});
		}

		// Check if post exists
		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { id: true }
		});

		if (!post) {
			return res.status(404).json({ 
				status: "error",
				message: "Post not found" 
			});
		}

		// Check if user already liked this post
		const existingLike = await prisma.like.findUnique({
			where: {
				userId_postId: {
					userId,
					postId
				}
			}
		});

		let isLiked;
		let message;

		if (existingLike) {
			// Unlike the post
			await prisma.$transaction(async (tx) => {
				// Remove like
				await tx.like.delete({
					where: {
						userId_postId: {
							userId,
							postId
						}
					}
				});

				// Remove user-liked-tags relationships for this post
				const postTags = await tx.postTag.findMany({
					where: { postId },
					select: { tagId: true }
				});

				if (postTags.length > 0) {
					await tx.userLikedTag.deleteMany({
						where: {
							userId,
							tagId: {
								in: postTags.map(pt => pt.tagId)
							}
						}
					});
				}
			});

			isLiked = false;
			message = "Post unliked successfully";
		} else {
			// Like the post
			await prisma.$transaction(async (tx) => {
				// Add like
				await tx.like.create({
					data: {
						userId,
						postId
					}
				});

				// Add user-liked-tags relationships for this post
				const postTags = await tx.postTag.findMany({
					where: { postId },
					select: { tagId: true }
				});

				if (postTags.length > 0) {
					await Promise.all(
						postTags.map(async (pt) => {
							await tx.userLikedTag.upsert({
								where: {
									userId_tagId: {
										userId,
										tagId: pt.tagId
									}
								},
								update: {},
								create: {
									userId,
									tagId: pt.tagId
								}
							});
						})
					);
				}
			});

			isLiked = true;
			message = "Post liked successfully";
		}

		// Get updated like count
		const likeCount = await prisma.like.count({
			where: { postId }
		});

		return res.status(200).json({
			status: "success",
			message,
			data: {
				isLiked,
				likeCount
			}
		});
	} catch (err) {
		console.error("Error toggling like:", err);
		return res.status(500).json({ 
			status: "error",
			message: "Internal server error" 
		});
	}
};

// COMMENT FUNCTIONALITY
export const addCommentService = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user.userId;
		const { content } = req.body;

		if (isNaN(postId)) {
			return res.status(400).json({ 
				status: "error",
				message: "Invalid post ID" 
			});
		}

		if (!content || !content.trim()) {
			return res.status(400).json({ 
				status: "error",
				message: "Comment content is required" 
			});
		}

		if (content.trim().length > 500) { // Reasonable limit for comments
			return res.status(400).json({ 
				status: "error",
				message: "Comment must be 500 characters or less" 
			});
		}

		// Check if post exists
		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { id: true }
		});

		if (!post) {
			return res.status(404).json({ 
				status: "error",
				message: "Post not found" 
			});
		}

		// Create comment
		const newComment = await prisma.comment.create({
			data: {
				content: content.trim(),
				postId,
				authorId: userId
			},
			include: {
				author: {
					select: {
						id: true,
						name: true
					}
				}
			}
		});

		return res.status(201).json({
			status: "success",
			message: "Comment added successfully",
			data: {
				comment: newComment
			}
		});
	} catch (err) {
		console.error("Error adding comment:", err);
		return res.status(500).json({ 
			status: "error",
			message: "Internal server error" 
		});
	}
};

export const getCommentsService = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const { page = 1, limit = 20 } = req.query;

		if (isNaN(postId)) {
			return res.status(400).json({ 
				status: "error",
				message: "Invalid post ID" 
			});
		}

		// Validate pagination
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
		const offset = (pageNum - 1) * limitNum;

		// Check if post exists
		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { id: true }
		});

		if (!post) {
			return res.status(404).json({ 
				status: "error",
				message: "Post not found" 
			});
		}

		// Get comments with pagination
		const [comments, totalCount] = await Promise.all([
			prisma.comment.findMany({
				where: { postId },
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limitNum,
				include: {
					author: {
						select: {
							id: true,
							name: true
						}
					}
				}
			}),
			prisma.comment.count({ where: { postId } })
		]);

		// Calculate pagination info
		const totalPages = Math.ceil(totalCount / limitNum);
		const hasNextPage = pageNum < totalPages;
		const hasPrevPage = pageNum > 1;

		return res.status(200).json({
			status: "success",
			message: "Comments fetched successfully",
			data: {
				comments,
				pagination: {
					currentPage: pageNum,
					totalPages,
					totalCount,
					hasNextPage,
					hasPrevPage,
					limit: limitNum
				}
			}
		});
	} catch (err) {
		console.error("Error fetching comments:", err);
		return res.status(500).json({