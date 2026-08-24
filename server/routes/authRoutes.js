const express=require("express");
const router=express.Router();
const authController=require("../controllers/authControllers")


router.route("/tenant")
    .post(authController.tenant);

router.route("/login")
    .get((req,res)=>{
        res.json({message:`Login Page`})
    })
    .post(authController.loginUser);

router.route(`/register/:role`)
    .post(authController.registerUser);
    
module.exports=router;