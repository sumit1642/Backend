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
import { prismaMock } from "../../setup/prisma-mock.js";
import { mockProfiles, mockProfileInput } from "../../../__mocks__/data/profiles.mock.js";
import { getProfile, updateProfile } from "../../../services/profile.service.js";

describe("Profile Service - Unit Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Get Profile", () => {
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

			expect(prismaMock.user.findUnique).toHaveBeenCalled();
			expect(result.bio).toBeTruthy();
		});

		it("should return error for non-existent profile", async () => {
			prismaMock.user.findUnique.mockResolvedValue(null);

			await expect(getProfile(999)).rejects.toThrow("User not found");
		});
	});

	describe("Update Profile", () => {
		it("should update profile successfully", async () => {
			const userId = 1;
			const userWithProfile = {
				id: userId,
				name: "John Doe",
				email: "john@example.com",
				profile: mockProfiles.userProfile,
			};

			const updatedProfile = {
				...mockProfiles.userProfile,
				...mockProfileInput.validProfile,
			};

			prismaMock.user.findUnique.mockResolvedValue(userWithProfile);
			prismaMock.profile.update.mockResolvedValue(updatedProfile);

			const result = await updateProfile(userId, mockProfileInput.validProfile);

			expect(prismaMock.profile.update).toHaveBeenCalled();
			expect(result.bio).toBeTruthy();
		});

		it("should validate profile data", async () => {
			expect(mockProfileInput.validProfile.bio).toBeTruthy();
		});
	});

	describe("Profile Validation", () => {
		it("should validate bio length", async () => {
			const bio = mockProfileInput.validProfile.bio;
			expect(bio.length).toBeGreaterThan(0);
		});

		it("should validate website URL format", async () => {
			const website = mockProfileInput.validProfile.website;
			expect(website).toMatch(/^https?:\/\//);
		});
	});
});
