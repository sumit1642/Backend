// services/tag.service.js
import { prisma } from "../utils/prisma.js";

export const getAllTags = async () => {
	try {
		const tags = await prisma.tag.findMany({
			orderBy: { name: "asc" },
			include: {
				posts: {
					select: { postId: true },
				},
			},
		});

		return tags.map((tag) => ({
			id: tag.id,
			name: tag.name,
			postsCount: tag.posts.length,
		}));
	} catch (error) {
		console.error("Get all tags error:", error);
		throw error;
	}
};

export const createTag = async (name) => {
	try {
		// Check if tag already exists
		const existingTag = await prisma.tag.findUnique({
			where: { name: name.trim().toLowerCase().replace(/\s+/g, "-") },
		});

		if (existingTag) {
			return existingTag;
		}

		const tag = await prisma.tag.create({
			data: {
				name: name.trim().toLowerCase().replace(/\s+/g, "-"),
			},
		});

		return tag;
	} catch (error) {
		console.error("Create tag error:", error);
		throw error;
	}
};

export const addTagToPost = async (postId, tagName, userId) => {
	try {
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

		// Create or get tag
		const tag = await createTag(tagName);

		// Check if post already has this tag
		const existingPostTag = await prisma.postTag.findUnique({
			where: {
				postId_tagId: {
					postId,
					tagId: tag.id,
				},
			},
		});

		if (existingPostTag) {
			throw new Error("Tag already exists on this post");
		}

		// Add tag to post
		await prisma.postTag.create({
			data: {
				postId,
				tagId: tag.id,
			},
		});

		return tag;
	} catch (error) {
		console.error("Add tag to post error:", error);
		throw error;
	}
};

export const removeTagFromPost = async (postId, tagId, userId) => {
	try {
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

		// Check if post has this tag
		const postTag = await prisma.postTag.findUnique({
			where: {
				postId_tagId: {
					postId,
					tagId,
				},
			},
		});

		if (!postTag) {
			throw new Error("Tag not found on this post");
		}

		// Remove tag from post
		await prisma.postTag.delete({
			where: {
				postId_tagId: {
					postId,
					tagId,
				},
			},
		});
	} catch (error) {
		console.error("Remove tag from post error:", error);
		throw error;
	}
};

export const getPostsByTag = async (tagId, userId) => {
	try {
		// Check if tag exists
		const tag = await prisma.tag.findUnique({
			where: { id: tagId },
		});

		if (!tag) {
			throw new Error("Tag not found");
		}

		// Get posts with this tag
		const posts = await prisma.post.findMany({
			where: {
				tags: {
					some: {
						tagId,
					},
				},
				published: true, // Only show published posts
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
		});

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
			tags: post.tags.map((pt) => pt.tag),
		}));
	} catch (error) {
		console.error("Get posts by tag error:", error);
		throw error;
	}
};

export const getUserLikedTags = async (userId) => {
	try {
		const likedTags = await prisma.userLikedTag.findMany({
			where: { userId },
			include: {
				tag: {
					include: {
						posts: {
							select: { postId: true },
						},
					},
				},
			},
			orderBy: {
				tag: {
					name: "asc",
				},
			},
		});

		return likedTags.map((likedTag) => ({
			id: likedTag.tag.id,
			name: likedTag.tag.name,
			postsCount: likedTag.tag.posts.length,
		}));
	} catch (error) {
		console.error("Get user liked tags error:", error);
		throw error;
	}
};
