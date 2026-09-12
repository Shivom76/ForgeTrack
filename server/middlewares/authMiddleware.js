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

module.exports.isAdmin=(req,res,next)=>{
	if(req.user?.role!=="tenantAdmin"){
		return res.status(403).json({message:"Tenant admin access required"});
	}

	next();
}

module.exports.restrictTo=(...allowedRoles)=>{
	if(!allowedRoles.includes(req.user?.role)){
		return res.status(403).json({message:`You do not have the required access`})
	}
}