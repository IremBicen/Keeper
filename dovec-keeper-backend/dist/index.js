"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const surveys_1 = __importDefault(require("./routes/surveys"));
const categories_1 = __importDefault(require("./routes/categories"));
const subcategories_1 = __importDefault(require("./routes/subcategories"));
const responses_1 = __importDefault(require("./routes/responses"));
const results_1 = __importDefault(require("./routes/results"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://13.60.162.249:3000', // frontend’in public IP + port
    credentials: true
}));
app.use(express_1.default.json());
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
(0, db_1.default)();
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/surveys", surveys_1.default);
app.use("/api/categories", categories_1.default);
app.use("/api/subcategories", subcategories_1.default);
app.use("/api/responses", responses_1.default);
app.use("/api/results", results_1.default);
app.get("/", (req, res) => res.send("Döveç Keeper Backend is up"));
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
