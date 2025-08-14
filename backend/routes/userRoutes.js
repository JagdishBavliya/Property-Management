const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UserController = require('../controllers/UserController');
const authenticateToken = require('../middleware/authMiddleware');
const hasPermissionMiddleware = require('../middleware/hasPermissionMiddleware');

// Ensure avatars directory exists
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarsDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
    }
});
const avatarUpload = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
        }
    }
});

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('roles').isArray({ min: 1 }).withMessage('At least one role must be selected.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
];

const updateValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('roles').isArray({ min: 1 }).withMessage('At least one role must be selected.'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirm_password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Confirm password must be at least 6 characters long'),
];

const userListPermission = ['admin-list', 'admin-create', 'admin-edit', 'admin-delete', 'admin-view', 'manager-list', 'manager-create', 'manager-edit', 'manager-delete', 'manager-view', 'agent-list', 
    'agent-create', 'agent-edit', 'agent-delete', 'agent-view', 'brokerage-list', 'brokerage-view'];
const userCreatePermission = ['admin-create', 'manager-create', 'agent-create'];
const userUpdatePermission = ['admin-edit', 'manager-edit', 'agent-edit'];
const userDeletePermission = ['admin-delete', 'manager-delete', 'agent-delete'];
    
router.get('/', authenticateToken, hasPermissionMiddleware(userListPermission), UserController.index);
router.get('/all', authenticateToken, hasPermissionMiddleware(userListPermission),UserController.getUsers);
router.post('/create', authenticateToken, hasPermissionMiddleware(userCreatePermission), registerValidation, UserController.store);
router.put('/update/:id', authenticateToken, hasPermissionMiddleware(userUpdatePermission), updateValidation, UserController.update);
router.delete('/delete/:id', authenticateToken, hasPermissionMiddleware(userDeletePermission), UserController.delete);
router.delete('/delete-agent/:agent_code', UserController.deleteAgentByAgentCode);
router.delete('/delete-manager/:manager_code', UserController.deleteManagerByManagerCode);
router.get('/admins-dropdown', authenticateToken, hasPermissionMiddleware(userListPermission), UserController.getAllAdmins);
router.get('/all-managers',authenticateToken, hasPermissionMiddleware(userListPermission), UserController.getAllManagers);
router.get('/managers-for-current-user', authenticateToken, UserController.getManagersForCurrentUser);
router.get('/agents-for-current-user', authenticateToken, UserController.getAgentsForCurrentUser);
router.get('/saved-properties', [authenticateToken], UserController.getSavedProperties);

// Profile update routes (users can update their own profile)
router.put('/update-profile/:id', authenticateToken, UserController.updateProfile);
router.post('/update-avatar/:id', authenticateToken, avatarUpload.single('avatar'), UserController.updateAvatar);

router.get('/:id', authenticateToken, UserController.getUserProfile);
module.exports = router;