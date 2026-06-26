const express = require("express");
const router = express.Router();
const pagesController = require("../controllers/pages.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/", pagesController.home);
router.get("/dashboard", requireAuth, pagesController.dashboard);

module.exports = router;
