const mongoose=require("mongoose");
const {Schema}=mongoose;

const UserSchema=new Schema({
    tenantId:{
        type:Schema.Types.ObjectId,
        ref:"Tenant",
        required:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        // unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        select:false
    },
    role:{
        type:String,
        enum:[
            "tenantAdmin",
            "operationManager",
            "fieldTechnician"
        ],default:"fieldTechnician"
    },
    name:{
        type:String,
        required:true,
        trim:true,
        minlength:3,
        maxlength:20
    },
    isApproved:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
}
);

// keeps the tenantId and email unique as a pair 
// like tenant1 and abc@gmail.com duplicate nhi ho sakta
UserSchema.index(
    {
        tenantId:1,
        email:1
    },{
        unique:true
    }
)

module.exports=mongoose.model("User",UserSchema);