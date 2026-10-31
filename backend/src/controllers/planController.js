const prisma = require("../prisma");

// GET /api/plans
// Get all plans with pagination
const getPlans = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            prisma.plan.findMany({
                skip,
                take: limit,
                orderBy: { id: "desc" }
            }),
            prisma.plan.count()
        ]);

        res.status(200).json({
            success: true,
            data: plans,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get plans error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve plans"
        });
    }
};

// GET /api/plans/:id
// Get one plan
const getPlanById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        const plan = await prisma.plan.findUnique({
            where: { id }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error("Get plan error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve plan"
        });
    }
};

// POST /api/plans
// Create a plan
const createPlan = async (req, res) => {
    try {
        const { name, description, pricePaise, billingPeriod } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof billingPeriod !== "string" ||
            !billingPeriod.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and billing period are required"
            });
        }

        if (
            !Number.isSafeInteger(pricePaise) ||
            pricePaise < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "pricePaise must be a non-negative integer"
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be a string or null"
            });
        }

        const plan = await prisma.plan.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                pricePaise,
                billingPeriod: billingPeriod.trim()
            }
        });

        res.status(201).json({
            success: true,
            message: "Plan created successfully",
            data: plan
        });
    } catch (error) {
        console.error("Create plan error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create plan"
        });
    }
};

// PUT /api/plans/:id
// Update plan details
const updatePlan = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, description, pricePaise, billingPeriod } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        const data = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name must be a non-empty string"
                });
            }

            data.name = name.trim();
        }

        if (description !== undefined) {
            if (description !== null && typeof description !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Description must be a string or null"
                });
            }

            data.description = description?.trim() || null;
        }

        if (pricePaise !== undefined) {
            if (
                !Number.isSafeInteger(pricePaise) ||
                pricePaise < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "pricePaise must be a non-negative integer"
                });
            }

            data.pricePaise = pricePaise;
        }

        if (billingPeriod !== undefined) {
            if (
                typeof billingPeriod !== "string" ||
                !billingPeriod.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Billing period must be a non-empty string"
                });
            }

            data.billingPeriod = billingPeriod.trim();
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        const plan = await prisma.plan.update({
            where: { id },
            data
        });

        res.status(200).json({
            success: true,
            message: "Plan updated successfully",
            data: plan
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        console.error("Update plan error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update plan"
        });
    }
};

// PATCH /api/plans/:id/status
// Activate or deactivate a plan
const updatePlanStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { isActive } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false"
            });
        }

        const plan = await prisma.plan.update({
            where: { id },
            data: { isActive }
        });

        res.status(200).json({
            success: true,
            message: `Plan ${isActive ? "activated" : "deactivated"} successfully`,
            data: plan
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        console.error("Update plan status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update plan status"
        });
    }
};

module.exports = {
    getPlans,
    getPlanById,
    createPlan,
    updatePlan,
    updatePlanStatus
};
