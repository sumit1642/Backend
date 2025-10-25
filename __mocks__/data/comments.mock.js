export const mockComments = {
	validComment: {
		id: 1,
		content: "Great post! Very informative.",
		authorId: 2,
		postId: 1,
		createdAt: new Date("2024-01-10"),
		updatedAt: new Date("2024-01-10"),
	},
	anotherComment: {
		id: 2,
		content: "Thanks for sharing this!",
		authorId: 1,
		postId: 1,
		createdAt: new Date("2024-01-11"),
		updatedAt: new Date("2024-01-11"),
	},
	longComment: {
		id: 3,
		content:
			"This is a very long comment with multiple sentences. It contains detailed feedback about the post. The author has put a lot of thought into this response.",
		authorId: 3,
		postId: 2,
		createdAt: new Date("2024-01-12"),
		updatedAt: new Date("2024-01-12"),
	},
};

export const mockCommentInput = {
	validComment: {
		content: "This is a great post!",
	},
	emptyComment: {
		content: "",
	},
	longComment: {
		content: "A".repeat(500),
	},
};
