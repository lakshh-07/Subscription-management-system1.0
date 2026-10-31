require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./src/routes/healthRoutes");

const app = express();

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

// Health check
app.use("/api", healthRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Subscription Management System API is running!"
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});