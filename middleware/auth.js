const jwt = require('jsonwebtoken');

const config = process.env;

const verifyToken = (req, res, next) => {
    //receive tokens
    const token = req.body.token || req.query.token || req.headers['x-access-origin'];

    //validating tokens
    if (!token) {
        res.status(400).send("Tokens required !!")
    }

    try {
        const decoded = jwt.verify(token, config.ACCESS_TOKEN_KEY);
        req.existingUser = decoded
    } catch (error) {
        res.status(400).send('Invalid Token')
    }
    return next();
}

module.exports = verifyToken;