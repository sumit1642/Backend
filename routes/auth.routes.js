// routes/auth.routes.js
import express from "express";
import { login, refresh, register, logout } from "../controllers/auth.controller.js";
import { loginValidation, registerValidation } from "../middleware/auth.middleware.js";

export const authRoute = express.Router();

// Public routes
authRoute.post("/register", registerValidation, register);
authRoute.post("/login", loginValidation, login);
authRoute.post("/refresh", refresh);
authRoute.post("/logout", logout);
