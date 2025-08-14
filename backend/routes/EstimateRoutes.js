const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const EstimateController = require('../controllers/EstimateController');
const hasPermissionMiddleware = require('../middleware/hasPermissionMiddleware');

router.get('/', authenticateToken, hasPermissionMiddleware(['estimate-list']), EstimateController.list);
router.get('/export/csv', authenticateToken, EstimateController.exportCSV);
router.get('/export/pdf', authenticateToken, EstimateController.exportPDF);
router.get('/:id', authenticateToken, hasPermissionMiddleware(['estimate-view']), EstimateController.show);
router.post('/', authenticateToken, hasPermissionMiddleware(['estimate-create']), EstimateController.create);
router.put('/:id', authenticateToken, hasPermissionMiddleware(['estimate-edit']), EstimateController.update);
router.delete('/:id', authenticateToken, hasPermissionMiddleware(['estimate-delete']), EstimateController.delete);

module.exports = router;