const jwt = require("jsonwebtoken");
const Admin = require("../modules/admin/admin.model");

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token missing.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive || admin.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "Admin not found.",
      });
    }

    req.user = admin;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = adminAuth;