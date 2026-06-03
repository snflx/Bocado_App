import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

export const app = express();

const REQUEST_TIMEOUT = 30_000;

if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

app.use(compression());
app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "100kb" }));
app.use(mongoSanitize());
app.use(hpp());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use((_req, res, next) => {
  res.setTimeout(REQUEST_TIMEOUT, () => {
    const error = new Error("Timeout");
    error.name = "TimeoutError";
    res.status(503).json({ message: "El servidor tardo demasiado en responder", status: 503 });
  });
  next();
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes, intente de nuevo mas tarde", status: 429 }
});
app.use("/api", generalLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);
