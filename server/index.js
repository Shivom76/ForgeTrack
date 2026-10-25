require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path=require("path")

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const assetRoutes = require("./routes/assetRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

// Fail fast on a misconfigured environment instead of failing on the first request.
for (const key of ["DB_URL", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "100kb" }));
app.use(cors({ origin: process.env.FRONT_URL || "http://localhost:5173" }));

app.get('/',(req,res)=>{
  res.send("Home page backend")
})

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
// app.get("/",(req,res)=>{
//   res.send("This is the home pagee")
// })

app.use(notFound);
app.use(errorHandler);

// Only start accepting traffic once the DB is connected.
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
