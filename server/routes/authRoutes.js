const express = require("express");
const router = express.Router();
const auth = require("../controllers/authControllers");
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/register-tenant", auth.registerTenant);
router.post("/login", auth.login);
router.get("/me", authenticate, auth.me);

module.exports = router;
