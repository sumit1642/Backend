// index.js
import express from "express";
import cookieParser from "cookie-parser";
import { authRoute } from "./routes/auth.routes.js";
import { postRoute } from "./routes/post.routes.js";
import { interactionRoute } from "./routes/interaction.routes.js";
import { profileRoute } from "./routes/profile.routes.js";
import { getAllPostsController } from "./controllers/post.controller.js";
import { optionalAuth } from "./middleware/posts.middleware.js";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic CORS for development
if (process.env.NODE_ENV !== "production") {
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", "http://localhost:3000");
		res.header("Access-Control-Allow-Credentials", "true");
		res.header(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept, Authorization",
		);
		res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

		if (req.method === "OPTIONS") {
			return res.sendStatus(200);
		}
		next();
	});
}

// Health check
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Server is running",
	});
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/interactions", interactionRoute);
app.use("/api/profile", profileRoute);

// Home route - show all published posts
app.get("/", optionalAuth, getAllPostsController);

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({
		status: "error",
		message: "Route not found",
	});
});

// Basic error handler
app.use((err, req, res, next) => {
	console.error("Error:", err);
	res.status(err.status || 500).json({
		status: "error",
		message: "Internal server error",
	});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
