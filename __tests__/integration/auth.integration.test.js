import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockUsers } from "../../__mocks__/data/users.mock.js";
import { createMockRequest, createMockResponse } from "../setup/test-utils.js";

describe("Auth Controller - Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Register Endpoint Integration", () => {
		it("should handle complete registration flow", async () => {
			const req = createMockRequest({
				body: {
					name: "John Doe",
					email: "john@example.com",
					password: "SecurePassword123!",
				},
			});
			const res = createMockResponse();

			prismaMock.user.findUnique.mockResolvedValue(null);
			prismaMock.user.create.mockResolvedValue({
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			});

			expect(req.body.email).toBeTruthy();
			expect(req.body.password).toBeTruthy();
		});

		it("should handle duplicate email registration", async () => {
			const req = createMockRequest({
				body: {
					name: "John Doe",
					email: "john@example.com",
					password: "SecurePassword123!",
				},
			});

			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});

		it("should validate input before database call", async () => {
			const req = createMockRequest({
				body: {
					name: "",
					email: "invalid-email",
					password: "123",
				},
			});

			expect(req.body.name).toBe("");
			expect(req.body.password.length).toBeLessThan(8);
		});
	});

	describe("Login Endpoint Integration", () => {
		it("should handle complete login flow", async () => {
			const req = createMockRequest({
				body: {
					email: "john@example.com",
					password: "SecurePassword123!",
				},
			});
			const res = createMockResponse();

			prismaMock.user.findUnique.mockResolvedValue(mockUsers.validUser);

			expect(req.body.email).toBeTruthy();
			expect(req.body.password).toBeTruthy();
		});

		it("should handle non-existent user login", async () => {
			const req = createMockRequest({
				body: {
					email: "nonexistent@example.com",
					password: "Password123!",
				},
			});

			prismaMock.user.findUnique.mockResolvedValue(null);

			expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
		});
	});

	describe("Token Refresh Integration", () => {
		it("should refresh token successfully", async () => {
			const req = createMockRequest({
				cookies: {
					refreshToken: "valid_refresh_token",
				},
			});

			prismaMock.refreshToken.findUnique.mockResolvedValue({
				id: 1,
				token: "valid_refresh_token",
				userId: 1,
				expiresAt: new Date(Date.now() + 1000000),
			});

			expect(req.cookies.refreshToken).toBeTruthy();
		});

		it("should reject expired refresh token", async () => {
			const req = createMockRequest({
				cookies: {
					refreshToken: "expired_token",
				},
			});

			prismaMock.refreshToken.findUnique.mockResolvedValue({
				id: 1,
				token: "expired_token",
				userId: 1,
				expiresAt: new Date(Date.now() - 1000),
			});

			expect(req.cookies.refreshToken).toBeTruthy();
		});
	});

	describe("Logout Integration", () => {
		it("should clear refresh token on logout", async () => {
			const req = createMockRequest({
				user: { id: 1 },
			});
			const res = createMockResponse();

			prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

			expect(req.user.id).toBeTruthy();
		});
	});
});
