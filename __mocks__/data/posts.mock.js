export const mockPosts = {
	publishedPost: {
		id: 1,
		title: "My First Blog Post",
		content: "This is the content of my first post with some meaningful text.",
		published: true,
		authorId: 1,
		createdAt: new Date("2024-01-05"),
		updatedAt: new Date("2024-01-05"),
	},
	draftPost: {
		id: 2,
		title: "Draft Post",
		content: "This is a draft post that is not yet published.",
		published: false,
		authorId: 1,
		createdAt: new Date("2024-01-06"),
		updatedAt: new Date("2024-01-06"),
	},
	anotherUserPost: {
		id: 3,
		title: "Another User Post",
		content: "This post belongs to another user.",
		published: true,
		authorId: 2,
		createdAt: new Date("2024-01-07"),
		updatedAt: new Date("2024-01-07"),
	},
	unpublishedPost: {
		id: 4,
		title: "Unpublished Post",
		content: "This post is not published.",
		published: false,
		authorId: 2,
		createdAt: new Date("2024-01-08"),
		updatedAt: new Date("2024-01-08"),
	},
};

export const mockPostInput = {
	validPost: {
		title: "New Blog Post",
		content: "This is a new blog post with valid content.",
		published: true,
	},
	invalidPost: {
		title: "",
		content: "",
	},
	minimalPost: {
		title: "Minimal Post",
		content: "Content",
	},
};
