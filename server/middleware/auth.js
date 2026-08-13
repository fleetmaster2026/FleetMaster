const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fleetmaster-dev-secret-change-me";

/**
 * Verifies the Bearer token on every request and attaches
 * { id, username, role } to req.user. Rejects with 401 if missing/invalid.
 */
function authenticate(req, res, next) {

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

/**
 * Allows GET/HEAD/OPTIONS (read-only) for any authenticated user.
 * Blocks POST/PUT/PATCH/DELETE unless the user's role is 'admin'.
 * Mount AFTER `authenticate` on any route group that allows mutation.
 */
function requireAdminForWrites(req, res, next) {

  const readOnlyMethods = ["GET", "HEAD", "OPTIONS"];

  if (readOnlyMethods.includes(req.method)) {
    return next();
  }

  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    error: "Read-only access. You don't have permission to make changes."
  });
}

module.exports = { authenticate, requireAdminForWrites, JWT_SECRET };
