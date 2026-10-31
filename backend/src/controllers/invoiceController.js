const prisma = require("../prisma");

// Helper to compute payment summary for an invoice
function enrichInvoiceWithTotals(invoice) {
    const paidPaise = (invoice.payments || []).reduce((acc, p) => acc + (p.amountPaise || 0), 0);
    const remainingPaise = Math.max(0, invoice.totalPaise - paidPaise);
    return {
        ...invoice,
        paidPaise,
        remainingPaise
    };
}

// GET /api/invoices
// List invoices with pagination, filtering, and calculated balances
const getInvoices = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const { status, subscriptionId, customerId } = req.query;

        const where = {};
        if (status) {
            where.status = status.toUpperCase().trim();
        }
        if (subscriptionId && !isNaN(parseInt(subscriptionId, 10))) {
            where.subscriptionId = parseInt(subscriptionId, 10);
        }
        if (customerId && !isNaN(parseInt(customerId, 10))) {
            where.subscription = {
                customerId: parseInt(customerId, 10)
            };
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: "desc" },
                include: {
                    lines: true,
                    payments: {
                        orderBy: { paymentDate: "desc" }
                    },
                    subscription: {
                        include: {
                            customer: { select: { id: true, name: true, email: true, phone: true } },
                            plan: { select: { id: true, name: true, pricePaise: true, billingPeriod: true } }
                        }
                    }
                }
            }),
            prisma.invoice.count({ where })
        ]);

        const enriched = invoices.map(enrichInvoiceWithTotals);

        res.status(200).json({
            success: true,
            data: enriched,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get invoices error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve invoices"
        });
    }
};

// GET /api/invoices/:id
// Get single invoice by ID
const getInvoiceById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice ID"
            });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                lines: true,
                payments: {
                    orderBy: { paymentDate: "desc" }
                },
                subscription: {
                    include: {
                        customer: true,
                        plan: true
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            success: true,
            data: enrichInvoiceWithTotals(invoice)
        });
    } catch (error) {
        console.error("Get invoice error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve invoice"
        });
    }
};

// POST /api/invoices/:id/payments
// Record a partial or full simulated payment against an invoice
const recordPayment = async (req, res) => {
    try {
        const invoiceId = Number(req.params.id);
        const { amountPaise, method, reference } = req.body;

        if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice ID"
            });
        }

        if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "amountPaise must be a positive integer greater than 0"
            });
        }

        // Fetch invoice with existing payments
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        if (invoice.status === "PAID") {
            return res.status(400).json({
                success: false,
                message: "Invoice is already fully paid"
            });
        }

        const existingPaidPaise = invoice.payments.reduce((acc, p) => acc + p.amountPaise, 0);
        const remainingPaise = Math.max(0, invoice.totalPaise - existingPaidPaise);

        if (remainingPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invoice has zero outstanding balance"
            });
        }

        const paymentReference = reference?.trim() || `PAY-${Date.now()}-${invoiceId}-${Math.floor(1000 + Math.random() * 9000)}`;
        const paymentMethod = method?.trim() || "SIMULATED";

        const newTotalPaid = existingPaidPaise + amountPaise;
        const isNowFullyPaid = newTotalPaid >= invoice.totalPaise;

        // Perform payment and status update in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    invoiceId,
                    amountPaise,
                    method: paymentMethod,
                    reference: paymentReference
                }
            });

            let updatedInvoice = invoice;
            if (isNowFullyPaid) {
                updatedInvoice = await tx.invoice.update({
                    where: { id: invoiceId },
                    data: { status: "PAID" }
                });
            }

            return { payment, isNowFullyPaid, updatedInvoice };
        });

        res.status(201).json({
            success: true,
            message: result.isNowFullyPaid
                ? "Payment recorded successfully. Invoice is now fully PAID."
                : "Partial payment recorded successfully.",
            data: {
                payment: result.payment,
                invoiceId,
                totalPaise: invoice.totalPaise,
                totalPaidPaise: newTotalPaid,
                remainingPaise: Math.max(0, invoice.totalPaise - newTotalPaid),
                invoiceStatus: result.isNowFullyPaid ? "PAID" : invoice.status
            }
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A payment with this reference already exists"
            });
        }
        console.error("Record payment error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to record payment"
        });
    }
};

module.exports = {
    getInvoices,
    getInvoiceById,
    recordPayment
};
