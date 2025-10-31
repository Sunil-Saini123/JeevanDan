const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const isDonor = (req, res, next) => {
  if (req.user.role !== 'donor') {
    return res.status(403).json({ error: 'Access denied. Donor only.' });
  }
  next();
};

const isReceiver = (req, res, next) => {
  if (req.user.role !== 'receiver') {
    return res.status(403).json({ error: 'Access denied. Receiver only.' });
  }
  next();
};

module.exports = { authMiddleware, isDonor, isReceiver };