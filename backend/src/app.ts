import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";

import userRoutes from "./routes/user.routes.js";
import siaRoutes from "./routes/sia.routes.js";
import taskRoutes from "./routes/task.routes.js";

import commentRoutes from "./routes/comment.routes.js";
import documentRoutes from "./routes/document.routes.js";

import transparencyRoutes from "./routes/transparency.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/sia", siaRoutes);

app.use("/api/sia/:id/tasks", taskRoutes);

app.use("/api/sia/:id/comments", commentRoutes);

app.use("/api/sia/:id/documents", documentRoutes);

app.use("/api/transparency", transparencyRoutes);

export default app;
