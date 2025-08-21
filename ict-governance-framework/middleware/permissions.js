// Permission middleware for Express
function requirePermission(permission) {
  return function (req, res, next) {
    // Example: req.user.permissions is an array of permission strings
    if (req.user && Array.isArray(req.user.permissions) && req.user.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Missing permission ' + permission });
  };
}

module.exports = { requirePermission };
