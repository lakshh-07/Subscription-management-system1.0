const express = require("express");
const router = express.Router();

const {
    getInvoices,
    getInvoiceById,
    recordPayment
} = require("../controllers/invoiceController");

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/:id/payments", recordPayment);

module.exports = router;
