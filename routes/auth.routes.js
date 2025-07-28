// routes/auth.routes.js
import express from "express";
import { login, refresh, register, logout } from "../controllers/auth.controller.js";
import { loginMiddlewares, registerMiddlewares } from "../middleware/auth.middleware.js";

export const authRoute = express.Router();

authRoute.post("/register", registerMiddlewares, register);
authRoute.post("/login", loginMiddlewares, login);
authRoute.get("/refresh", refresh);
authRoute.post("/logout", logout);
