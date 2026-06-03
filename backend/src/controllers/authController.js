import { registerUser, loginUser, getPublicUser } from "../services/authService.js";

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.validated.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.validated.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json(getPublicUser(req.user));
}
