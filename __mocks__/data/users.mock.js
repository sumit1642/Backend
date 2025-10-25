export const mockUsers = {
	validUser: {
		id: 1,
		email: "john@example.com",
		name: "John Doe",
		password: "$2a$10$hashedPasswordExample123456789",
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	anotherUser: {
		id: 2,
		email: "jane@example.com",
		name: "Jane Smith",
		password: "$2a$10$anotherHashedPassword123456789",
		createdAt: new Date("2024-01-02"),
		updatedAt: new Date("2024-01-02"),
	},
	adminUser: {
		id: 3,
		email: "admin@example.com",
		name: "Admin User",
		password: "$2a$10$adminHashedPassword123456789",
		createdAt: new Date("2024-01-03"),
		updatedAt: new Date("2024-01-03"),
	},
	invalidUser: {
		email: "invalid@example.com",
		password: "short",
	},
	duplicateEmail: {
		email: "john@example.com",
		name: "Duplicate User",
		password: "ValidPassword123!",
	},
};

export const mockUserCredentials = {
	validCredentials: {
		email: "john@example.com",
		password: "ValidPassword123!",
	},
	invalidPassword: {
		email: "john@example.com",
		password: "WrongPassword123!",
	},
	nonExistentUser: {
		email: "nonexistent@example.com",
		password: "ValidPassword123!",
	},
};
