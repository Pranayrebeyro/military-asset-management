export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access Denied: Insufficient authorization level.'
      });
    }

    next();
  };
};

export const enforceBaseScope = (req, res, next) => {
  if (req.user.role === 'BASE_COMMANDER') {
    req.query.baseId = req.user.baseId;
  }

  next();
};
