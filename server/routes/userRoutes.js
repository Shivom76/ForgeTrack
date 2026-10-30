const express = require("express");
const router = express.Router();
const users = require("../controllers/userControllers");
const { authenticate, restrictTo } = require("../middlewares/authMiddleware");
const { validateIdParam } = require("../utils/http");
const { ROLES } = require("../constants");

router.param("id", validateIdParam("User"));
router.use(authenticate);

router.get("/", restrictTo(ROLES.ADMIN, ROLES.MANAGER), users.listUsers);
router.post("/", restrictTo(ROLES.ADMIN), users.createUser);
router.patch("/:id", restrictTo(ROLES.ADMIN), users.updateUser);
router.delete("/delete/:id",restrictTo(ROLES.ADMIN),users.deleteUser);

module.exports = router;
