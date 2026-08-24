require("dotenv").config();

const express=require("express");
const app=express();
const cors=require("cors");
const authRoutes=require("./routes/authRoutes.js");

// Database connection
const mongoose=require("mongoose")
mongoose.connect(process.env.DB_URL)
    .then(()=>{
        console.log("Database connected!");
    }).catch((err)=>{
        console.error(err)
    })

// Few middlewares
const currUrl=process.env.FRONT_URL
app.use(express.json())
app.use(cors({
    origin:currUrl
}))

const portVal=process.env.PORT

app.get('/',(req,res)=>{
res.send("<h2>This is home page</h2>")
});

app.use("/api/auth/",authRoutes);


app.listen(portVal,()=>{
console.log(`${portVal} is listening`)
});