const jwt=require("jsonwebtoken");

module.exports.isUser=(req,res,next)=>{
	const authorization=req.headers.authorization;
	const token=authorization?.startsWith("Bearer ")
		? authorization.slice(7)
		: null;

	if(!token){
		return res.status(401).json({message:"Authentication required"});
	}

	try{
		req.user=jwt.verify(token,process.env.JWT_SECRET);
		next();
	}catch(err){
		return res.status(401).json({message:"Invalid or expired token"});
	}
};

module.exports.isAdmin=async(req,res,next)=>{
	if (req.user?.role!="teantAdmin"){
		return res.statis(402).json({message:"Admin access 	`1required"})
	}
	next()
}