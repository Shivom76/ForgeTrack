const mongoose=require("mongoose");
const Schema=mongoose.Schema;


const assetSchema=new Schema({
    tenandId:{
        type:String.Types.ObjectId,
        ref:"Tenant",
        trim:true,
        index:true
    },
    name:{
        type:String,
        required:true,
        trim:true
    },
    serialNumber:{
        type:String,
        required:true,
        trim:true
    },
    status:{
        type:String,
        enum:["operational","decommissioned","maintenance"],
        default:"operational"
    },assignedTo:{
        type:String,
        ref:User,
        default:null
    }
},{
    timestamps:true
})

assetSchema.index({
    tenantId:1,
    serialNumber:1
},{
    unique:true
})

module.exports=mongoose.model("Asset",assetSchema);