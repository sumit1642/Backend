export const mockTags = {
	technologyTag: {
		id: 1,
		name: "technology",
		slug: "technology",
		createdAt: new Date("2024-01-20"),
		updatedAt: new Date("2024-01-20"),
	},
	designTag: {
		id: 2,
		name: "design",
		slug: "design",
		createdAt: new Date("2024-01-21"),
		updatedAt: new Date("2024-01-21"),
	},
	businessTag: {
		id: 3,
		name: "business",
		slug: "business",
		createdAt: new Date("2024-01-22"),
		updatedAt: new Date("2024-01-22"),
	},
};

export const mockTagInput = {
	validTag: {
		name: "javascript",
	},
	invalidTag: {
		name: "",
	},
	duplicateTag: {
		name: "technology",
	},
};
