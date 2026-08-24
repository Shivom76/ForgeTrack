const mongoose=require("mongoose");
const Schema=mongoose.Schema;


// future updates
// can use subsription part also ig required later

const tenantSchema=new Schema({
    companyName:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    contactEmail:{
        type:String,
        required:true,
        trim:true,
        lowercase:true
    }
},{
    timestamps:true
}
);

module.exports=mongoose.model("Tenant",tenantSchema);