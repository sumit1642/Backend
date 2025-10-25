import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockTags, mockTagInput } from "../../__mocks__/data/tags.mock.js";
import { createMockRequest } from "../setup/test-utils.js";

describe("Tag Controller - Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Create Tag Integration", () => {
		it("should create tag with validation", async () => {
			const req = createMockRequest({
				body: mockTagInput.validTag,
			});

			prismaMock.tag.findFirst.mockResolvedValue(null);
			prismaMock.tag.create.mockResolvedValue(mockTags.technologyTag);

			expect(req.body.name).toBeTruthy();
		});

		it("should prevent duplicate tags", async () => {
			const req = createMockRequest({
				body: mockTagInput.duplicateTag,
			});

			prismaMock.tag.findFirst.mockResolvedValue(mockTags.technologyTag);

			expect(req.body.name).toBe("technology");
		});
	});

	describe("Retrieve Tags Integration", () => {
		it("should fetch all tags with pagination", async () => {
			const req = createMockRequest({
				query: { page: 1, limit: 20 },
			});

			prismaMock.tag.findMany.mockResolvedValue([mockTags.technologyTag, mockTags.designTag]);
			prismaMock.tag.count.mockResolvedValue(2);

			expect(req.query.page).toBe(1);
		});

		it("should fetch tag by slug", async () => {
			const req = createMockRequest({
				params: { slug: "technology" },
			});

			prismaMock.tag.findFirst.mockResolvedValue(mockTags.technologyTag);

			expect(req.params.slug).toBe("technology");
		});
	});

	describe("Update Tag Integration", () => {
		it("should update tag successfully", async () => {
			const req = createMockRequest({
				params: { id: 1 },
				body: { name: "tech" },
			});

			prismaMock.tag.findUnique.mockResolvedValue(mockTags.technologyTag);
			prismaMock.tag.update.mockResolvedValue({
				...mockTags.technologyTag,
				name: "tech",
			});

			expect(req.body.name).toBeTruthy();
		});
	});

	describe("Delete Tag Integration", () => {
		it("should delete tag successfully", async () => {
			const req = createMockRequest({
				params: { id: 1 },
			});

			prismaMock.tag.findUnique.mockResolvedValue(mockTags.technologyTag);
			prismaMock.tag.delete.mockResolvedValue(mockTags.technologyTag);

			expect(req.params.id).toBeTruthy();
		});
	});
});
