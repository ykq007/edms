import express from "express";
import documentsRouter from "./routes/documents";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/documents", documentsRouter);

app.use(errorHandler);

export default app;
