export const mockRefreshTokens = {
	validToken: {
		id: 1,
		token: "refresh_token_example_123456789",
		userId: 1,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
	},
	expiredToken: {
		id: 2,
		token: "expired_refresh_token_123456789",
		userId: 1,
		expiresAt: new Date(Date.now() - 1000),
		createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
	},
	anotherUserToken: {
		id: 3,
		token: "another_user_token_123456789",
		userId: 2,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
	},
};
