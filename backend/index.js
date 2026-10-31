require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./src/routes/healthRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const planRoutes = require("./src/routes/planRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const billingRoutes = require("./src/routes/billingRoutes");
const invoiceRoutes = require("./src/routes/invoiceRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

// API Routes
app.use("/api", healthRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Subscription Management System API is running!",
        version: "1.0.0",
        endpoints: {
            health: "/api/health",
            customers: "/api/customers",
            plans: "/api/plans",
            subscriptions: "/api/subscriptions",
            billingPreview: "/api/billing/preview",
            billingRun: "/api/billing/run",
            invoices: "/api/invoices",
            dashboard: "/api/dashboard"
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
