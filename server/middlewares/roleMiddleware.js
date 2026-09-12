// module.exports.isAdmin=(req,res,next)=>{
// 	if(req.user?.role!=="tenantAdmin"){
// 		return res.status(403).json({message:"Tenant admin access required"});
// 	}

// 	next();
// }