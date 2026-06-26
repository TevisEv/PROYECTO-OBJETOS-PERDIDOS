const pool = require("../config/db");

async function home(req, res) {
  try {
    const recentResult = await pool.query(
      `SELECT i.*, c.name AS category_name,
              (SELECT filename FROM item_images WHERE item_id = i.id ORDER BY id ASC LIMIT 1) AS cover_image
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.status = 'activo'
       ORDER BY i.created_at DESC
       LIMIT 6`
    );

    res.render("home", {
      title: "Inicio",
      items: recentResult.rows
    });
  } catch (err) {
    console.error("Error al cargar inicio:", err);
    res.render("home", { title: "Inicio", items: [] });
  }
}

async function dashboard(req, res) {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name AS category_name,
              (SELECT filename FROM item_images WHERE item_id = i.id ORDER BY id ASC LIMIT 1) AS cover_image
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [req.session.user.id]
    );

    res.render("dashboard/index", {
      title: "Mis publicaciones",
      items: result.rows
    });
  } catch (err) {
    console.error("Error al cargar dashboard:", err);
    req.flash("error", "No se pudieron cargar tus publicaciones.");
    res.render("dashboard/index", { title: "Mis publicaciones", items: [] });
  }
}

module.exports = { home, dashboard };
