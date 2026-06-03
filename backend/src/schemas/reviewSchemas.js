import { z } from "zod";

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Identificador invalido");

export const listReviewsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    search: z.string().trim().max(80).optional(),
    sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    mine: z.enum(["true", "false"]).optional()
  })
});

export const reviewIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: mongoId
  }),
  query: z.object({})
});

export const createReviewSchema = z.object({
  body: z.object({
    restaurantName: z.string().trim().min(2, "El restaurante es requerido").max(120),
    city: z.string().trim().min(2, "La ciudad es requerida").max(80),
    rating: z.coerce.number().int().min(1, "La calificacion minima es 1").max(5, "La calificacion maxima es 5"),
    visitDate: z.string().trim().min(1, "La fecha de visita es requerida"),
    comment: z.string().trim().min(10, "El comentario debe tener al menos 10 caracteres").max(1000)
  }),
  params: z.object({}),
  query: z.object({})
});

export const updateReviewSchema = z.object({
  body: createReviewSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: "Debe enviar al menos un campo para actualizar"
  }),
  params: z.object({
    id: mongoId
  }),
  query: z.object({})
});
