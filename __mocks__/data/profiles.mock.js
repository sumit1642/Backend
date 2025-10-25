export const mockProfiles = {
	userProfile: {
		id: 1,
		userId: 1,
		bio: "I am a software developer passionate about web technologies.",
		avatar: "https://example.com/avatar1.jpg",
		location: "San Francisco, CA",
		website: "https://johndoe.com",
		createdAt: new Date("2024-01-25"),
		updatedAt: new Date("2024-01-25"),
	},
	anotherProfile: {
		id: 2,
		userId: 2,
		bio: "Designer and creative thinker.",
		avatar: "https://example.com/avatar2.jpg",
		location: "New York, NY",
		website: "https://janesmith.com",
		createdAt: new Date("2024-01-26"),
		updatedAt: new Date("2024-01-26"),
	},
};

export const mockProfileInput = {
	validProfile: {
		bio: "Updated bio",
		location: "Los Angeles, CA",
		website: "https://newwebsite.com",
	},
	minimalProfile: {
		bio: "Simple bio",
	},
};
