import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import surveysRoutes from "./routes/surveys";
import categoriesRoutes from "./routes/categories";
import subcategoriesRoutes from "./routes/subcategories";
import responsesRoutes from "./routes/responses";
import resultsRoutes from "./routes/results";

dotenv.config();
const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://16.171.30.108:3000",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/surveys", surveysRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/results", resultsRoutes);

app.get("/", (req, res) => res.send("Döveç Keeper Backend is up"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
