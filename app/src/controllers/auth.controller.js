const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/db");
const { sendVerificationCode } = require("../config/mailer");
const { EMAIL_RE, PERU_PHONE_RE, PASSWORD_RE, NAME_MAX } = require("../utils/validators");

const CODE_TTL_MINUTES = 15;

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function createVerificationCode(userId) {
  const code = generateCode();
  const expires = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  await pool.query(
    "UPDATE users SET verification_code = $1, verification_expires = $2 WHERE id = $3",
    [code, expires, userId]
  );
  return code;
}

async function showRegister(req, res) {
  res.render("auth/register", { title: "Crear cuenta", values: {} });
}

async function register(req, res) {
  const { name, email, password, confirm_password, phone } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push("El nombre debe tener al menos 2 caracteres.");
  if (name && name.trim().length > NAME_MAX) errors.push(`El nombre no puede superar los ${NAME_MAX} caracteres.`);
  if (!email || !EMAIL_RE.test(email)) errors.push("Ingresa un correo electrónico válido.");
  if (!password || !PASSWORD_RE.test(password)) {
    errors.push("La contraseña debe tener al menos 8 caracteres e incluir letras, números y un carácter especial (ej. !@#$%).");
  }
  if (password !== confirm_password) errors.push("Las contraseñas no coinciden.");
  if (phone && !PERU_PHONE_RE.test(phone)) errors.push("El teléfono debe tener exactamente 9 dígitos numéricos.");

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
    const code = await createVerificationCode(user.id);
    await sendVerificationCode(user.email, user.name, code);

    req.session.pendingUserId = user.id;
    req.flash("success", `Te enviamos un código de verificación a ${user.email}.`);
    res.redirect("/auth/verify");
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

    if (!user.email_verified) {
      const code = await createVerificationCode(user.id);
      await sendVerificationCode(user.email, user.name, code);
      req.session.pendingUserId = user.id;
      req.flash("error", "Debes verificar tu correo antes de iniciar sesión. Te enviamos un nuevo código.");
      return res.redirect("/auth/verify");
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

async function showVerify(req, res) {
  if (!req.session.pendingUserId) {
    return res.redirect("/auth/login");
  }

  try {
    const result = await pool.query("SELECT email FROM users WHERE id = $1", [req.session.pendingUserId]);
    if (!result.rows.length) {
      delete req.session.pendingUserId;
      return res.redirect("/auth/register");
    }
    res.render("auth/verify", { title: "Verifica tu correo", email: result.rows[0].email });
  } catch (err) {
    console.error("Error al cargar verificación:", err);
    res.redirect("/auth/login");
  }
}

async function verifyCode(req, res) {
  const userId = req.session.pendingUserId;
  if (!userId) {
    return res.redirect("/auth/login");
  }

  const { code } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!result.rows.length) {
      delete req.session.pendingUserId;
      return res.redirect("/auth/register");
    }

    const user = result.rows[0];
    const isExpired = !user.verification_expires || new Date(user.verification_expires) < new Date();

    if (!code || code !== user.verification_code || isExpired) {
      req.flash("error", isExpired ? "El código venció. Solicita uno nuevo." : "Código incorrecto.");
      return res.render("auth/verify", { title: "Verifica tu correo", email: user.email });
    }

    await pool.query(
      "UPDATE users SET email_verified = TRUE, verification_code = NULL, verification_expires = NULL WHERE id = $1",
      [userId]
    );

    delete req.session.pendingUserId;
    req.session.user = { id: user.id, name: user.name, email: user.email };
    req.flash("success", "¡Cuenta verificada! Bienvenido/a.");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error al verificar código:", err);
    req.flash("error", "Ocurrió un error al verificar el código.");
    res.redirect("/auth/verify");
  }
}

async function resendCode(req, res) {
  const userId = req.session.pendingUserId;
  if (!userId) {
    return res.redirect("/auth/login");
  }

  try {
    const result = await pool.query("SELECT name, email FROM users WHERE id = $1", [userId]);
    if (!result.rows.length) {
      delete req.session.pendingUserId;
      return res.redirect("/auth/register");
    }

    const user = result.rows[0];
    const code = await createVerificationCode(userId);
    await sendVerificationCode(user.email, user.name, code);

    req.flash("success", "Te enviamos un nuevo código.");
    res.redirect("/auth/verify");
  } catch (err) {
    console.error("Error al reenviar código:", err);
    req.flash("error", "Ocurrió un error al reenviar el código.");
    res.redirect("/auth/verify");
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/");
  });
}

module.exports = { showRegister, register, showLogin, login, showVerify, verifyCode, resendCode, logout };
