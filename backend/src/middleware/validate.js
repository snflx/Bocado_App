import { HttpError } from "../utils/httpError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {}
    });

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(". ");
      return next(new HttpError(400, message));
    }

    req.validated = result.data;
    next();
  };
}
