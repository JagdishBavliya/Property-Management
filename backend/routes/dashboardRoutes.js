const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const hasPermissionMiddleware = require('../middleware/hasPermissionMiddleware');

// Dashboard statistics routes
router.get('/stats', authMiddleware, DashboardController.getDashboardStats);
router.get('/property/stats', authMiddleware, DashboardController.getPropertyStats);
router.get('/users/agents/stats', authMiddleware, DashboardController.getAgentStats);
router.get('/brokerage/stats', authMiddleware, DashboardController.getBrokerageStats);

module.exports = router; 