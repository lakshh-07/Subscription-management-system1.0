const prisma = require("../prisma");

// GET /api/dashboard
// Summary metrics and recent activity for the dashboard
const getDashboardStats = async (req, res) => {
    try {
        const [
            customerCount,
            activeSubscriptionCount,
            totalSubscriptionCount,
            pendingInvoiceCount,
            paidInvoiceCount,
            allInvoices,
            allPayments,
            recentSubscriptions,
            recentInvoices
        ] = await Promise.all([
            prisma.customer.count(),
            prisma.subscription.count({ where: { status: "ACTIVE" } }),
            prisma.subscription.count(),
            prisma.invoice.count({ where: { status: "PENDING" } }),
            prisma.invoice.count({ where: { status: "PAID" } }),
            prisma.invoice.findMany({
                select: { id: true, totalPaise: true, status: true }
            }),
            prisma.payment.findMany({
                select: { amountPaise: true }
            }),
            prisma.subscription.findMany({
                take: 5,
                orderBy: { id: "desc" },
                include: {
                    customer: { select: { id: true, name: true, email: true } },
                    plan: { select: { id: true, name: true, pricePaise: true, billingPeriod: true } }
                }
            }),
            prisma.invoice.findMany({
                take: 5,
                orderBy: { id: "desc" },
                include: {
                    subscription: {
                        include: {
                            customer: { select: { id: true, name: true } },
                            plan: { select: { id: true, name: true } }
                        }
                    },
                    payments: { select: { amountPaise: true } }
                }
            })
        ]);

        const totalRevenuePaise = allPayments.reduce((sum, p) => sum + p.amountPaise, 0);

        // Calculate total pending amount
        const pendingInvoices = allInvoices.filter(i => i.status === "PENDING");
        const totalPendingPaise = pendingInvoices.reduce((sum, i) => sum + i.totalPaise, 0);

        res.status(200).json({
            success: true,
            data: {
                counts: {
                    customers: customerCount,
                    activeSubscriptions: activeSubscriptionCount,
                    totalSubscriptions: totalSubscriptionCount,
                    pendingInvoices: pendingInvoiceCount,
                    paidInvoices: paidInvoiceCount
                },
                financials: {
                    totalRevenuePaise,
                    totalRevenueINR: (totalRevenuePaise / 100).toFixed(2),
                    totalPendingPaise,
                    totalPendingINR: (totalPendingPaise / 100).toFixed(2)
                },
                recentSubscriptions,
                recentInvoices: recentInvoices.map(inv => {
                    const paid = inv.payments.reduce((s, p) => s + p.amountPaise, 0);
                    return {
                        id: inv.id,
                        invoiceNumber: inv.invoiceNumber,
                        customerName: inv.subscription?.customer?.name,
                        planName: inv.subscription?.plan?.name,
                        totalPaise: inv.totalPaise,
                        paidPaise: paid,
                        remainingPaise: Math.max(0, inv.totalPaise - paid),
                        status: inv.status,
                        issueDate: inv.issueDate
                    };
                })
            }
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard statistics"
        });
    }
};

module.exports = {
    getDashboardStats
};
