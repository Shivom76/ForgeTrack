const express=require("express");
const router=express.Router();
const authController=require("../controllers/authControllers")
const {isUser}=require("../middlewares/authMiddleware");
const {isAdmin}=require("../middlewares/roleMiddleware");


router.route("/tenant")
    .get((req,res)=>{
        res.send("This is tenant registration page")
    })
    .post(authController.tenant);

router.route("/login")
    .get((req,res)=>{
        res.json({message:`Login Page`})
    })
    .post(authController.loginUser);

router.route(`/register/:role`)
    .post(isUser,isAdmin,authController.registerUser);

router.route("/approve/:userId")
    .patch(isUser,isAdmin,authController.approveUser);
    
module.exports=router;