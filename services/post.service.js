// services/post.service.js
import { prisma } from "../utils/prisma.js";

export const createPost = async ({ title, content, published, userId }) => {
	// Check for duplicate title per user
	const existingPost = await prisma.post.findFirst({
		where: {
			title,
			authorId: userId,
		},
	});

	if (existingPost) {
		throw new Error("Title already exists");
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
		},
	});

	// Format response
	return {
		id: post.id,
		title: post.title,
		content: post.content,
		published: post.published,
		createdAt: post.createdAt,
		updatedAt: post.updatedAt,
		author: post.author,
		commentsCount: post.comments.length,
		likesCount: post.likes.length,
	};
};

export const getAllPosts = async ({ published, userId }) => {
	const whereClause = {};

	if (published !== undefined) {
		whereClause.published = published;
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
		},
	});

	// Format posts
	return posts.map((post) => ({
		id: post.id,
		title: post.title,
		content: post.content,
		published: post.published,
		createdAt: post.createdAt,
		updatedAt: post.updatedAt,
		author: post.author,
		commentsCount: post.comments.length,
		likesCount: post.likes.length,
		isLikedByUser: userId ? post.likes.some((like) => like.userId === userId) : false,
	}));
};

export const getPostById = async (postId, userId) => {
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
		},
	});

	if (!post) {
		throw new Error("Post not found");
	}

	// Check if current user liked this post
	const isLikedByUser = userId ? post.likes.some((like) => like.userId === userId) : false;

	// Format response
	return {
		id: post.id,
		title: post.title,
		content: post.content,
		published: post.published,
		createdAt: post.createdAt,
		updatedAt: post.updatedAt,
		author: post.author,
		comments: post.comments,
		likesCount: post.likes.length,
		isLikedByUser,
	};
};

export const updatePost = async (postId, userId, updateData) => {
	// Check if post exists and user owns it
	const existingPost = await prisma.post.findUnique({
		where: { id: postId },
	});

	if (!existingPost) {
		throw new Error("Post not found");
	}

	if (existingPost.authorId !== userId) {
		throw new Error("Unauthorized");
	}

	// Check for duplicate title if title is being updated
	if (updateData.title && updateData.title !== existingPost.title) {
		const duplicatePost = await prisma.post.findFirst({
			where: {
				title: updateData.title,
				authorId: userId,
				NOT: { id: postId },
			},
		});

		if (duplicatePost) {
			throw new Error("Title already exists");
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
		},
	});

	// Format response
	return {
		id: post.id,
		title: post.title,
		content: post.content,
		published: post.published,
		createdAt: post.createdAt,
		updatedAt: post.updatedAt,
		author: post.author,
		commentsCount: post.comments.length,
		likesCount: post.likes.length,
	};
};

export const deletePost = async (postId, userId) => {
	// Check if post exists and user owns it
	const post = await prisma.post.findUnique({
		where: { id: postId },
	});

	if (!post) {
		throw new Error("Post not found");
	}

	if (post.authorId !== userId) {
		throw new Error("Unauthorized");
	}

	// Delete post (cascade will handle related records)
	await prisma.post.delete({
		where: { id: postId },
	});
};
