const prisma = require("../prisma");
const { calculateNextBillingDate } = require("./subscriptionController");

// Helper to generate a unique invoice number
function generateInvoiceNumber(subscriptionId, timestamp) {
    const ts = timestamp || Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV-${ts}-${subscriptionId}-${random}`;
}

// POST /api/billing/preview
// Preview invoices due for billing without saving anything to the database
const previewBilling = async (req, res) => {
    try {
        const asOfDate = req.body?.asOfDate ? new Date(req.body.asOfDate) : new Date();

        if (isNaN(asOfDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid asOfDate format"
            });
        }

        // Find active subscriptions where nextBillingAt is on or before asOfDate
        const subscriptionsDue = await prisma.subscription.findMany({
            where: {
                status: "ACTIVE",
                nextBillingAt: {
                    lte: asOfDate
                }
            },
            include: {
                customer: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                plan: true,
                invoices: {
                    select: { billingPeriodStart: true, billingPeriodEnd: true }
                }
            }
        });

        const previewInvoices = [];
        let totalPaise = 0;

        for (const sub of subscriptionsDue) {
            const periodStart = new Date(sub.nextBillingAt);
            const periodEnd = calculateNextBillingDate(periodStart, sub.plan.billingPeriod);

            // Check if an invoice for this period already exists
            const alreadyExists = sub.invoices.some(inv => 
                new Date(inv.billingPeriodStart).getTime() === periodStart.getTime() &&
                new Date(inv.billingPeriodEnd).getTime() === periodEnd.getTime()
            );

            if (alreadyExists) {
                continue;
            }

            const dueDate = new Date(periodStart);
            dueDate.setDate(dueDate.getDate() + 14); // 14-day payment grace period

            const invoiceTotal = sub.plan.pricePaise;
            totalPaise += invoiceTotal;

            previewInvoices.push({
                subscriptionId: sub.id,
                customer: sub.customer,
                plan: {
                    id: sub.plan.id,
                    name: sub.plan.name,
                    billingPeriod: sub.plan.billingPeriod,
                    pricePaise: sub.plan.pricePaise
                },
                simulatedInvoiceNumber: generateInvoiceNumber(sub.id, "PREVIEW"),
                billingPeriodStart: periodStart,
                billingPeriodEnd: periodEnd,
                issueDate: asOfDate,
                dueDate,
                totalPaise: invoiceTotal,
                status: "PENDING",
                lines: [
                    {
                        description: `${sub.plan.name} (${sub.plan.billingPeriod})`,
                        quantity: 1,
                        unitPricePaise: sub.plan.pricePaise,
                        amountPaise: sub.plan.pricePaise
                    }
                ]
            });
        }

        res.status(200).json({
            success: true,
            asOfDate,
            totalDueCount: previewInvoices.length,
            totalPaise,
            invoices: previewInvoices
        });
    } catch (error) {
        console.error("Preview billing error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to preview billing"
        });
    }
};

// POST /api/billing/run
// Generate invoices for subscriptions due for billing within a transaction
const runBilling = async (req, res) => {
    try {
        const asOfDate = req.body?.asOfDate ? new Date(req.body.asOfDate) : new Date();

        if (isNaN(asOfDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid asOfDate format"
            });
        }

        // 1. Fetch eligible subscriptions
        const subscriptionsDue = await prisma.subscription.findMany({
            where: {
                status: "ACTIVE",
                nextBillingAt: {
                    lte: asOfDate
                }
            },
            include: {
                customer: {
                    select: { id: true, name: true, email: true }
                },
                plan: true,
                invoices: {
                    select: { billingPeriodStart: true, billingPeriodEnd: true }
                }
            }
        });

        if (subscriptionsDue.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No subscriptions are currently due for billing",
                generatedCount: 0,
                totalPaise: 0,
                data: []
            });
        }

        const createdInvoices = [];
        let grandTotalPaise = 0;

        // 2. Process within Prisma transaction for consistency and duplicate prevention
        await prisma.$transaction(async (tx) => {
            for (const sub of subscriptionsDue) {
                const periodStart = new Date(sub.nextBillingAt);
                const periodEnd = calculateNextBillingDate(periodStart, sub.plan.billingPeriod);

                // Check again inside transaction to prevent duplicates
                const existing = await tx.invoice.findFirst({
                    where: {
                        subscriptionId: sub.id,
                        billingPeriodStart: periodStart,
                        billingPeriodEnd: periodEnd
                    }
                });

                if (existing) {
                    continue;
                }

                const dueDate = new Date(periodStart);
                dueDate.setDate(dueDate.getDate() + 14);

                const invoiceNumber = generateInvoiceNumber(sub.id);
                const planPrice = sub.plan.pricePaise;

                // Create the Invoice with InvoiceLine
                const invoice = await tx.invoice.create({
                    data: {
                        subscriptionId: sub.id,
                        invoiceNumber,
                        billingPeriodStart: periodStart,
                        billingPeriodEnd: periodEnd,
                        issueDate: asOfDate,
                        dueDate,
                        totalPaise: planPrice,
                        status: "PENDING",
                        lines: {
                            create: [
                                {
                                    description: `${sub.plan.name} (${sub.plan.billingPeriod})`,
                                    quantity: 1,
                                    unitPricePaise: planPrice,
                                    amountPaise: planPrice
                                }
                            ]
                        }
                    },
                    include: {
                        lines: true,
                        subscription: {
                            include: {
                                customer: { select: { id: true, name: true, email: true } },
                                plan: { select: { id: true, name: true, pricePaise: true, billingPeriod: true } }
                            }
                        }
                    }
                });

                // Advance the subscription's nextBillingAt to periodEnd
                await tx.subscription.update({
                    where: { id: sub.id },
                    data: {
                        nextBillingAt: periodEnd
                    }
                });

                createdInvoices.push(invoice);
                grandTotalPaise += planPrice;
            }
        });

        res.status(201).json({
            success: true,
            message: `Billing run completed. Generated ${createdInvoices.length} invoices.`,
            generatedCount: createdInvoices.length,
            totalPaise: grandTotalPaise,
            data: createdInvoices
        });
    } catch (error) {
        console.error("Run billing error:", error);
        res.status(500).json({
            success: false,
            message: "Billing run failed"
        });
    }
};

module.exports = {
    previewBilling,
    runBilling
};
