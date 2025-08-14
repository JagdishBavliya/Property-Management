const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const hasPermissionMiddleware = require('../middleware/hasPermissionMiddleware');
const BrokerageController = require('../controllers/BrokerageController');

// Validation rules for creating/updating a brokerage
const brokerageValidationRules = [
  body('property_code').notEmpty().withMessage('Property code is required'),
  body('agent_code').notEmpty().withMessage('Agent code is required'),
  body('total_brokerage').notEmpty().withMessage('Total brokerage is required'),
  body('mode_of_payment').notEmpty().withMessage('Mode of payment is required'),
  body('agent_commission').notEmpty().withMessage('Agent commission is required'),
  body('manager_commission_type').notEmpty().withMessage('Manager commission type is required'),
  body('manager_commission_value').notEmpty().withMessage('Manager commission value is required'),
  // notes is optional
];

router.get('/', authenticateToken, hasPermissionMiddleware(['brokerage-list','brokerage-create','brokerage-edit','brokerage-delete','brokerage-view']), BrokerageController.index);
router.get('/:id', authenticateToken, hasPermissionMiddleware(['brokerage-list','brokerage-create','brokerage-edit','brokerage-delete','brokerage-view']), BrokerageController.show);
router.post('/create', authenticateToken, hasPermissionMiddleware(['brokerage-create']), brokerageValidationRules, BrokerageController.store);
router.put('/edit/:id', authenticateToken, hasPermissionMiddleware(['brokerage-edit']), brokerageValidationRules, BrokerageController.update);
router.delete('/delete/:id', authenticateToken, hasPermissionMiddleware(['brokerage-delete']), BrokerageController.destroy);

module.exports = router;
