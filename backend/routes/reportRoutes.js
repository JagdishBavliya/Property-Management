const express = require("express")
const router = express.Router()
const authenticateToken = require("../middleware/authMiddleware")
const ReportController = require("../controllers/ReportController")

// All routes require authentication
router.use(authenticateToken)

// Report endpoints
router.get("/property", ReportController.getPropertyReports)
router.get("/agent", ReportController.getAgentReports)
router.get("/manager", ReportController.getManagerReports)
router.get("/brokerage", ReportController.getBrokerageReports)
router.get("/visit", ReportController.getVisitReports)

// Export functionality
router.get("/export/csv", ReportController.exportReportsCSV)
router.get("/export/pdf", ReportController.exportReportsPDF)

module.exports = router
