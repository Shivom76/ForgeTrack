const mongoose=require("mongoose");
const Schema=mongoose.Schema;


const assetSchema=new Schema({
    tenantId:{
        type:Schema.Types.ObjectId,
        ref:"Tenant",
        trim:true,
        index:true,
        required:true
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
        type:Schema.Types.ObjectId,
        ref:"User",
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