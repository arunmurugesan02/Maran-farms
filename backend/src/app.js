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
    origin: (origin, callback) => {
      // In development, allow LAN/mobile origins (e.g., http://192.168.x.x:8080).
      if (env.nodeEnv !== "production") {
        callback(null, true);
        return;
      }
      callback(null, origin === env.frontendUrl);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Maran Farms backend is running" });
});

app.use("/api", apiRouter);

app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(err);
  } else {
    console.warn(`${req.method} ${req.originalUrl} ${statusCode} ${err.message}`);
  }
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

export default app;
