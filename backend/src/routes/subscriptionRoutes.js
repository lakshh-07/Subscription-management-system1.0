const express = require("express");
const router = express.Router();

const {
    getSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscriptionStatus
} = require("../controllers/subscriptionController");

router.get("/", getSubscriptions);
router.get("/:id", getSubscriptionById);
router.post("/", createSubscription);
router.patch("/:id/status", updateSubscriptionStatus);

module.exports = router;
