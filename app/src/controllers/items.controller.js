const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { UPLOAD_DIR } = require("../middleware/upload");

const PAGE_SIZE = 9;

async function getCategories() {
  const result = await pool.query("SELECT * FROM categories ORDER BY name ASC");
  return result.rows;
}

async function index(req, res) {
  const { q, category, type, status, location } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`i.category_id = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`i.type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }
  if (location) {
    params.push(`%${location}%`);
    conditions.push(`i.location ILIKE $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM items i ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    const listParams = [...params, PAGE_SIZE, offset];
    const itemsResult = await pool.query(
      `SELECT i.*, c.name AS category_name,
              (SELECT filename FROM item_images WHERE item_id = i.id ORDER BY id ASC LIMIT 1) AS cover_image
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    const categories = await getCategories();

    res.render("items/index", {
      title: "Objetos perdidos y encontrados",
      items: itemsResult.rows,
      categories,
      filters: { q, category, type, status, location },
      page,
      totalPages,
      total
    });
  } catch (err) {
    console.error("Error al listar items:", err);
    req.flash("error", "No se pudieron cargar los objetos.");
    res.redirect("/");
  }
}

async function show(req, res) {
  const { id } = req.params;

  try {
    const itemResult = await pool.query(
      `SELECT i.*, c.name AS category_name, u.name AS owner_name
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       JOIN users u ON u.id = i.user_id
       WHERE i.id = $1`,
      [id]
    );

    if (!itemResult.rows.length) {
      return res.status(404).render("404", { title: "No encontrado" });
    }

    const imagesResult = await pool.query(
      "SELECT * FROM item_images WHERE item_id = $1 ORDER BY id ASC",
      [id]
    );

    const commentsResult = await pool.query(
      `SELECT c.*, u.name AS author_name
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.item_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    const item = itemResult.rows[0];
    const isOwner = req.session.user && req.session.user.id === item.user_id;

    res.render("items/show", {
      title: item.title,
      item,
      images: imagesResult.rows,
      comments: commentsResult.rows,
      isOwner
    });
  } catch (err) {
    console.error("Error al mostrar item:", err);
    req.flash("error", "No se pudo cargar el objeto.");
    res.redirect("/items");
  }
}

async function newForm(req, res) {
  const categories = await getCategories();
  res.render("items/form", {
    title: "Publicar objeto",
    categories,
    item: {},
    formAction: "/items",
    isEdit: false
  });
}

async function create(req, res) {
  const { type, title, description, location, item_date, category_id, contact_name, contact_phone, contact_email } = req.body;
  const errors = [];

  if (!["perdido", "encontrado"].includes(type)) errors.push("Selecciona si el objeto se perdió o se encontró.");
  if (!title || title.trim().length < 3) errors.push("El título debe tener al menos 3 caracteres.");
  if (!description || description.trim().length < 10) errors.push("La descripción debe tener al menos 10 caracteres.");
  if (!location) errors.push("La ubicación es obligatoria.");
  if (!item_date) errors.push("La fecha es obligatoria.");
  if (!contact_phone && !contact_email) errors.push("Indica al menos un medio de contacto (teléfono o correo).");

  if (errors.length) {
    const categories = await getCategories();
    return res.status(400).render("items/form", {
      title: "Publicar objeto",
      categories,
      errors,
      item: req.body,
      formAction: "/items",
      isEdit: false
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO items (user_id, category_id, type, title, description, location, item_date, contact_name, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        req.session.user.id,
        category_id || null,
        type,
        title.trim(),
        description.trim(),
        location.trim(),
        item_date,
        contact_name || req.session.user.name,
        contact_phone || null,
        contact_email || null
      ]
    );

    const itemId = result.rows[0].id;

    if (req.files && req.files.length) {
      const values = req.files.map((f) => `(${itemId}, '${f.filename}')`).join(",");
      await pool.query(`INSERT INTO item_images (item_id, filename) VALUES ${values}`);
    }

    req.flash("success", "¡Publicación creada con éxito!");
    res.redirect(`/items/${itemId}`);
  } catch (err) {
    console.error("Error al crear item:", err);
    const categories = await getCategories();
    res.status(500).render("items/form", {
      title: "Publicar objeto",
      categories,
      errors: ["Ocurrió un error al guardar la publicación."],
      item: req.body,
      formAction: "/items",
      isEdit: false
    });
  }
}

async function editForm(req, res) {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM items WHERE id = $1", [id]);

  if (!result.rows.length) {
    return res.status(404).render("404", { title: "No encontrado" });
  }

  const item = result.rows[0];
  if (item.user_id !== req.session.user.id) {
    req.flash("error", "No tienes permiso para editar esta publicación.");
    return res.redirect("/dashboard");
  }

  const categories = await getCategories();
  const imagesResult = await pool.query("SELECT * FROM item_images WHERE item_id = $1", [id]);

  res.render("items/form", {
    title: "Editar publicación",
    categories,
    item,
    images: imagesResult.rows,
    formAction: `/items/${id}?_method=PUT`,
    isEdit: true
  });
}

async function update(req, res) {
  const { id } = req.params;
  const { type, title, description, location, item_date, category_id, contact_name, contact_phone, contact_email } = req.body;

  try {
    const existing = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).render("404", { title: "No encontrado" });

    const item = existing.rows[0];
    if (item.user_id !== req.session.user.id) {
      req.flash("error", "No tienes permiso para editar esta publicación.");
      return res.redirect("/dashboard");
    }

    await pool.query(
      `UPDATE items SET category_id = $1, type = $2, title = $3, description = $4, location = $5,
       item_date = $6, contact_name = $7, contact_phone = $8, contact_email = $9, updated_at = NOW()
       WHERE id = $10`,
      [category_id || null, type, title.trim(), description.trim(), location.trim(), item_date, contact_name, contact_phone || null, contact_email || null, id]
    );

    if (req.files && req.files.length) {
      const values = req.files.map((f) => `(${id}, '${f.filename}')`).join(",");
      await pool.query(`INSERT INTO item_images (item_id, filename) VALUES ${values}`);
    }

    req.flash("success", "Publicación actualizada.");
    res.redirect(`/items/${id}`);
  } catch (err) {
    console.error("Error al actualizar item:", err);
    req.flash("error", "Ocurrió un error al actualizar la publicación.");
    res.redirect(`/items/${id}/edit`);
  }
}

async function resolve(req, res) {
  const { id } = req.params;
  try {
    const existing = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).render("404", { title: "No encontrado" });

    const item = existing.rows[0];
    if (item.user_id !== req.session.user.id) {
      req.flash("error", "No tienes permiso para modificar esta publicación.");
      return res.redirect("/dashboard");
    }

    const newStatus = item.status === "activo" ? "recuperado" : "activo";
    await pool.query("UPDATE items SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus, id]);

    req.flash("success", newStatus === "recuperado" ? "Marcado como recuperado." : "Marcado como activo de nuevo.");
    res.redirect(`/items/${id}`);
  } catch (err) {
    console.error("Error al cambiar estado:", err);
    req.flash("error", "Ocurrió un error al actualizar el estado.");
    res.redirect("/dashboard");
  }
}

async function destroy(req, res) {
  const { id } = req.params;
  try {
    const existing = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).render("404", { title: "No encontrado" });

    const item = existing.rows[0];
    if (item.user_id !== req.session.user.id) {
      req.flash("error", "No tienes permiso para eliminar esta publicación.");
      return res.redirect("/dashboard");
    }

    const imagesResult = await pool.query("SELECT filename FROM item_images WHERE item_id = $1", [id]);
    imagesResult.rows.forEach((img) => {
      const filePath = path.join(UPLOAD_DIR, img.filename);
      fs.unlink(filePath, () => {});
    });

    await pool.query("DELETE FROM items WHERE id = $1", [id]);

    req.flash("success", "Publicación eliminada.");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error al eliminar item:", err);
    req.flash("error", "Ocurrió un error al eliminar la publicación.");
    res.redirect("/dashboard");
  }
}

async function deleteImage(req, res) {
  const { id, imageId } = req.params;
  try {
    const itemResult = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
    if (!itemResult.rows.length || itemResult.rows[0].user_id !== req.session.user.id) {
      req.flash("error", "No tienes permiso para esta acción.");
      return res.redirect(`/items/${id}/edit`);
    }

    const imageResult = await pool.query("SELECT * FROM item_images WHERE id = $1 AND item_id = $2", [imageId, id]);
    if (imageResult.rows.length) {
      fs.unlink(path.join(UPLOAD_DIR, imageResult.rows[0].filename), () => {});
      await pool.query("DELETE FROM item_images WHERE id = $1", [imageId]);
    }

    res.redirect(`/items/${id}/edit`);
  } catch (err) {
    console.error("Error al eliminar imagen:", err);
    res.redirect(`/items/${id}/edit`);
  }
}

module.exports = { index, show, newForm, create, editForm, update, resolve, destroy, deleteImage };
