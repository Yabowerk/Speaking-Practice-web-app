const rateLimit = require("express-rate-limit");

const EXEMPT_USER_IDS = ["9ed2d391-3196-4457-a5a7-e460b2b0bf03"];

const sessionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 8,
    keyGenerator: (req) => req.user?.id || req.ip,
    skip: (req) => EXEMPT_USER_IDS.includes(req.user?.id),
    message: { error: "You've reached the hourly recording limit. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const topicsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.id || req.ip,
    skip: (req) => EXEMPT_USER_IDS.includes(req.user?.id),
    message: { error: "Too many topic requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { sessionLimiter, topicsLimiter };