const express = require('express');
const router = express.Router();
const ApiController = require('../controllers/ApiController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/roles', authenticateToken, ApiController.getRole);
router.get('/permissions', authenticateToken, ApiController.getPermission);
router.get('/role/:id/permission', authenticateToken, ApiController.getRolePermissions);
router.put('/roles/:id/permissions', authenticateToken, ApiController.updateRolePermissions);

module.exports = router;
