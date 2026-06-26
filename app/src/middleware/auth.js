function attachUser(req, res, next) {
  res.locals.user = req.session.user || null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Debes iniciar sesión para continuar.");
    return res.redirect("/auth/login");
  }
  next();
}

function redirectIfAuth(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  next();
}

module.exports = { attachUser, requireAuth, redirectIfAuth };
