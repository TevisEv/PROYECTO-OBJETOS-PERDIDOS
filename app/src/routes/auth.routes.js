const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { redirectIfAuth } = require("../middleware/auth");

router.get("/register", redirectIfAuth, authController.showRegister);
router.post("/register", redirectIfAuth, authController.register);
router.get("/login", redirectIfAuth, authController.showLogin);
router.post("/login", redirectIfAuth, authController.login);
router.get("/verify", redirectIfAuth, authController.showVerify);
router.post("/verify", redirectIfAuth, authController.verifyCode);
router.post("/verify/resend", redirectIfAuth, authController.resendCode);
router.post("/logout", authController.logout);

module.exports = router;
