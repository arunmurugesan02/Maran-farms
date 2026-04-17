import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Maran Farms backend is running" });
});

app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

export default app;
