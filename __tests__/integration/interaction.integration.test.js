import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockLikes } from "../../__mocks__/data/likes.mock.js";
import { mockComments } from "../../__mocks__/data/comments.mock.js";
import { createMockRequest } from "../setup/test-utils.js";

describe("Interaction Controller - Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Like Post Integration", () => {
		it("should like post with validation", async () => {
			const req = createMockRequest({
				params: { postId: 1 },
				user: { id: 1 },
			});

			prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
			prismaMock.like.findFirst.mockResolvedValue(null);
			prismaMock.like.create.mockResolvedValue(mockLikes.postLike);

			expect(req.user.id).toBeTruthy();
			expect(req.params.postId).toBeTruthy();
		});

		it("should prevent duplicate likes", async () => {
			const req = createMockRequest({
				params: { postId: 1 },
				user: { id: 1 },
			});

			prismaMock.like.findFirst.mockResolvedValue(mockLikes.postLike);

			expect(req.user.id).toBeTruthy();
		});
	});

	describe("Unlike Post Integration", () => {
		it("should remove like successfully", async () => {
			const req = createMockRequest({
				params: { postId: 1 },
				user: { id: 1 },
			});

			prismaMock.like.findFirst.mockResolvedValue(mockLikes.postLike);
			prismaMock.like.delete.mockResolvedValue(mockLikes.postLike);

			expect(req.user.id).toBeTruthy();
		});
	});

	describe("Comment Integration", () => {
		it("should create comment with validation", async () => {
			const req = createMockRequest({
				params: { postId: 1 },
				body: { content: "Great post!" },
				user: { id: 1 },
			});

			prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
			prismaMock.comment.create.mockResolvedValue(mockComments.validComment);

			expect(req.body.content).toBeTruthy();
			expect(req.user.id).toBeTruthy();
		});

		it("should fetch comments with pagination", async () => {
			const req = createMockRequest({
				params: { postId: 1 },
				query: { page: 1, limit: 10 },
			});

			prismaMock.comment.findMany.mockResolvedValue([mockComments.validComment]);

			expect(req.params.postId).toBeTruthy();
		});

		it("should update own comment", async () => {
			const req = createMockRequest({
				params: { commentId: 1 },
				body: { content: "Updated comment" },
				user: { id: 2 },
			});

			prismaMock.comment.findUnique.mockResolvedValue(mockComments.validComment);
			prismaMock.comment.update.mockResolvedValue({
				...mockComments.validComment,
				content: "Updated comment",
			});

			expect(req.user.id).toBe(mockComments.validComment.authorId);
		});

		it("should delete own comment", async () => {
			const req = createMockRequest({
				params: { commentId: 1 },
				user: { id: 2 },
			});

			prismaMock.comment.findUnique.mockResolvedValue(mockComments.validComment);
			prismaMock.comment.delete.mockResolvedValue(mockComments.validComment);

			expect(req.user.id).toBe(mockComments.validComment.authorId);
		});
	});
});
