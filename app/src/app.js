require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const flash = require("connect-flash");
const methodOverride = require("method-override");
const morgan = require("morgan");
const expressLayouts = require("express-ejs-layouts");

const pool = require("./config/db");
const { attachUser } = require("./middleware/auth");

const pagesRoutes = require("./routes/pages.routes");
const authRoutes = require("./routes/auth.routes");
const itemsRoutes = require("./routes/items.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout/main");

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(
  session({
    store: new pgSession({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET || "secreto_dev_inseguro",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    }
  })
);

app.use(flash());

app.use(attachUser);
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentPath = req.path;
  next();
});

app.use("/", pagesRoutes);
app.use("/auth", authRoutes);
app.use("/items", itemsRoutes);

app.use((req, res) => {
  res.status(404).render("404", { title: "Página no encontrada" });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    req.flash("error", "Cada imagen debe pesar menos de 5MB.");
    return res.redirect("back");
  }
  if (err.message && err.message.includes("imágenes")) {
    req.flash("error", err.message);
    return res.redirect("back");
  }
  res.status(500).render("404", { title: "Error", message: "Ocurrió un error inesperado." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
