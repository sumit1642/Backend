// Simple in-memory cache for like counts
// For distributed systems, use Redis
const likeCountCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedLikeCount = (postId) => {
	const cached = likeCountCache.get(postId);

	if (!cached) {
		return null;
	}

	// Check if cache has expired
	if (Date.now() > cached.expiresAt) {
		likeCountCache.delete(postId);
		return null;
	}

	return cached.count;
};

export const setCachedLikeCount = (postId, count) => {
	likeCountCache.set(postId, {
		count,
		expiresAt: Date.now() + CACHE_TTL,
	});
};

export const invalidateLikeCache = (postId) => {
	likeCountCache.delete(postId);
};

export const clearAllLikeCache = () => {
	likeCountCache.clear();
};
