// services/post.service.js
import { prisma } from "../utils/prisma.js";

export const createPostService = async (req, res) => {
	try {
		const { title, content, tags } = req.body;

		if (!title || !content || !Array.isArray(tags) || tags.length === 0) {
			return res.status(400).json({ msg: "Title, content, and tags are required" });
		}
		if (title.trim().length > 50) {
			return res.status(400).json({ msg: "Title length should be under 50 characters" });
		}

		const existingPost = await prisma.post.findFirst({
			where: {
				title,
				authorId: req.user.userId,
			},
		});

		if (existingPost) {
			return res.status(409).json({ msg: "You already have a post with this title" });
		}

		const newPost = await prisma.post.create({
			data: {
				title,
				content,
				author: {
					connect: {
						id: req.user.userId,
					},
				},
			},
		});

		const tagRecords = await Promise.all(
			tags.map((tagName) =>
				prisma.tag.upsert({
					where: { name: tagName },
					update: {},
					create: { name: tagName },
				}),
			),
		);

		await Promise.all(
			tagRecords.map((tag) =>
				prisma.postTag.create({
					data: {
						postId: newPost.id,
						tagId: tag.id,
					},
				}),
			),
		);

		const postWithTags = await prisma.post.findUnique({
			where: { id: newPost.id },
			include: {
				tags: {
					select: {
						tag: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		const tagList = postWithTags.tags.map((pt) => pt.tag);

		return res.status(201).json({
			msg: "Post created successfully",
			post: {
				...postWithTags,
				tags: tagList,
			},
		});
	} catch (err) {
		console.error("Error creating post:", err);
		return res.status(500).json({ msg: "Internal server error" });
	}
};

export const getAllPostsService = async (req, res) => {
	try {
		const posts = await prisma.post.findMany({
			where: { published: true },
			orderBy: { createdAt: "desc" },
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
		});

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

		return res.status(200).json({
			msg: "Fetched all posts",
			count: formattedPosts.length,
			posts: formattedPosts,
		});
	} catch (err) {
		console.error("Error fetching posts:", err);
		return res.status(500).json({ msg: "Internal server error" });
	}
};

export const deletePostService = async (req, res) => {
	try {
		const postId = parseInt(req.params.postId);
		const userId = req.user?.userId;

		if (isNaN(postId)) {
			return res.status(400).json({ msg: "Invalid post ID" });
		}

		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { authorId: true },
		});

		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}

		if (post.authorId !== userId) {
			return res.status(403).json({ msg: "You are not authorized to delete this post" });
		}

		await prisma.post.delete({ where: { id: postId } });

		return res.status(200).json({ msg: "Post deleted successfully" });
	} catch (err) {
		console.error("Error deleting post:", err);
		return res.status(500).json({ msg: "Internal server error" });
	}
};
