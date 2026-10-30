const User = require("../models/userModel");
const Asset=require("../models/assetModel");
const { ROLES, ROLE_LIST } = require("../constants");
const {
  asyncHandler,
  httpError,
  requireFields,
  escapeRegex,
  parsePagination,
  paginated,
} = require("../utils/http");
const {
  assertValidEmail,
  assertValidPassword,
  hashPassword,
} = require("../utils/validators");

// POST /api/users   (admin)  -- replaces /register/:role
module.exports.createUser = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password", "role"]);
  const { name, email, password, role } = req.body;
  if (!ROLE_LIST.includes(role)) {
    throw httpError(400, `Role must be one of: ${ROLE_LIST.join(", ")}`);
  }
  assertValidEmail(email);
  assertValidPassword(password);

  const user = await User.create({
    tenantId: req.user.tenantId,
    name,
    email,
    password: await hashPassword(password),
    role,
    isApproved: true, // an admin is creating them, so no second approval step
  });

  res.status(201).json({ message: "User created", user });
});

// GET /api/users?role=&search=&page=&limit=   (admin, manager)
module.exports.listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = { tenantId: req.user.tenantId };

  if (typeof role === "string" && ROLE_LIST.includes(role)) filter.role = role;
  if (typeof search === "string" && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const p = parsePagination(req.query);
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    User.countDocuments(filter),
  ]);

  res.json(paginated(data, total, p));
});

// PATCH /api/users/:id   (admin)   { name?, role?, isActive? }
module.exports.updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive } = req.body;
  const update = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) throw httpError(400, "Invalid name");
    update.name = name;
  }
  if (role !== undefined) {
    if (!ROLE_LIST.includes(role)) {
      throw httpError(400, `Role must be one of: ${ROLE_LIST.join(", ")}`);
    }
    update.role = role;
  }
  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") throw httpError(400, "isActive must be true or false");
    update.isActive = isActive;
  }
  if (!Object.keys(update).length) throw httpError(400, "Nothing to update");

  // Prevent an admin from locking themselves out.
  const isSelf = req.params.id === req.user.userId;
  const demotes = update.role !== undefined && update.role !== ROLES.ADMIN;
  if (isSelf && (demotes || update.isActive === false)) {
    throw httpError(400, "You cannot demote or deactivate your own account");
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!user) throw httpError(404, "User not found");

  res.json({ message: "User updated", user });
});



module.exports.deleteUser=async(req,res, next)=>{
  try{
    if(req.params.id===req.user.userId){
      return res.status(400).json({message:`You can't delete your own account`});
    }

    const deletedUser=await User.findOneAndDelete({
      _id:req.params.id,
      tenantId:req.user.tenantId
    })

    if(!deletedUser){
      return  res.status(404).json({message:`User not found`});
    }

    await Asset.updateMany(
      {tenantId:req.user.tenantId, assignedTo:deletedUser._id},
      {$set:{assignedTo:null}}
    )

    console.log(`${deletedUser} is deleted`)
    
    return res.status(200).json({message:`User ${deletedUser.name} has been removed`})
  }catch(err){
    next(err);
  }
}