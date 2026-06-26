const pool = require("../config/db");

async function create(req, res) {
  const { id } = req.params;
  const { body } = req.body;

  if (!body || body.trim().length < 3) {
    req.flash("error", "El comentario debe tener al menos 3 caracteres.");
    return res.redirect(`/items/${id}`);
  }

  try {
    const itemResult = await pool.query("SELECT id FROM items WHERE id = $1", [id]);
    if (!itemResult.rows.length) {
      return res.status(404).render("404", { title: "No encontrado" });
    }

    await pool.query(
      "INSERT INTO comments (item_id, user_id, body) VALUES ($1, $2, $3)",
      [id, req.session.user.id, body.trim()]
    );

    req.flash("success", "Comentario publicado.");
    res.redirect(`/items/${id}#comentarios`);
  } catch (err) {
    console.error("Error al crear comentario:", err);
    req.flash("error", "Ocurrió un error al publicar el comentario.");
    res.redirect(`/items/${id}`);
  }
}

async function destroy(req, res) {
  const { id, commentId } = req.params;

  try {
    const commentResult = await pool.query("SELECT * FROM comments WHERE id = $1 AND item_id = $2", [commentId, id]);
    if (!commentResult.rows.length) {
      return res.status(404).render("404", { title: "No encontrado" });
    }

    if (commentResult.rows[0].user_id !== req.session.user.id) {
      req.flash("error", "No tienes permiso para eliminar este comentario.");
      return res.redirect(`/items/${id}#comentarios`);
    }

    await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
    req.flash("success", "Comentario eliminado.");
    res.redirect(`/items/${id}#comentarios`);
  } catch (err) {
    console.error("Error al eliminar comentario:", err);
    req.flash("error", "Ocurrió un error al eliminar el comentario.");
    res.redirect(`/items/${id}`);
  }
}

module.exports = { create, destroy };
