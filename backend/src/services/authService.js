import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || "user"
  };
}

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email });

  if (existing) {
    throw new HttpError(409, "El correo ya esta registrado");
  }

  const userCount = await User.countDocuments();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role: userCount === 0 ? "admin" : "user" });
  const token = signToken(user);

  return { token, user: publicUser(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });

  if (!user) {
    throw new HttpError(401, "Credenciales invalidas");
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    throw new HttpError(401, "Credenciales invalidas");
  }

  return { token: signToken(user), user: publicUser(user) };
}

export function getPublicUser(user) {
  return { user: publicUser(user) };
}
