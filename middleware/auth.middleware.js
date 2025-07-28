import { loginValidation, registerValidation } from "./auth/ValidateUser.js";

export const loginMiddlewares = [loginValidation];
export const registerMiddlewares = [registerValidation];
