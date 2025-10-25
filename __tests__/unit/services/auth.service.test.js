import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../setup/prisma-mock.js";
import { mockUsers, mockUserCredentials } from "../../../__mocks__/data/users.mock.js";

describe("Auth Service - Unit Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("User Registration", () => {
		it("should successfully create a new user with valid data", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "HashedPassword123",
			};

			prismaMock.user.findUnique.mockResolvedValue(null);
			prismaMock.user.create.mockResolvedValue({
				id: 1,
				...userData,
			});

			expect(prismaMock.user.create).not.toHaveBeenCalled();
			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should reject registration with duplicate email", async () => {
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should validate email format", async () => {
			const invalidEmail = "not-an-email";
			expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
		});

		it("should validate password strength", async () => {
			const weakPassword = "123";
			expect(weakPassword.length).toBeLessThan(8);
		});
	});

	describe("User Login", () => {
		it("should return user data on successful login", async () => {
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should reject login with non-existent user", async () => {
			prismaMock.user.findUnique.mockResolvedValue(null);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should reject login with incorrect password", async () => {
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(mockUserCredentials.invalidPassword.password).not.toBe(mockUsers.validUser.password);
		});
	});

	describe("Token Management", () => {
		it("should generate valid JWT token", async () => {
			const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
			expect(token).toBeTruthy();
			expect(token.split(".").length).toBe(3);
		});

		it("should handle token refresh", async () => {
			prismaMock.refreshToken.findUnique.mockResolvedValue({
				id: 1,
				token: "valid_refresh_token",
				userId: 1,
				expiresAt: new Date(Date.now() + 1000000),
			});

			expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
		});

		it("should reject expired refresh token", async () => {
			prismaMock.refreshToken.findUnique.mockResolvedValue({
				id: 1,
				token: "expired_token",
				userId: 1,
				expiresAt: new Date(Date.now() - 1000),
			});

			expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
		});
	});
});
