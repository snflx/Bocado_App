import { z } from "zod";

const email = z.string().trim().email("Correo invalido").max(120);
const password = z.string().min(8, "La contrasena debe tener al menos 8 caracteres").max(100);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "El nombre es requerido").max(80),
    email,
    password
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, "La contrasena es requerida")
  }),
  params: z.object({}),
  query: z.object({})
});
