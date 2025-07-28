import { prisma } from "../../utils/prisma.js";

// LOGIN: Validate email & password presence + if user exists
export const loginValidation = async (req, res, next) => {
	const { email, password } = req.body;

	if (!email) return res.status(400).json({ msg: "Email is required" });
	if (!password) return res.status(400).json({ msg: "Password is required" });

	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) return res.status(401).json({ msg: "Invalid email or password" });

	req.foundUser = user;
	next();
};

// REGISTER: Validate name, email, password presence + check if user already exists
export const registerValidation = async (req, res, next) => {
	const { name, email, password } = req.body;

	if (!name) return res.status(400).json({ msg: "Name is required" });
	if (!email) return res.status(400).json({ msg: "Email is required" });
	if (!password) return res.status(400).json({ msg: "Password is required" });

	const user = await prisma.user.findUnique({ where: { email } });
	if (user) return res.status(409).json({ msg: "User already exists" });

	next();
};
