const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ msg: "Not authorized. No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.user = data; // data = { id: user._id }
        next();
    } catch (error) {
        return res.status(403).json({ msg: "Wrong or expired token", error: error.message });
    }
};

module.exports = verifyToken;
