const bcrypt = require("bcrypt");
const pool = require("../config/db");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function showRegister(req, res) {
  res.render("auth/register", { title: "Crear cuenta", values: {} });
}

async function register(req, res) {
  const { name, email, password, confirm_password, phone } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push("El nombre debe tener al menos 2 caracteres.");
  if (!email || !EMAIL_RE.test(email)) errors.push("Ingresa un correo electrónico válido.");
  if (!password || password.length < 6) errors.push("La contraseña debe tener al menos 6 caracteres.");
  if (password !== confirm_password) errors.push("Las contraseñas no coinciden.");

  if (errors.length) {
    return res.status(400).render("auth/register", {
      title: "Crear cuenta",
      errors,
      values: { name, email, phone }
    });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(400).render("auth/register", {
        title: "Crear cuenta",
        errors: ["Ya existe una cuenta con ese correo electrónico."],
        values: { name, email, phone }
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
      [name.trim(), email.toLowerCase(), hash, phone || null]
    );

    const user = result.rows[0];
    req.session.user = { id: user.id, name: user.name, email: user.email };
    req.flash("success", `¡Bienvenido/a, ${user.name}!`);
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res.status(500).render("auth/register", {
      title: "Crear cuenta",
      errors: ["Ocurrió un error al crear la cuenta. Intenta de nuevo."],
      values: { name, email, phone }
    });
  }
}

async function showLogin(req, res) {
  res.render("auth/login", { title: "Iniciar sesión", values: {} });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render("auth/login", {
      title: "Iniciar sesión",
      errors: ["Ingresa tu correo y contraseña."],
      values: { email }
    });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).render("auth/login", {
        title: "Iniciar sesión",
        errors: ["Correo o contraseña incorrectos."],
        values: { email }
      });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };
    req.flash("success", `Hola de nuevo, ${user.name}.`);
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    res.status(500).render("auth/login", {
      title: "Iniciar sesión",
      errors: ["Ocurrió un error al iniciar sesión. Intenta de nuevo."],
      values: { email }
    });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/");
  });
}

module.exports = { showRegister, register, showLogin, login, logout };
