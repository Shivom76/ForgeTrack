const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const User=require("../models/userModel")
const Tenant=require("../models/tenantModel")

// kaam baaki hai 
// to make tenant schema and put tenant id for the registered users
// check gemini for reference

module.exports.tenant=async(req,res)=>{
    try{
        const {companyName,contactEmail,adminName,adminPassword}=req.body;
        const present=await Tenant.findOne({companyName:companyName})
        if (present){
            return res.status(400).json({message:`Tenant ${companyName} is aready registered`})
        }

        const saltRounds=parseInt(process.env.SALT_NUM) || 12
        const hashedPass=await bcrypt.hash(adminPassword,saltRounds);

        const newTenant= await Tenant.create({
            companyName:companyName,
            contactEmail:companyEmail,
        })

        const newAdmin=await User.create({
            name:adminName,
            password:hashedPass,
            role:"tenantAdmin",
            email:contactEmail,
            tenantId:newTenant._id
        })

        res.status(201).json({message:`Tenant ${newTenant.companyName} and ${newAdmin.name} is created`});

    }catch(err){
        res.status(500).json({error:err.message})
    }
}


module.exports.registerUser=async(req,res)=>{
    try{
        let {role}=req.params;
        let {name,password,email}=req.body;

        const validRoles = ["tenantAdmin", "operationManager", "fieldTechnician"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                message: `Invalid role '${role}'. Must be one of: ${validRoles.join(", ")}` 
            });
        }

        const saltRounds=parseInt(process.env.SALT_NUM)||12
        const hashedPassword=await bcrypt.hash(password,saltRounds);
        const newUser=await User.create({
            name:name,
            password:hashedPassword,
            email:email,
            role:role,
            tenantId:req.user.tenantId,
        })

        res.status(201).json({message:"User registered succesfully",user:newUser});
    }catch(err){
        res.status(500).json({error:err.message})
    }
}


// login user here
module.exports.loginUser=async(req,res)=>{
    try{
        let {email,password}=req.body;
        let currUser=await User.findOne({email:email}).select("+password");
        if(!currUser){
            return res.status(400).json({message:"User not found"})
        }
        const isMatched=await bcrypt.compare(password,currUser.password)
        if (!isMatched){
            return res.status(500).json({message:"Invalid User"});
        }

        if(!currUser.isApproved){
            return res.status(403).json({message:"Yout account is pending admin approval."})
        }
        
        //payload define krna parega
        const payload={
            tenantId:currUser.tenantId,
            userId:currUser._id,
            role:currUser.role
        }

        // generate token
        const token=jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {expiresIn:process.env.JWT_EXPIRES_IN||"7d"}
        )

        const data={
            message:"Login Successful",
            token:token,
            user:{
                id:currUser._id,
                name:currUser.name,
                role:currUser.role,
                email:currUser.email
            }
        }

        res.status(200).json(data)

    }catch(err){
        res.status(500).json({error:err.message})
    }
}

module.exports.approveUser=async(req,res)=>{
    const {userId}=req.params
    let userToApprove=await User.findOne({_id:userId,tenantId:req.user.tenantId})
    if(!userToApprove){
        res.status(401).json({message:"User not found"})
    }

    userToApprove.isApproved=true
    res.status(200).json({message:`User was approved`})

    await userToApprove.save()
}