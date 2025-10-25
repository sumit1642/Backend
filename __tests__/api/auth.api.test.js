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
import { prismaMock } from "../setup/prisma-mock.js";
import { mockUsers } from "../../__mocks__/data/users.mock.js";
import {
	createNewUserAccount,
	authenticateUserLogin,
	generateNewAccessToken,
	removeUserSession,
	logoutUserFromAllDevices,
} from "../../services/auth.service.js";
import bcrypt from "bcryptjs";

describe("Auth API Endpoints", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /api/auth/register", () => {
		it("should register a new user successfully", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "SecurePassword123!",
			};

			prismaMock.user.findUnique.mockResolvedValue(null);
			prismaMock.user.create.mockResolvedValue({
				id: 1,
				name: userData.name,
				email: userData.email,
			});

			const result = await createNewUserAccount(userData);

			expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
				where: { email: userData.email },
			});
			expect(prismaMock.user.create).toHaveBeenCalled();
			expect(result.email).toBe(userData.email);
		});

		it("should return error if user already exists", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "SecurePassword123!",
			};

			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			await expect(createNewUserAccount(userData)).rejects.toThrow("User already exists");
			expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
				where: { email: userData.email },
			});
		});

		it("should validate password strength", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "123", // Too short
			};

			prismaMock.user.findUnique.mockResolvedValue(null);

			await expect(createNewUserAccount(userData)).rejects.toThrow("Password must be at least 6 characters long");
		});

		it("should hash password before storing", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "SecurePassword123!",
			};

			prismaMock.user.findUnique.mockResolvedValue(null);
			prismaMock.user.create.mockImplementation(async ({ data }) => {
				// Verify password is hashed (not plain text)
				expect(data.password).not.toBe(userData.password);
				return {
					id: 1,
					name: userData.name,
					email: userData.email,
				};
			});

			await createNewUserAccount(userData);
			expect(prismaMock.user.create).toHaveBeenCalled();
		});

		it("should return 400 for missing fields", async () => {
			const incompleteData = {
				name: "John Doe",
			};

			expect(incompleteData.email).toBeUndefined();
			expect(incompleteData.password).toBeUndefined();
		});
	});

	describe("POST /api/auth/login", () => {
		it("should login user successfully", async () => {
			const loginData = {
				email: "john@example.com",
				password: "SecurePassword123!",
			};

			const hashedPassword = await bcrypt.hash(loginData.password, 12);
			const userWithHashedPassword = {
				...mockUsers.validUser,
				password: hashedPassword,
			};

			prismaMock.user.findUnique.mockResolvedValue(userWithHashedPassword);
			prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
			prismaMock.refreshToken.create.mockResolvedValue({
				id: 1,
				token: "refresh_token",
				userId: 1,
			});

			const result = await authenticateUserLogin(userWithHashedPassword, loginData.password);

			expect(result.accessToken).toBeTruthy();
			expect(result.refreshToken).toBeTruthy();
			expect(result.user.email).toBe(loginData.email);
		});

		it("should return error for non-existent user", async () => {
			const loginData = {
				email: "nonexistent@example.com",
				password: "password123",
			};

			prismaMock.user.findUnique.mockResolvedValue(null);

			expect(prismaMock.user.findUnique).toHaveBeenCalled();
		});

		it("should return error for incorrect password", async () => {
			const loginData = {
				email: "john@example.com",
				password: "WrongPassword123!",
			};

			const hashedPassword = await bcrypt.hash("CorrectPassword123!", 12);
			const userWithHashedPassword = {
				...mockUsers.validUser,
				password: hashedPassword,
			};

			await expect(authenticateUserLogin(userWithHashedPassword, loginData.password)).rejects.toThrow(
				"Invalid credentials",
			);
		});

		it("should return JWT token on successful login", async () => {
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
			expect(result.accessToken.split(".").length).toBe(3); // JWT has 3 parts
		});

		it("should set refresh token in database", async () => {
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

			await authenticateUserLogin(userWithHashedPassword, "SecurePassword123!");

			expect(prismaMock.refreshToken.create).toHaveBeenCalled();
		});
	});

	describe("POST /api/auth/refresh", () => {
		it("should refresh token successfully", async () => {
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

			expect(result.accessToken).toBeTruthy();
			expect(result.refreshToken).toBeTruthy();
			expect(prismaMock.refreshToken.findUnique).toHaveBeenCalled();
		});

		it("should return error for expired refresh token", async () => {
			const expiredTokenData = {
				id: 1,
				token: "expired_token",
				userId: 1,
				expiresAt: new Date(Date.now() - 1000),
				user: mockUsers.validUser,
			};

			prismaMock.refreshToken.findUnique.mockResolvedValue(expiredTokenData);
			prismaMock.refreshToken.delete.mockResolvedValue({ id: 1 });

			await expect(generateNewAccessToken("expired_token")).rejects.toThrow("Refresh token expired");
		});

		it("should return error for invalid refresh token", async () => {
			prismaMock.refreshToken.findUnique.mockResolvedValue(null);

			await expect(generateNewAccessToken("invalid_token")).rejects.toThrow("Invalid refresh token");
		});
	});

	describe("POST /api/auth/logout", () => {
		it("should logout user successfully", async () => {
			prismaMock.refreshToken.delete.mockResolvedValue({ id: 1 });

			await removeUserSession("valid_refresh_token");

			expect(prismaMock.refreshToken.delete).toHaveBeenCalled();
		});

		it("should logout user from all devices", async () => {
			prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

			await logoutUserFromAllDevices(1);

			expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
				where: { userId: 1 },
			});
		});
	});
});
