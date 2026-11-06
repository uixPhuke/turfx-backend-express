const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");
const Admin = require("../modules/admin/admin.model");

module.exports = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer /, "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const Model = decoded.realm === "admin" ? Admin : User;
    const account = await Model.findById(decoded.id);
    if (decoded.type !== "access" || !account || account.isBlocked || account.isDeleted ||
        account.isActive === false || decoded.version !== (account.tokenVersion || 0)) {
      return next(new Error("Account unavailable"));
    }
    socket.user = { _id: account._id, role: account.role, realm: decoded.realm,
      name: account.name, email: account.email };
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
};
