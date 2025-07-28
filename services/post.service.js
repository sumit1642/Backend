// services/post.service.js
import { prisma } from "../utils/prisma.js";

export const createPostService = async (req, res) => {
	try {
		const { title, content, tags, published = false } = req.body;
		const userId = req.user.userId;

		// Validation
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

		if (!Array.isArray(tags) || tags.length === 0) {
			return res.status(400).json({
				status: "error",
				message: "At least one tag is required",
			});
		}

		// Validate title length (database constraint is 50 chars)
		if (title.trim().length > 50) {
			return res.status(400).json({
				status: "error",
				message: "Title must be 50 characters or less",
			});
		}

		// Validate content length (database constraint is 191 chars)
		if (content.trim().length > 191) {
			return res.status(400).json({
				status: "error",
				message: "Content must be 191 characters or less",
			});
		}

		// Validate tags
		const validTags = tags.filter(
			(tag) => tag && typeof tag === "string" && tag.trim().length > 0,
		);

		if (validTags.length === 0) {
			return res.status(400).json({
				status: "error",
				message: "At least one valid tag is required",
			});
		}

		if (validTags.length > 10) {
			// Reasonable limit
			return res.status(400).json({
				status: "error",
				message: "Maximum 10 tags allowed",
			});
		}

		// Check for duplicate title per user (database constraint)
		const existingPost = await prisma.post.findFirst({
			where: {
				title: title.trim(),
				authorId: userId,
			},
		});

		if (existingPost) {
			return res.status(409).json({
				status: "error",
				message: "You already have a post with this title",
			});
		}

		// Create post with transaction to ensure data consistency
		const result = await prisma.$transaction(async (tx) => {
			// Create the post
			const newPost = await tx.post.create({
				data: {
					title: title.trim(),
					content: content.trim(),
					published: Boolean(published),
					authorId: userId,
				},
			});

			// Handle tags - create if they don't exist
			const tagRecords = await Promise.all(
				validTags.map(async (tagName) => {
					const normalizedTagName = tagName.trim().toLowerCase();
					return await tx.tag.upsert({
						where: { name: normalizedTagName },
						update: {},
						create: { name: normalizedTagName },
					});
				}),
			);

			// Create post-tag relationships
			await Promise.all(
				tagRecords.map(
					async (tag) =>
						await tx.postTag.create({
							data: {
								postId: newPost.id,
								tagId: tag.id,
							},
						}),
				),
			);

			// Return post with all related data
			return await tx.post.findUnique({
				where: { id: newPost.id },
				include: {
					author: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					tags: {
						select: {
							tag: {
								select: { id: true, name: true },
							},
						},
					},
					comments: {
						select: { id: true },
					},
					likes: {
						select: { userId: true },
					},
				},
			});
		});

		// Format response
		const formattedPost = {
			id: result.id,
			title: result.title,
			content: result.content,
			published: result.published,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
			author: result.author,
			tags: result.tags.map((pt) => pt.tag),
			commentsCount: result.comments.length,
			likesCount: result.likes.length,
		};

		return res.status(201).json({
			status: "success",
			message: "Post created successfully",
			data: {
				post: formattedPost,
			},
		});
	} catch (err) {
		console.error("Error creating post:", err);

		// Handle specific database errors
		if (err.code === "P2002") {
			// Unique constraint violation
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

export const getAllPostsService = async (req, res) => {
	try {
		const { page = 1, limit = 10, published = true, authorId, tag } = req.query;

		// Validation
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Max 50 posts per page
		const offset = (pageNum - 1) * limitNum;

		// Build where clause
		const whereClause = {};

		if (published !== undefined) {
			whereClause.published = published === "true";
		}

		if (authorId) {
			const authorIdNum = parseInt(authorId);
			if (!isNaN(authorIdNum)) {
				whereClause.authorId = authorIdNum;
			}
		}

		if (tag) {
			whereClause.tags = {
				some: {
					tag: {
						name: {
							contains: tag.toLowerCase(),
						},
					},
				},
			};
		}

		// Get posts with pagination
		const [posts, totalCount] = await Promise.all([
			prisma.post.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limitNum,
				include: {
					author: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					tags: {
						select: {
							tag: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
					comments: {
						select: { id: true },
					},
					likes: {
						select: { userId: true },
					},
				},
			}),
			prisma.post.count({ where: whereClause }),
		]);

		// Format posts
		const formattedPosts = posts.map((post) => ({
			id: post.id,
			title: post.title,
			content: post.content,
			published: post.published,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt,
			author: post.author,
			tags: post.tags.map((t) => t.tag),
			commentsCount: post.comments.length,
			likesCount: post.likes.length,
		}));

		// Calculate pagination info
		const totalPages = Math.ceil(totalCount / limitNum);
		const hasNextPage = pageNum < totalPages;
		const hasPrevPage = pageNum > 1;

		return res.status(200).json({
			status: "success",
			message: "Posts fetched successfully",
			data: {
				posts: formattedPosts,
				pagination: {
					currentPage: pageNum,
					totalPages,
					totalCount,
					hasNextPage,
					hasPrevPage,
					limit: limitNum,
				},
			},
		});
	} catch (err) {
		console.error("Error fetching posts:", err);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const getPostByIdService = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user?.userId; // Optional user for checking likes

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const post = await prisma.post.findUnique({
			where: { id: postId },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				tags: {
					select: {
						tag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				comments: {
					include: {
						author: {
							select: {
								id: true,
								name: true,
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				},
				likes: {
					select: { userId: true },
				},
			},
		});

		if (!post) {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		// Check if current user liked this post
		const isLikedByUser = userId ? post.likes.some((like) => like.userId === userId) : false;

		// Format response
		const formattedPost = {
			id: post.id,
			title: post.title,
			content: post.content,
			published: post.published,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt,
			author: post.author,
			tags: post.tags.map((t) => t.tag),
			comments: post.comments,
			likesCount: post.likes.length,
			isLikedByUser,
		};

		return res.status(200).json({
			status: "success",
			message: "Post fetched successfully",
			data: {
				post: formattedPost,
			},
		});
	} catch (err) {
		console.error("Error fetching post:", err);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};

export const updatePostService = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user.userId;
		const { title, content, tags, published } = req.body;

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		// Check if post exists and user owns it
		const existingPost = await prisma.post.findUnique({
			where: { id: postId },
			select: {
				id: true,
				authorId: true,
				title: true,
			},
		});

		if (!existingPost) {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		if (existingPost.authorId !== userId) {
			return res.status(403).json({
				status: "error",
				message: "You are not authorized to update this post",
			});
		}

		// Build update data
		const updateData = {};

		if (title !== undefined) {
			if (!title || !title.trim()) {
				return res.status(400).json({
					status: "error",
					message: "Title cannot be empty",
				});
			}
			if (title.trim().length > 50) {
				return res.status(400).json({
					status: "error",
					message: "Title must be 50 characters or less",
				});
			}

			// Check for duplicate title (only if title is changing)
			if (title.trim() !== existingPost.title) {
				const duplicatePost = await prisma.post.findFirst({
					where: {
						title: title.trim(),
						authorId: userId,
						NOT: { id: postId },
					},
				});

				if (duplicatePost) {
					return res.status(409).json({
						status: "error",
						message: "You already have a post with this title",
					});
				}
			}

			updateData.title = title.trim();
		}

		if (content !== undefined) {
			if (!content || !content.trim()) {
				return res.status(400).json({
					status: "error",
					message: "Content cannot be empty",
				});
			}
			if (content.trim().length > 191) {
				return res.status(400).json({
					status: "error",
					message: "Content must be 191 characters or less",
				});
			}
			updateData.content = content.trim();
		}

		if (published !== undefined) {
			updateData.published = Boolean(published);
		}

		// Update post with transaction
		const result = await prisma.$transaction(async (tx) => {
			// Update post
			const updatedPost = await tx.post.update({
				where: { id: postId },
				data: updateData,
			});

			// Handle tags if provided
			if (Array.isArray(tags)) {
				// Validate tags
				const validTags = tags.filter(
					(tag) => tag && typeof tag === "string" && tag.trim().length > 0,
				);

				if (validTags.length === 0) {
					throw new Error("At least one valid tag is required");
				}

				if (validTags.length > 10) {
					throw new Error("Maximum 10 tags allowed");
				}

				// Remove existing post-tag relationships
				await tx.postTag.deleteMany({
					where: { postId },
				});

				// Create new tags and relationships
				const tagRecords = await Promise.all(
					validTags.map(async (tagName) => {
						const normalizedTagName = tagName.trim().toLowerCase();
						return await tx.tag.upsert({
							where: { name: normalizedTagName },
							update: {},
							create: { name: normalizedTagName },
						});
					}),
				);

				await Promise.all(
					tagRecords.map(
						async (tag) =>
							await tx.postTag.create({
								data: {
									postId: updatedPost.id,
									tagId: tag.id,
								},
							}),
					),
				);
			}

			// Return updated post with relations
			return await tx.post.findUnique({
				where: { id: postId },
				include: {
					author: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					tags: {
						select: {
							tag: {
								select: { id: true, name: true },
							},
						},
					},
					comments: {
						select: { id: true },
					},
					likes: {
						select: { userId: true },
					},
				},
			});
		});

		// Format response
		const formattedPost = {
			id: result.id,
			title: result.title,
			content: result.content,
			published: result.published,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
			author: result.author,
			tags: result.tags.map((pt) => pt.tag),
			commentsCount: result.comments.length,
			likesCount: result.likes.length,
		};

		return res.status(200).json({
			status: "success",
			message: "Post updated successfully",
			data: {
				post: formattedPost,
			},
		});
	} catch (err) {
		console.error("Error updating post:", err);

		if (err.message.includes("tag")) {
			return res.status(400).json({
				status: "error",
				message: err.message,
			});
		}

		if (err.code === "P2002") {
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

export const deletePostService = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user?.userId;

		if (isNaN(postId)) {
			return res.status(400).json({
				status: "error",
				message: "Invalid post ID",
			});
		}

		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: {
				id: true,
				authorId: true,
				title: true,
			},
		});

		if (!post) {
			return res.status(404).json({
				status: "error",
				message: "Post not found",
			});
		}

		if (post.authorId !== userId) {
			return res.status(403).json({
				status: "error",
				message: "You are not authorized to delete this post",
			});
		}

		// Delete post (cascade will handle related records)
		await prisma.post.delete({
			where: { id: postId },
		});

		return res.status(200).json({
			status: "success",
			message: "Post deleted successfully",
		});
	} catch (err) {
		console.error("Error deleting post:", err);
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
		});
	}
};
