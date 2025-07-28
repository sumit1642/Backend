// index.js
import express from "express";
import cookieParser from "cookie-parser";
import { authRoute } from "./routes/auth.routes.js";
import { postRoute } from "./routes/post.routes.js";
import { interactionRoute } from "./routes/interaction.routes.js";
import { getAllPostsController } from "./controllers/post.controller.js";
import { optionalAuth } from "./middleware/posts.middleware.js";

const app = express();

// Middleware
app.use(express.json({ limit: "1mb" })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET || "yourSecretHere"));

// CORS middleware for development
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

// Health check route
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Server is running",
		timestamp: new Date().toISOString(),
	});
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/interactions", interactionRoute);

// Home route should list all published posts
app.get("/", optionalAuth, getAllPostsController);

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({
		status: "error",
		message: "Route not found",
	});
});

// Global error handler
app.use((err, req, res, next) => {
	console.error("Global error handler:", err);

	// Handle JSON parsing errors
	if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
		return res.status(400).json({
			status: "error",
			message: "Invalid JSON format",
		});
	}

	// Handle payload too large
	if (err.type === "entity.too.large") {
		return res.status(413).json({
			status: "error",
			message: "Request payload too large",
		});
	}

	res.status(err.status || 500).json({
		status: "error",
		message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
	});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
