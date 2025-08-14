
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const PropertyController = require('../controllers/PropertyController');
const PropertyValidation = require('../validation/PropertyValidation');
const hasPermissionMiddleware = require('../middleware/hasPermissionMiddleware');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'property_brochure') {
            cb(null, 'uploads/property_brochure'); // Make sure this folder exists
        } else if (file.fieldname === 'property_image') {
            cb(null, 'uploads/property_image'); // Make sure this folder exists
        }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}${ext}`);
    }
});

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
const allowedBrochureTypes = ['application/pdf'];

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'property_brochure') {
        if (allowedBrochureTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid brochure file type. Only PDF files are allowed.'), false);
        }
    } else if (file.fieldname === 'property_image') {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image type. Only JPG, JPEG and PNG images are allowed.'), false);
        }
    } else {
        cb(new Error('Unexpected field.'), false);
    }
};


const upload = multer({ 
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

const handleFileUpload = (req, res, next) => {
    const uploadFields = upload.fields([
        { name: 'property_brochure', maxCount: 1 },
        { name: 'property_image', maxCount: 1 }
    ]);
    uploadFields(req, res, (err) => {
        const imageFile = req.files?.['property_image']?.[0];
        const brochureFile = req.files?.['property_brochure']?.[0];
        if (err instanceof multer.MulterError) {
            return res.status(200).json({
                status: false,
                errors: [{ path: err.field || 'file', msg: err.message }]
            });
        } else if (err) {
            return res.status(200).json({
                status: false,
                errors: [{ path: 'file', msg: err.message }]
            });
        }

        // ✅ Manual size checks
        const errors = [];

        if (imageFile && imageFile.size > 2 * 1024 * 1024) {
            errors.push({ path: 'property_image', msg: 'Image exceeds 2MB limit.' });
            fs.unlinkSync(imageFile.path); // delete invalid file
        }

        if (brochureFile && brochureFile.size > 10 * 1024 * 1024) {
            errors.push({ path: 'property_brochure', msg: 'Brochure exceeds 10MB limit.' });
            fs.unlinkSync(brochureFile.path); // delete invalid file
        }

        if (errors.length > 0) {
            return res.status(200).json({
                status: false,
                errors
            });
        }
 
        next();
    });
};

router.get('/', authenticateToken, 
    hasPermissionMiddleware(['property-list','property-view']), 
    PropertyController.index);

router.get('/export-csv', authenticateToken, 
    hasPermissionMiddleware(['property-export']), 
    PropertyController.exportCsv);

router.get('/export-pdf', authenticateToken, 
    hasPermissionMiddleware(['property-export']), 
    PropertyController.exportPdf);

router.get('/:id', authenticateToken, 
    hasPermissionMiddleware(['property-list','property-view']), 
    PropertyController.show);

router.post('/create', authenticateToken, hasPermissionMiddleware(['property-create']), 
    handleFileUpload, PropertyValidation.propertyValidationRules, PropertyController.store );

router.put('/edit/:id', authenticateToken, hasPermissionMiddleware(['property-edit']), 
    handleFileUpload, PropertyValidation.propertyValidationRules, PropertyController.update );

router.delete('/delete/:id', authenticateToken, 
    hasPermissionMiddleware(['property-delete']), PropertyController.destroy );

router.post('/:id/save', authenticateToken, PropertyController.toggleSaveProperty);

module.exports = router;