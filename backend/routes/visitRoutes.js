const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const VisitController = require("../controllers/VisitController");
const hasPermissionMiddleware = require('../middleware/hasPermissionMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Visit CRUD
router.get("/", hasPermissionMiddleware(['visit-list']), VisitController.list);
router.post("/", hasPermissionMiddleware(['visit-create']), VisitController.create);
router.put("/:id", hasPermissionMiddleware(['visit-edit']), VisitController.update);
router.delete("/:id", hasPermissionMiddleware(['visit-delete']), VisitController.delete);

// Statistics and reports
router.get("/stats", VisitController.getStats);
router.get("/export/csv", VisitController.exportCSV);
router.get("/export/pdf", VisitController.exportPDF);

// Single visit details
router.get("/:id", VisitController.getById);

module.exports = router;
 