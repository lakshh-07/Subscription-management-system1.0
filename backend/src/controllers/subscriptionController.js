const prisma = require("../prisma");

// Utility to calculate next billing date based on billing period
function calculateNextBillingDate(startDate, billingPeriod) {
    const d = new Date(startDate);
    const period = (billingPeriod || "").toUpperCase().trim();

    switch (period) {
        case "DAILY":
            d.setDate(d.getDate() + 1);
            break;
        case "WEEKLY":
            d.setDate(d.getDate() + 7);
            break;
        case "MONTHLY":
            d.setMonth(d.getMonth() + 1);
            break;
        case "YEARLY":
        case "ANNUAL":
            d.setFullYear(d.getFullYear() + 1);
            break;
        default:
            d.setMonth(d.getMonth() + 1);
            break;
    }

    return d;
}

// GET /api/subscriptions
// List all subscriptions with pagination and optional filters
const getSubscriptions = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const { status, customerId, planId } = req.query;

        const where = {};
        if (status) {
            where.status = status.toUpperCase().trim();
        }
        if (customerId && !isNaN(parseInt(customerId, 10))) {
            where.customerId = parseInt(customerId, 10);
        }
        if (planId && !isNaN(parseInt(planId, 10))) {
            where.planId = parseInt(planId, 10);
        }

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: "desc" },
                include: {
                    customer: {
                        select: { id: true, name: true, email: true, phone: true }
                    },
                    plan: {
                        select: { id: true, name: true, pricePaise: true, billingPeriod: true, isActive: true }
                    },
                    _count: {
                        select: { invoices: true }
                    }
                }
            }),
            prisma.subscription.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: subscriptions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get subscriptions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve subscriptions"
        });
    }
};

// GET /api/subscriptions/:id
// Get subscription by ID with full details
const getSubscriptionById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid subscription ID"
            });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { id },
            include: {
                customer: true,
                plan: true,
                invoices: {
                    orderBy: { id: "desc" },
                    include: {
                        payments: true,
                        lines: true
                    }
                }
            }
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found"
            });
        }

        res.status(200).json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error("Get subscription error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve subscription"
        });
    }
};

// POST /api/subscriptions
// Create a new subscription
const createSubscription = async (req, res) => {
    try {
        const { customerId, planId, startDate, nextBillingAt } = req.body;

        const parsedCustomerId = Number(customerId);
        const parsedPlanId = Number(planId);

        if (!Number.isSafeInteger(parsedCustomerId) || parsedCustomerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid customerId is required"
            });
        }

        if (!Number.isSafeInteger(parsedPlanId) || parsedPlanId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid planId is required"
            });
        }

        // Verify customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: parsedCustomerId }
        });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Verify plan exists and is active
        const plan = await prisma.plan.findUnique({
            where: { id: parsedPlanId }
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }
        if (!plan.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot subscribe to an inactive plan"
            });
        }

        const parsedStartDate = startDate ? new Date(startDate) : new Date();
        if (isNaN(parsedStartDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid startDate format"
            });
        }

        // Default nextBillingAt to parsedStartDate so it can be billed immediately,
        // or to provided nextBillingAt
        let parsedNextBillingAt;
        if (nextBillingAt) {
            parsedNextBillingAt = new Date(nextBillingAt);
            if (isNaN(parsedNextBillingAt.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid nextBillingAt format"
                });
            }
        } else {
            parsedNextBillingAt = parsedStartDate;
        }

        const subscription = await prisma.subscription.create({
            data: {
                customerId: parsedCustomerId,
                planId: parsedPlanId,
                status: "ACTIVE",
                startDate: parsedStartDate,
                nextBillingAt: parsedNextBillingAt
            },
            include: {
                customer: {
                    select: { id: true, name: true, email: true }
                },
                plan: {
                    select: { id: true, name: true, pricePaise: true, billingPeriod: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: "Subscription created successfully",
            data: subscription
        });
    } catch (error) {
        console.error("Create subscription error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create subscription"
        });
    }
};

// PATCH /api/subscriptions/:id/status
// Update subscription status (ACTIVE, PAUSED, CLOSED)
const updateSubscriptionStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid subscription ID"
            });
        }

        const validStatuses = ["ACTIVE", "PAUSED", "CLOSED"];
        const normalizedStatus = (status || "").toUpperCase().trim();

        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(", ")}`
            });
        }

        const subscription = await prisma.subscription.update({
            where: { id },
            data: { status: normalizedStatus },
            include: {
                customer: { select: { id: true, name: true, email: true } },
                plan: { select: { id: true, name: true, pricePaise: true, billingPeriod: true } }
            }
        });

        res.status(200).json({
            success: true,
            message: `Subscription status updated to ${normalizedStatus}`,
            data: subscription
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Subscription not found"
            });
        }
        console.error("Update subscription status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update subscription status"
        });
    }
};

module.exports = {
    getSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscriptionStatus,
    calculateNextBillingDate
};
