import { z } from "zod";

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Identificador invalido");

export const listUsersSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    search: z.string().trim().max(80).optional()
  })
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(["user", "admin"], { message: "Rol invalido. Debe ser 'user' o 'admin'" })
  }),
  params: z.object({
    id: mongoId
  }),
  query: z.object({})
});

export const listAllReviewsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    search: z.string().trim().max(80).optional()
  })
});

export const adminDeleteReviewSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: mongoId
  }),
  query: z.object({})
});
