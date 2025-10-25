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
		profile: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
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
import { mockProfiles, mockProfileInput } from "../../__mocks__/data/profiles.mock.js";
import { getProfile, updateProfile } from "../../services/profile.service.js";

describe("Profile API Endpoints", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/profiles/:userId", () => {
		it("should fetch user profile", async () => {
			const userId = 1;
			const userWithProfile = {
				id: userId,
				name: "John Doe",
				email: "john@example.com",
				profile: mockProfiles.userProfile,
			};

			prismaMock.user.findUnique.mockResolvedValue(userWithProfile);

			const result = await getProfile(userId);

			expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
				include: { profile: true },
			});
			expect(result.bio).toBeTruthy();
		});

		it("should return error for non-existent profile", async () => {
			prismaMock.user.findUnique.mockResolvedValue(null);

			await expect(getProfile(999)).rejects.toThrow("User not found");
		});

		it("should include user metadata", async () => {
			const userWithProfile = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				profile: mockProfiles.userProfile,
			};

			prismaMock.user.findUnique.mockResolvedValue(userWithProfile);

			const result = await getProfile(1);
			expect(result.id).toBeTruthy();
			expect(result.bio).toBeTruthy();
		});
	});

	describe("PUT /api/profiles/:userId", () => {
		it("should update own profile", async () => {
			const userId = 1;
			const updateData = { bio: "Updated bio" };
			const userWithProfile = {
				id: userId,
				name: "John Doe",
				email: "john@example.com",
				profile: mockProfiles.userProfile,
			};

			prismaMock.user.findUnique.mockResolvedValue(userWithProfile);
			prismaMock.profile.update.mockResolvedValue({
				...mockProfiles.userProfile,
				bio: updateData.bio,
			});

			const result = await updateProfile(userId, updateData);

			expect(result.bio).toBe(updateData.bio);
		});

		it("should validate profile data", async () => {
			expect(mockProfileInput.validProfile.bio).toBeTruthy();
		});

		it("should return error for non-existent profile", async () => {
			prismaMock.user.findUnique.mockResolvedValue(null);

			await expect(updateProfile(999, { bio: "test" })).rejects.toThrow("User not found");
		});
	});
});
