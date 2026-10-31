const prisma = require("../prisma");

// GET /api/customers
// Get all customers with pagination
const getCustomers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                skip,
                take: limit,
                orderBy: { id: "desc" }
            }),
            prisma.customer.count()
        ]);

        res.status(200).json({
            success: true,
            data: customers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get customers error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve customers"
        });
    }
};

// GET /api/customers/:id
// Get one customer
const getCustomerById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                subscriptions: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error("Get customer error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve customer"
        });
    }
};

// POST /api/customers
// Create a customer
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        if (
            phone !== undefined &&
            phone !== null &&
            typeof phone !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Phone must be a string"
            });
        }

        const customer = await prisma.customer.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                phone: phone?.trim() || null
            }
        });

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A customer with this email already exists"
            });
        }

        console.error("Create customer error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create customer"
        });
    }
};

// PUT /api/customers/:id
// Update a customer
const updateCustomer = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, email, phone } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
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

        if (email !== undefined) {
            if (typeof email !== "string" || !email.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Email must be a non-empty string"
                });
            }

            data.email = email.trim();
        }

        if (phone !== undefined) {
            if (phone !== null && typeof phone !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Phone must be a string or null"
                });
            }

            data.phone = phone?.trim() || null;
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        const customer = await prisma.customer.update({
            where: { id },
            data
        });

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: customer
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A customer with this email already exists"
            });
        }

        console.error("Update customer error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update customer"
        });
    }
};

// DELETE /api/customers/:id
// Delete a customer
const deleteCustomer = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { subscriptions: true }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (customer._count.subscriptions > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a customer who has subscriptions"
            });
        }

        await prisma.customer.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully"
        });
    } catch (error) {
        console.error("Delete customer error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete customer"
        });
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};