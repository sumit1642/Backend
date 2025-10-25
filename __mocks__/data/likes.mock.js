export const mockLikes = {
	postLike: {
		id: 1,
		userId: 1,
		postId: 1,
		createdAt: new Date("2024-01-15"),
	},
	anotherPostLike: {
		id: 2,
		userId: 2,
		postId: 1,
		createdAt: new Date("2024-01-16"),
	},
	commentLike: {
		id: 3,
		userId: 1,
		commentId: 1,
		createdAt: new Date("2024-01-17"),
	},
};

export const mockLikeInput = {
	validPostLike: {
		postId: 1,
	},
	validCommentLike: {
		commentId: 1,
	},
};
