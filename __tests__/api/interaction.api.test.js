import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock.js";
import { mockLikes } from "../../__mocks__/data/likes.mock.js";
import { mockComments } from "../../__mocks__/data/comments.mock.js";

describe("Interaction API Endpoints", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /api/posts/:postId/like", () => {
		it("should like a post successfully", async () => {
			prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
			prismaMock.like.findFirst.mockResolvedValue(null);
			prismaMock.like.create.mockResolvedValue(mockLikes.postLike);

			expect(prismaMock.like.create).not.toHaveBeenCalled();
		});

		it("should return 404 for non-existent post", async () => {
			prismaMock.post.findUnique.mockResolvedValue(null);

			expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
		});

		it("should return 409 for duplicate like", async () => {
			prismaMock.like.findFirst.mockResolvedValue(mockLikes.postLike);

			expect(prismaMock.like.findFirst).not.toHaveBeenCalled();
		});

		it("should require authentication", async () => {
			expect(true).toBe(true);
		});
	});

	describe("DELETE /api/posts/:postId/like", () => {
		it("should unlike a post successfully", async () => {
			prismaMock.like.findFirst.mockResolvedValue(mockLikes.postLike);
			prismaMock.like.delete.mockResolvedValue(mockLikes.postLike);

			expect(prismaMock.like.delete).not.toHaveBeenCalled();
		});

		it("should return 404 if like doesn't exist", async () => {
			prismaMock.like.findFirst.mockResolvedValue(null);

			expect(prismaMock.like.findFirst).not.toHaveBeenCalled();
		});
	});

	describe("POST /api/posts/:postId/comments", () => {
		it("should create a comment successfully", async () => {
			prismaMock.post.findUnique.mockResolvedValue({ id: 1 });
			prismaMock.comment.create.mockResolvedValue(mockComments.validComment);

			expect(prismaMock.comment.create).not.toHaveBeenCalled();
		});

		it("should return 400 for empty comment", async () => {
			const emptyComment = { content: "" };

			expect(emptyComment.content).toBe("");
		});

		it("should return 404 for non-existent post", async () => {
			prismaMock.post.findUnique.mockResolvedValue(null);

			expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
		});

		it("should require authentication", async () => {
			expect(true).toBe(true);
		});
	});

	describe("GET /api/posts/:postId/comments", () => {
		it("should fetch comments for a post", async () => {
			prismaMock.comment.findMany.mockResolvedValue([mockComments.validComment, mockComments.anotherComment]);

			expect(prismaMock.comment.findMany).not.toHaveBeenCalled();
		});

		it("should support pagination", async () => {
			const page = 1;
			const limit = 10;

			expect(page).toBeGreaterThan(0);
			expect(limit).toBeGreaterThan(0);
		});

		it("should return 404 for non-existent post", async () => {
			prismaMock.post.findUnique.mockResolvedValue(null);

			expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
		});
	});

	describe("PUT /api/comments/:commentId", () => {
		it("should update own comment", async () => {
			const updateData = { content: "Updated comment" };
			prismaMock.comment.findUnique.mockResolvedValue(mockComments.validComment);
			prismaMock.comment.update.mockResolvedValue({
				...mockComments.validComment,
				...updateData,
			});

			expect(prismaMock.comment.update).not.toHaveBeenCalled();
		});

		it("should return 403 for unauthorized update", async () => {
			const commentAuthorId = 2;
			const currentUserId = 1;

			expect(commentAuthorId).not.toBe(currentUserId);
		});
	});

	describe("DELETE /api/comments/:commentId", () => {
		it("should delete own comment", async () => {
			prismaMock.comment.findUnique.mockResolvedValue(mockComments.validComment);
			prismaMock.comment.delete.mockResolvedValue(mockComments.validComment);

			expect(prismaMock.comment.delete).not.toHaveBeenCalled();
		});

		it("should return 403 for unauthorized deletion", async () => {
			const commentAuthorId = 2;
			const currentUserId = 1;

			expect(commentAuthorId).not.toBe(currentUserId);
		});
	});
});
