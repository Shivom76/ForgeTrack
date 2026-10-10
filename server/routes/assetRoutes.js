const express = require("express");
const router = express.Router();
const assets = require("../controllers/assetControllers");
const { authenticate, restrictTo } = require("../middlewares/authMiddleware");
const { validateIdParam } = require("../utils/http");
const { ROLES } = require("../constants");

router.param("id", validateIdParam("Asset"));
router.use(authenticate);

const manage = restrictTo(ROLES.ADMIN, ROLES.MANAGER);

router.get("/", assets.listAssets);
router.post("/", manage, assets.createAsset);
router.get("/:id", assets.getAsset);
router.patch("/:id", assets.updateAsset); // field-level rules per role live in the controller
router.delete("/:id", restrictTo(ROLES.ADMIN), assets.deleteAsset);
router.post("/:id/assign", manage, assets.assignAsset);
router.post("/:id/unassign", manage, assets.unassignAsset);

module.exports = router;
