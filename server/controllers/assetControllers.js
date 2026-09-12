const crypto=require("crypto");
const Asset=require("../models/assetModel");

const addAsset=async(req,res)=>{
    try{
        let {eqpName,serialNum, status}=req.body
        const tenantId=req.user.tenantId
        
        if (!serialNum){
            let tagNum=crypto.randomBytes(3).toString("Hex").toUpperCase()
            let serialNum=`AST-${tagNum}`
        }

        let existingAsset=Asset.findOne({
            tenantId:tenantId,
            serailNumber:serialNum
        })

        if(existingAsset){
            return `Asset is alreay present`
        }

        const newAsset=await Asset.create({
            tenantId:tenantId,
            name:eqpName,
            serialNumber:serialNum,
            status:status || "Operational",
            assignedTo:null
        })

        res.status(201).json({
            message:`Asset ${eqpName} is created`,
            asset:newAsset
        });
    }catch(err){
        return res.status(500).json({error:err.message})
    }
}