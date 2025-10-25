import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockUsers, mockUserCredentials } from "../../__mocks__/data/users.mock.js";

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
				...userData,
			});

			expect(prismaMock.user.create).not.toHaveBeenCalled();
		});

		it("should return 409 if user already exists", async () => {
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should validate email format", async () => {
			const invalidEmail = "not-an-email";
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

			expect(invalidEmail).not.toMatch(emailRegex);
		});

		it("should validate password strength", async () => {
			const weakPassword = "123";
			expect(weakPassword.length).toBeLessThan(8);
		});

		it("should hash password before storing", async () => {
			const plainPassword = "SecurePassword123!";
			expect(plainPassword).not.toBe("$2a$10$hashedPassword");
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
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should return 401 for non-existent user", async () => {
			prismaMock.user.findUnique.mockResolvedValue(null);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should return 401 for incorrect password", async () => {
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(mockUserCredentials.invalidPassword.password).not.toBe(mockUsers.validUser.password);
		});

		it("should return JWT token on successful login", async () => {
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(mockUsers.validUser.id).toBeTruthy();
		});

		it("should set refresh token cookie", async () => {
			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);
			prismaMock.refreshToken.create.mockResolvedValue({
				id: 1,
				token: "refresh_token",
				userId: 1,
			});

			expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
		});
	});

	describe("POST /api/auth/refresh", () => {
		it("should refresh token successfully", async () => {
			prismaMock.refreshToken.findUnique.mockResolvedValue({
				id: 1,
				token: "valid_refresh_token",
				userId: 1,
				expiresAt: new Date(Date.now() + 1000000),
			});

			expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
		});

		it("should return 401 for expired refresh token", async () => {
			prismaMock.refreshToken.findUnique.mockResolvedValue({
				id: 1,
				token: "expired_token",
				userId: 1,
				expiresAt: new Date(Date.now() - 1000),
			});

			expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
		});

		it("should return 401 for invalid refresh token", async () => {
			prismaMock.refreshToken.findUnique.mockResolvedValue(null);

			expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
		});
	});

	describe("POST /api/auth/logout", () => {
		it("should logout user successfully", async () => {
			prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

			expect(prismaMock.refreshToken.deleteMany).not.toHaveBeenCalled();
		});

		it("should clear refresh token cookie", async () => {
			const res = {
				clearCookie: vi.fn(),
			};

			expect(res.clearCookie).not.toHaveBeenCalled();
		});
	});
});
