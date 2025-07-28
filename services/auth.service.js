// services/auth.service.js
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const registerUser = async ({ name, email, password }) => {
	const hashedPassword = await bcrypt.hash(password, 10);

	return prisma.user.create({
		data: {
			name,
			email,
			password: hashedPassword,
			profile: {
				create: {
					bio: "",
				},
			},
		},
	});
};

export const loginUser = async (user, password) => {
	const validPassword = await bcrypt.compare(password, user.password);
	if (!validPassword) return null;

	const token = jwt.sign(
		{ userId: user.id, email: user.email },
		process.env.JWT_SECRET_KEY || "secretkey",
		{ expiresIn: "7d" },
	);

	const refreshToken = crypto.randomBytes(40).toString("hex");
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

	await prisma.refreshToken.create({
		data: {
			token: refreshToken,
			userId: user.id,
			expiresAt,
		},
	});

	return { token, refreshToken };
};

export const refreshAccessToken = async (refreshToken) => {
	const tokenEntry = await prisma.refreshToken.findUnique({
		where: { token: refreshToken },
		include: { user: true },
	});

	if (!tokenEntry || !tokenEntry.user || tokenEntry.expiresAt < new Date()) {
		return null;
	}

	await prisma.refreshToken.delete({ where: { token: refreshToken } });

	return jwt.sign(
		{ userId: tokenEntry.user.id, email: tokenEntry.user.email },
		process.env.JWT_SECRET_KEY || "secretkey",
		{ expiresIn: "20d" },
	);
};
