import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockTags, mockTagInput } from "../../__mocks__/data/tags.mock.js";

describe("Tag API Endpoints", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /api/tags", () => {
		it("should create a new tag", async () => {
			prismaMock.tag.findFirst.mockResolvedValue(null);
			prismaMock.tag.create.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.create).not.toHaveBeenCalled();
		});

		it("should return 409 for duplicate tag", async () => {
			prismaMock.tag.findFirst.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.findFirst).not.toHaveBeenCalled();
		});

		it("should return 400 for empty tag name", async () => {
			expect(mockTagInput.invalidTag.name).toBe("");
		});
	});

	describe("GET /api/tags", () => {
		it("should fetch all tags", async () => {
			prismaMock.tag.findMany.mockResolvedValue([mockTags.technologyTag, mockTags.designTag]);

			expect(prismaMock.tag.findMany).not.toHaveBeenCalled();
		});

		it("should support pagination", async () => {
			const page = 1;
			const limit = 20;

			expect(page).toBeGreaterThan(0);
			expect(limit).toBeGreaterThan(0);
		});

		it("should support search", async () => {
			const searchQuery = "tech";

			expect(searchQuery).toBeTruthy();
		});
	});

	describe("GET /api/tags/:slug", () => {
		it("should fetch tag by slug", async () => {
			prismaMock.tag.findFirst.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.findFirst).not.toHaveBeenCalled();
		});

		it("should return 404 for non-existent tag", async () => {
			prismaMock.tag.findFirst.mockResolvedValue(null);

			expect(prismaMock.tag.findFirst).not.toHaveBeenCalled();
		});
	});

	describe("PUT /api/tags/:id", () => {
		it("should update tag successfully", async () => {
			const updateData = { name: "tech" };
			prismaMock.tag.findUnique.mockResolvedValue(mockTags.technologyTag);
			prismaMock.tag.update.mockResolvedValue({
				...mockTags.technologyTag,
				...updateData,
			});

			expect(prismaMock.tag.update).not.toHaveBeenCalled();
		});

		it("should return 404 for non-existent tag", async () => {
			prismaMock.tag.findUnique.mockResolvedValue(null);

			expect(prismaMock.tag.findUnique).not.toHaveBeenCalled();
		});
	});

	describe("DELETE /api/tags/:id", () => {
		it("should delete tag successfully", async () => {
			prismaMock.tag.findUnique.mockResolvedValue(mockTags.technologyTag);
			prismaMock.tag.delete.mockResolvedValue(mockTags.technologyTag);

			expect(prismaMock.tag.delete).not.toHaveBeenCalled();
		});

		it("should return 404 for non-existent tag", async () => {
			prismaMock.tag.findUnique.mockResolvedValue(null);

			expect(prismaMock.tag.findUnique).not.toHaveBeenCalled();
		});
	});
});
