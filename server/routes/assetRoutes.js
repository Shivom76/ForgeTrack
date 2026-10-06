const express=require("express");
const router=express.Router();
const assetController=require("../controllers/assetControllers")
const {isUser, restrictTo}=require("../middlewares/authMiddleware")

router.use(isUser)
router.route("/addAsset")
    .get((req,res)=>{
        res.send("Add eqp Page")
    })
    .post(restrictTo("tenantAdmin"),assetController.addAsset);

router.route("/removeAsset")
    .delete(restrictTo("tenantAdmin"),assetController.removeAsset)


// add route to edit the assets

module.exports=router