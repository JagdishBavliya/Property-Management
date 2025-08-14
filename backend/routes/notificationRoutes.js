const express = require("express")
const router = express.Router()
const authenticateToken = require("../middleware/authMiddleware")
const NotificationController = require("../controllers/NotificationController")

// All routes require authentication
router.use(authenticateToken)

// Main notification routes
router.get("/", NotificationController.list)
router.post("/", NotificationController.create)
router.put("/:id/read", NotificationController.markAsRead)
router.delete("/:id", NotificationController.delete)

// Bulk actions
router.post("/bulk-read", NotificationController.bulkMarkAsRead)
router.post("/bulk-delete", NotificationController.bulkDelete)

// Statistics and reports
router.get("/stats", NotificationController.getStats)
router.get("/export/csv", NotificationController.exportCSV)
router.get("/export/pdf", NotificationController.exportPDF)

module.exports = router
