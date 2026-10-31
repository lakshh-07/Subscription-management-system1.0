const express = require("express");
const router = express.Router();

const {
getPlans,
getPlanById,
createPlan,
updatePlan,
updatePlanStatus
} = require("../controllers/planController");

router.get("/", getPlans);
router.get("/:id", getPlanById);
router.post("/", createPlan);
router.put("/:id", updatePlan);
router.patch("/:id/status", updatePlanStatus);

module.exports = router;
