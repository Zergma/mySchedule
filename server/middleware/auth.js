function requireAuthAPI(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
    next();
}

function requireAuthPage(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login.html");
    }
    next();
}

module.exports = { requireAuthAPI, requireAuthPage };
