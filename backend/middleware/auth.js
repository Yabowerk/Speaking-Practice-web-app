// Adjust path to your supabase client as needed
const { supabase } = require('../lib/supabase.js');

async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access token missing or invalid format" });
        }

        const token = authHeader?.split(" ")[1];
        if (!token || token === "undefined" || token === "null") {
            return res.status(401).json({ error: "No valid token provided" });
        }

        // Validate token directly with Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error("Supabase Auth Verification Error:", authError?.message);
            return res.status(401).json({
                error: "Invalid token",
                details: authError?.message // Helpful for debugging
            });
        }

        // CRITICAL: Attach the verified user to the request
        req.user = user;
        req.accessToken = token;
        next();

    } catch (err) {
        console.error("Auth Middleware Error:", err);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
}

module.exports = { requireAuth };