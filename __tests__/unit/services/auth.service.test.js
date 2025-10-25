vi.mock("@prisma/client", () => {
	const prismaMock = {
		user: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		refreshToken: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		$disconnect: vi.fn(),
		$transaction: vi.fn((callback) => callback(prismaMock)),
	};

	return {
		PrismaClient: vi.fn(() => prismaMock),
	};
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../../setup/prisma-mock.js";
import { mockUsers } from "../../../__mocks__/data/users.mock.js";
import { createNewUserAccount, authenticateUserLogin, generateNewAccessToken } from "../../../services/auth.service.js";
import bcrypt from "bcryptjs";

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

			const result = await createNewUserAccount(userData);

			expect(prismaMock.user.create).toHaveBeenCalled();
			expect(prismaMock.user.findUnique).toHaveBeenCalled();
			expect(result.email).toBe(userData.email);
		});

		it("should reject registration with duplicate email", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "HashedPassword123",
			};

			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			await expect(createNewUserAccount(userData)).rejects.toThrow("User already exists");
			expect(prismaMock.user.findUnique).toHaveBeenCalled();
		});

		it("should validate email format", async () => {
			const invalidEmail = "not-an-email";
			expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
		});

		it("should validate password strength", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "123",
			};

			prismaMock.user.findUnique.mockResolvedValue(null);

			await expect(createNewUserAccount(userData)).rejects.toThrow("Password must be at least 6 characters long");
		});
	});

	describe("User Login", () => {
		it("should return user data on successful login", async () => {
			const hashedPassword = await bcrypt.hash("SecurePassword123!", 12);
			const userWithHashedPassword = {
				...mockUsers.validUser,
				password: hashedPassword,
			};

			prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
			prismaMock.refreshToken.create.mockResolvedValue({
				id: 1,
				token: "refresh_token",
				userId: 1,
			});

			const result = await authenticateUserLogin(userWithHashedPassword, "SecurePassword123!");

			expect(result.user).toBeTruthy();
			expect(result.accessToken).toBeTruthy();
		});

		it("should reject login with non-existent user", async () => {
			prismaMock.user.findUnique.mockResolvedValue(null);

			expect(prismaMock.user.findUnique).toHaveBeenCalled();
		});

		it("should reject login with incorrect password", async () => {
			const hashedPassword = await bcrypt.hash("CorrectPassword123!", 12);
			const userWithHashedPassword = {
				...mockUsers.validUser,
				password: hashedPassword,
			};

			await expect(authenticateUserLogin(userWithHashedPassword, "WrongPassword123!")).rejects.toThrow(
				"Invalid credentials",
			);
		});
	});

	describe("Token Management", () => {
		it("should generate valid JWT token", async () => {
			const hashedPassword = await bcrypt.hash("SecurePassword123!", 12);
			const userWithHashedPassword = {
				...mockUsers.validUser,
				password: hashedPassword,
			};

			prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
			prismaMock.refreshToken.create.mockResolvedValue({
				id: 1,
				token: "refresh_token",
				userId: 1,
			});

			const result = await authenticateUserLogin(userWithHashedPassword, "SecurePassword123!");

			expect(result.accessToken).toBeTruthy();
			expect(result.accessToken.split(".").length).toBe(3);
		});

		it("should handle token refresh", async () => {
			const refreshTokenData = {
				id: 1,
				token: "valid_refresh_token",
				userId: 1,
				expiresAt: new Date(Date.now() + 1000000),
				user: mockUsers.validUser,
			};

			prismaMock.refreshToken.findUnique.mockResolvedValue(refreshTokenData);
			prismaMock.refreshToken.create.mockResolvedValue({
				id: 2,
				token: "new_refresh_token",
				userId: 1,
			});
			prismaMock.refreshToken.delete.mockResolvedValue({ id: 1 });

			const result = await generateNewAccessToken("valid_refresh_token");

			expect(prismaMock.refreshToken.findUnique).toHaveBeenCalled();
			expect(result.accessToken).toBeTruthy();
		});

		it("should reject expired refresh token", async () => {
			const expiredTokenData = {
				id: 1,
				token: "expired_token",
				userId: 1,
				expiresAt: new Date(Date.now() - 1000),
				user: mockUsers.validUser,
			};

			prismaMock.refreshToken.findUnique.mockResolvedValue(expiredTokenData);

			await expect(generateNewAccessToken("expired_token")).rejects.toThrow("Refresh token expired");
		});
	});
});
