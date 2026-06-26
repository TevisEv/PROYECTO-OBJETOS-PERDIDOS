const express = require("express");
const router = express.Router();
const itemsController = require("../controllers/items.controller");
const commentsController = require("../controllers/comments.controller");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router.get("/", itemsController.index);
router.get("/new", requireAuth, itemsController.newForm);
router.post("/", requireAuth, upload.array("images", 4), itemsController.create);
router.get("/:id", itemsController.show);
router.get("/:id/edit", requireAuth, itemsController.editForm);
router.put("/:id", requireAuth, upload.array("images", 4), itemsController.update);
router.post("/:id/resolve", requireAuth, itemsController.resolve);
router.delete("/:id", requireAuth, itemsController.destroy);
router.delete("/:id/images/:imageId", requireAuth, itemsController.deleteImage);
router.post("/:id/comments", requireAuth, commentsController.create);
router.delete("/:id/comments/:commentId", requireAuth, commentsController.destroy);

module.exports = router;
