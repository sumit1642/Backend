// In-memory rate limit store (for single server)
// For distributed systems, use Redis
const rateLimitStore = new Map();

const RATE_LIMITS = {
	USER_LIKES_PER_HOUR: 100,
	POST_LIKES_PER_HOUR: 1000,
};

const HOUR_IN_MS = 60 * 60 * 1000;

export const checkRateLimit = async (userId, postId) => {
	const now = Date.now();
	const userKey = `user:${userId}`;
	const postKey = `post:${postId}`;

	// Initialize or get user rate limit data
	if (!rateLimitStore.has(userKey)) {
		rateLimitStore.set(userKey, { count: 0, resetTime: now + HOUR_IN_MS });
	}

	// Initialize or get post rate limit data
	if (!rateLimitStore.has(postKey)) {
		rateLimitStore.set(postKey, { count: 0, resetTime: now + HOUR_IN_MS });
	}

	const userData = rateLimitStore.get(userKey);
	const postData = rateLimitStore.get(postKey);

	// Reset if hour has passed
	if (userData.resetTime < now) {
		userData.count = 0;
		userData.resetTime = now + HOUR_IN_MS;
	}

	if (postData.resetTime < now) {
		postData.count = 0;
		postData.resetTime = now + HOUR_IN_MS;
	}

	// Check limits
	if (userData.count >= RATE_LIMITS.USER_LIKES_PER_HOUR) {
		return {
			allowed: false,
			reason: "User like limit exceeded",
			retryAfter: Math.ceil((userData.resetTime - now) / 1000),
		};
	}

	if (postData.count >= RATE_LIMITS.POST_LIKES_PER_HOUR) {
		return {
			allowed: false,
			reason: "Post like limit exceeded",
			retryAfter: Math.ceil((postData.resetTime - now) / 1000),
		};
	}

	// Increment counters
	userData.count++;
	postData.count++;

	return { allowed: true };
};

export const resetRateLimits = () => {
	rateLimitStore.clear();
};
