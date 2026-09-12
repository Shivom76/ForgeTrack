const express=require("express");
const router=express.Router();

router.route("/addAsset")
    .get((req,res)=>{
        res.send("Add eqp Page")
    })

module.exports=router