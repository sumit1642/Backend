// Utility functions for pagination validation and handling

export const validatePaginationParams = (limit, offset) => {
	const parsedLimit = Number.parseInt(limit);
	const parsedOffset = Number.parseInt(offset);

	// Validate limit (1-50, default 5)
	if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
		return {
			isValid: false,
			error: "Limit must be between 1 and 50",
		};
	}

	// Validate offset (non-negative, default 0)
	if (isNaN(parsedOffset) || parsedOffset < 0) {
		return {
			isValid: false,
			error: "Offset must be a non-negative number",
		};
	}

	return {
		isValid: true,
		limit: parsedLimit,
		offset: parsedOffset,
	};
};

export const calculateHasMore = (total, limit, offset) => {
	return offset + limit < total;
};

export const calculateNextOffset = (limit, offset) => {
	return offset + limit;
};
