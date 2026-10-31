const express = require("express");
const router = express.Router();

const {
    previewBilling,
    runBilling
} = require("../controllers/billingController");

router.post("/preview", previewBilling);
router.post("/run", runBilling);

module.exports = router;
