// services/post.service.js
import { prisma } from "../utils/prisma.js"

const formatPost = (post, userId = null) => ({
	id: post.id,
	title: post.title,
	content: post.content,
	published: post.published,
	createdAt: post.createdAt,
	updatedAt: post.updatedAt,
	author: post.author,
	commentsCount: post.comments?.length || 0,
	likesCount: post.likes?.length || 0,
	isLikedByUser: userId ? post.likes?.some((like) => like.userId === userId) || false : false,
	tags: post.tags?.map((pt) => pt.tag) || [],
})

export const createPost = async ({ title, content, published, userId }) => {
	try {
		// Check for duplicate title per user (from schema constraint)
		const existingPost = await prisma.post.findFirst({
			where: {
				title,
				authorId: userId,
			},
		})

		if (existingPost) {
			throw new Error("Title already exists")
		}

		// Create post
		const post = await prisma.post.create({
			data: {
				title,
				content,
				published,
				authorId: userId,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				comments: {
					select: { id: true },
				},
				likes: {
					select: { userId: true },
				},
				tags: {
					include: {
						tag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})

		return formatPost(post, userId)
	} catch (error) {
		console.error("Create post error:", error)
		throw error
	}
}

export const getAllPosts = async ({ published, userId }) => {
	try {
		const whereClause = {}

		if (published !== undefined) {
			whereClause.published = published
		}

		const posts = await prisma.post.findMany({
			where: whereClause,
			orderBy: { createdAt: "desc" },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				comments: {
					select: { id: true },
				},
				likes: {
					select: { userId: true },
				},
				tags: {
					include: {
						tag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})

		return posts.map((post) => formatPost(post, userId))
	} catch (error) {
		console.error("Get all posts error:", error)
		throw error
	}
}

export const getPostById = async (postId, userId) => {
	try {
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
				tags: {
					include: {
						tag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})

		if (!post) {
			throw new Error("Post not found")
		}

		// Return detailed post with comments
		return {
			...formatPost(post, userId),
			comments: post.comments,
		}
	} catch (error) {
		console.error("Get post by ID error:", error)
		throw error
	}
}

export const updatePost = async (postId, userId, updateData) => {
	try {
		// Check if post exists and user owns it
		const existingPost = await prisma.post.findUnique({
			where: { id: postId },
		})

		if (!existingPost) {
			throw new Error("Post not found")
		}

		if (existingPost.authorId !== userId) {
			throw new Error("Unauthorized")
		}

		// Check for duplicate title if title is being updated
		if (updateData.title && updateData.title !== existingPost.title) {
			const duplicatePost = await prisma.post.findFirst({
				where: {
					title: updateData.title,
					authorId: userId,
					NOT: { id: postId },
				},
			})

			if (duplicatePost) {
				throw new Error("Title already exists")
			}
		}

		// Update post
		const post = await prisma.post.update({
			where: { id: postId },
			data: updateData,
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				comments: {
					select: { id: true },
				},
				likes: {
					select: { userId: true },
				},
				tags: {
					include: {
						tag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})

		return formatPost(post, userId)
	} catch (error) {
		console.error("Update post error:", error)
		throw error
	}
}

export const deletePost = async (postId, userId) => {
	try {
		// FIXED: Use transaction to ensure data consistency during deletion
		const result = await prisma.$transaction(async (transactionClient) => {
			// Check if post exists and user owns it
			const post = await transactionClient.post.findUnique({
				where: { id: postId },
				include: {
					tags: true,
					likes: true,
					comments: true,
				},
			})

			if (!post) {
				throw new Error("Post not found")
			}

			if (post.authorId !== userId) {
				throw new Error("Unauthorized")
			}

			// Delete post (cascade will handle related records, but we're being explicit)
			await transactionClient.post.delete({
				where: { id: postId },
			})

			return { deletedPost: post }
		})

		return result
	} catch (error) {
		console.error("Delete post error:", error)
		throw error
	}
}

export const getUserPosts = async (targetUserId, requestingUserId) => {
	try {
		// Check if target user exists
		const targetUser = await prisma.user.findUnique({
			where: { id: targetUserId },
			select: { id: true },
		})

		if (!targetUser) {
			throw new Error("User not found")
		}

		const whereClause = {
			authorId: targetUserId,
		}

		// If requesting user is not the post author, only show published posts
		if (requestingUserId !== targetUserId) {
			whereClause.published = true
		}

		const posts = await prisma.post.findMany({
			where: whereClause,
			orderBy: { createdAt: "desc" },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				comments: {
					select: { id: true },
				},
				likes: {
					select: { userId: true },
				},
				tags: {
					include: {
						tag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})

		return posts.map((post) => formatPost(post, requestingUserId))
	} catch (error) {
		console.error("Get user posts error:", error)
		throw error
	}
}

export const getMyPosts = async (userId) => {
	try {
		const posts = await prisma.post.findMany({
			where: {
				authorId: userId,
			},
			orderBy: { createdAt: "desc" },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				comments: {
					select: { id: true },
				},
				likes: {
					select: { userId: true },
				},
				tags: {
					include: {
						tag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})

		return posts.map((post) => formatPost(post, userId))
	} catch (error) {
		console.error("Get my posts error:", error)
		throw error
	}
}
