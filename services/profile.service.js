// services/profile.service.js
import { prisma } from "../utils/prisma.js";

export const getProfile = async (userId) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			profile: true,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		bio: user.profile?.bio || "",
	};
};

export const updateProfile = async (userId, updateData) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			profile: true,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	// Update user basic info
	const userUpdateData = {};
	if (updateData.name !== undefined) userUpdateData.name = updateData.name.trim();

	let updatedUser = user;
	if (Object.keys(userUpdateData).length > 0) {
		updatedUser = await prisma.user.update({
			where: { id: userId },
			data: userUpdateData,
			include: {
				profile: true,
			},
		});
	}

	// Update profile bio
	if (updateData.bio !== undefined) {
		if (user.profile) {
			await prisma.profile.update({
				where: { userId },
				data: { bio: updateData.bio.trim() },
			});
		} else {
			await prisma.profile.create({
				data: {
					userId,
					bio: updateData.bio.trim(),
				},
			});
		}
	}

	// Get updated data
	const finalUser = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			profile: true,
		},
	});

	return {
		id: finalUser.id,
		name: finalUser.name,
		email: finalUser.email,
		bio: finalUser.profile?.bio || "",
	};
};
