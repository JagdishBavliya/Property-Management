const { validationResult } = require('express-validator');
const RolePermissionService = require('../services/RolePermissionService');
const db = require('../config/db');
const fs = require('fs-extra');
const path = require('path');
const { Parser } = require('json2csv');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const { uniqueCode } = require('./ApiController');
const URL = process.env.URL;
const PORT = process.env.PORT;
const mainUrl = `${URL}:${PORT}/`;

async function removeFile(filePath) {
    if (filePath) {
        try {
            const fullPath = path.join(__dirname, '..', filePath);
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
                console.log('Local file removed successfully');
            }
        } catch (err) {
            console.error('Error removing local file:', err);
        }
    }
}

async function deletePropertyFile(fileUrl) {
    try {
        if (fileUrl) {
            const urlParts = fileUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            
            let filePath;
            if (fileUrl.includes('property_image')) {
                filePath = path.join(__dirname, '../uploads/property_image', fileName);
            } else if (fileUrl.includes('property_brochure')) {
                filePath = path.join(__dirname, '../uploads/property_brochure', fileName);
            } else {
                return;
            }
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        }
    } catch (error) {
        console.error('Error deleting property file:', error);
    }
}

async function formateDate(date) {
    date = new Date(date);
    return date.toLocaleString("en-US", { day: "2-digit", month: "2-digit", year: "numeric"});
}

exports.index = async (req, res) => {
    const { page, limit, search, p_name, city, p_type, ag_code, property_code } = req.query;
    const role = req.user.role;
    
    const hasPagination = page !== undefined || limit !== undefined;    
    const currentPage = hasPagination ? (parseInt(page) || 1) : 1;
    const currentLimit = hasPagination ? (parseInt(limit) || 9) : null;
    const offset = hasPagination ? (currentPage - 1) * currentLimit : 0;
    
    try {
        let baseQuery = `SELECT p.* FROM properties p 
                        LEFT JOIN agents a ON p.agent_code = a.agent_code`;
        let conditions = [];
        let values = [];

        if (role === 'super admin' || role === "Super Admin") {
            // No extra where clause - can see all properties
        } else if (role === 'admin' || role === "Admin") {
            conditions.push('a.admin_code = ?');
            values.push(req.user.code);
        } else if (role === 'manager' || role === "Manager") {
            conditions.push('a.manager_code = ?');
            values.push(req.user.code);
        } else if (role === 'agent' || role === "Agent") {
            conditions.push('p.agent_code = ?');
            values.push(req.user.code);
        } else {
            return res.status(403).json({ status: false, msg: 'Not authorized' });
        }

        if (search && search.trim()) {
            conditions.push('(p.property_name LIKE ? OR p.city LIKE ? OR p.agent_code LIKE ? OR p.property_code LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (p_name && p_name.trim()) {
            conditions.push(`p.property_name LIKE ?`);
            values.push(`%${p_name.trim()}%`);
        }
        if (city && city.trim()) {
            conditions.push(`p.city = ?`);
            values.push(city.trim());
        }
        if (p_type && p_type.trim()) {
            conditions.push(`p.property_type = ?`);
            values.push(p_type.trim());
        }
        if (ag_code && ag_code.trim()) {
            conditions.push(`p.agent_code = ?`);
            values.push(ag_code.trim());
        }
        if (property_code && property_code.trim()) {
            conditions.push(`p.property_code = ?`);
            values.push(property_code.trim());
        }

        // Add WHERE clause if conditions exist
        if (conditions.length > 0) {
            const whereClause = ` WHERE ` + conditions.join(' AND ');
            baseQuery += whereClause;
        }

        // Apply pagination only if pagination parameters are provided
        let finalQuery = baseQuery;
        let finalValues = [...values];
        let pagination = null;
        
        if (hasPagination) {
            finalQuery += ` LIMIT ? OFFSET ?`;
            finalValues.push(currentLimit, offset);
        }

        const [properties] = await db.query(finalQuery, finalValues);
        
        if (hasPagination) {
            // Get total count for pagination with same JOIN and filtering
            let countQuery = `SELECT COUNT(*) AS count FROM properties p 
                             LEFT JOIN agents a ON p.agent_code = a.agent_code`;
            if (conditions.length > 0) {
                const whereClause = ` WHERE ` + conditions.join(' AND ');
                countQuery += whereClause;
            }
            const [countResult] = await db.query(countQuery, values);
            const totalProperties = countResult[0]?.count || 0;
            const totalPages = Math.ceil(totalProperties / currentLimit);
            
            pagination = {
                current_page: currentPage,
                per_page: currentLimit,
                total: totalProperties,
                total_pages: totalPages,
                has_next_page: currentPage < totalPages,
                has_prev_page: currentPage > 1
            };
        }

        return res.status(200).json({
            status: true,
            properties: properties,
            pagination: pagination
        });
    } catch (error) {
        console.error('Error in list property:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.exportCsv = async (req, res) => {
    const {search, p_name, city, p_type, ag_code, property_code} = req.query;
    const role = req.user.role;
    
    try {
        let baseQuery = `SELECT p.* FROM properties p 
                        LEFT JOIN agents a ON p.agent_code = a.agent_code`;
        let conditions = [];
        let values = [];

        if (role === 'super admin' || role === "Super Admin") {
            // No extra where clause - can see all properties
        } else if (role === 'admin' || role === "Admin") {
            conditions.push('a.admin_code = ?');
            values.push(req.user.code);
        } else if (role === 'manager' || role === "Manager") {
            conditions.push('a.manager_code = ?');
            values.push(req.user.code);
        } else if (role === 'agent' || role === "Agent") {
            conditions.push('p.agent_code = ?');
            values.push(req.user.code);
        } else {
            return res.status(403).json({ status: false, msg: 'Not authorized' });
        }

        if (search && search.trim()) {
            conditions.push('(p.property_name LIKE ? OR p.city LIKE ? OR p.agent_code LIKE ? OR p.property_code LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (p_name) {
            conditions.push(`p.property_name LIKE ?`);
            values.push(`%${p_name}%`);
        }
        if (city) {
            conditions.push(`p.city = ?`);
            values.push(city);
        }
        if (p_type) {
            conditions.push(`p.property_type = ?`);
            values.push(p_type);
        }
        if (ag_code) {
            conditions.push(`p.agent_code = ?`);
            values.push(ag_code);
        }
        if (property_code) {
            conditions.push(`p.property_code = ?`);
            values.push(property_code);
        }
        if (conditions.length > 0) {
            const whereClause = ` WHERE ` + conditions.join(' AND ');
            baseQuery += whereClause;
        }
        const [properties] = await db.query(baseQuery, values);
        
        const exportData = await Promise.all(properties.map(async (property) => {
            return {
                "Id": property.id,
                "Property Code": property.property_code,
                "Property Name": property.property_name,
                "Area": property.area,
                "City": property.city,
                "Property Type": property.property_type,
                "Number Of Units": property.number_of_units,
                "Property Size": property.property_size,
                "Property Rate": property.property_rate,
                "Seller Name": property.seller_name,
                "Seller Mobile": property.seller_mobile,
                "Buyer Name": property.buyer_name,
                "Buyer Mobile": property.buyer_mobile,
                "Seller Brokerage Type": property.seller_brokerage_type,
                "Seller Brokerage Value": property.seller_brokerage_value,
                "Buyer Brokerage Type": property.buyer_brokerage_type,
                "Buyer Brokerage Value": property.buyer_brokerage_value,
                "Full Deal Amount": property.full_deal_amount,
                "Agent Code": property.agent_code,
                "Video Link": property.video_link,
                "Created At": await formateDate(property.created_at),
                "Updated At": await formateDate(property.updated_at),
            };
        }));
        

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(exportData);

        res.header('Content-Type', 'text/csv');
        res.attachment('properties.csv');
        return res.send(csv);
    } catch (error) {
        console.error('Error in Export property:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.exportPdf = async (req, res) => {
    const {search, p_name, city, p_type, ag_code, property_code} = req.query;
    const role = req.user.role;
    
    try {
        let baseQuery = `SELECT p.* FROM properties p 
                        LEFT JOIN agents a ON p.agent_code = a.agent_code`;
        let conditions = [];
        let values = [];

        if (role === 'super admin' || role === "Super Admin") {
            // No extra where clause - can see all properties
        } else if (role === 'admin' || role === "Admin") {
            conditions.push('a.admin_code = ?');
            values.push(req.user.code);
        } else if (role === 'manager' || role === "Manager") {
            conditions.push('a.manager_code = ?');
            values.push(req.user.code);
        } else if (role === 'agent' || role === "Agent") {
            conditions.push('p.agent_code = ?');
            values.push(req.user.code);
        } else {
            return res.status(403).json({ status: false, msg: 'Not authorized' });
        }

        if (search && search.trim()) {
            conditions.push('(p.property_name LIKE ? OR p.city LIKE ? OR p.agent_code LIKE ? OR p.property_code LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (p_name) {
            conditions.push(`p.property_name LIKE ?`);
            values.push(`%${p_name}%`);
        }
        if (city) {
            conditions.push(`p.city = ?`);
            values.push(city);
        }
        if (p_type) {
            conditions.push(`p.property_type = ?`);
            values.push(p_type);
        }
        if (ag_code) {
            conditions.push(`p.agent_code = ?`);
            values.push(ag_code);
        }
        if (property_code) {
            conditions.push(`p.property_code = ?`);
            values.push(property_code);
        }
        if (conditions.length > 0) {
            const whereClause = ` WHERE ` + conditions.join(' AND ');
            baseQuery += whereClause;
        }
        const [properties] = await db.query(baseQuery, values);
        // Render HTML from EJS template
        const html = await ejs.renderFile(path.join(__dirname, '../views/propertyPdfTemplate.ejs'), { properties });
        // Launch headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            landscape: true,
            scale: 0.8, // adjust between 0.5 - 1.0 as needed
        });

        await browser.close();

        // Send PDF to client
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=export.pdf',
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error in Export property:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.show = async (req, res) => {
    try {
        const pId = req.params.id;
        const userId = req.user.id;
        const role = req.user.role;
        
        let baseQuery = `SELECT p.* FROM properties p 
                        LEFT JOIN agents a ON p.agent_code = a.agent_code 
                        WHERE p.id = ?`;
        let conditions = [];
        let values = [pId];

        // Role-based filtering with proper conditions
        if (role === 'super admin' || role === "Super Admin") {
            // No extra where clause - can see all properties
        } else if (role === 'admin' || role === "Admin") {
            conditions.push('a.admin_code = ?');
            values.push(req.user.code);
        } else if (role === 'manager' || role === "Manager") {
            conditions.push('a.manager_code = ?');
            values.push(req.user.code);
        } else if (role === 'agent' || role === "Agent") {
            conditions.push('p.agent_code = ?');
            values.push(req.user.code);
        } else {
            return res.status(403).json({ status: false, msg: 'Not authorized' });
        }

        // Add additional role-based conditions to the query
        if (conditions.length > 0) {
            baseQuery += ' AND ' + conditions.join(' AND ');
        }
        
        baseQuery += ' LIMIT 1';
        
        const [rows] = await db.query(baseQuery, values);
        const pInfo = rows[0];
        if(!pInfo) return res.status(200).json({ status:false, msg:'Property not found' });

        const [savedRows] = await db.query('SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?', [userId, pId]);
        pInfo.is_saved = savedRows.length > 0;

        return res.status(200).json({ status:true, msg:'Property retrive successfully', data: pInfo});
    } catch (error) {
        console.error('Error in view property:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.store = async (req, res) => {
    try {
        let  brochurePath = req.files && req.files.property_brochure ? req.files.property_brochure[0].path : '';
        let  imagePath = req.files && req.files.property_image ? req.files.property_image[0].path : '';
        const userRoles = await RolePermissionService.authUserRole(req.user.id);
        let property_brochure = brochurePath ? brochurePath.replace(/\\/g, "/") : '';
        let property_image = imagePath ? imagePath.replace(/\\/g, "/") : '';
        
        let agent_code = '';
        // Super Admin (1), Admin (2), Manager (3) can select agent from form
        if([1,2,3].includes(userRoles[0].id)){
            if(!req.body.agent_code){
                let error = [{path:'agent_code', msg: 'The agent field is required'}];
                if(property_brochure) await removeFile(property_brochure);
                if(property_image) await removeFile(property_image);
                return res.status(200).json({ status:false, errors: error });
            }
            agent_code = req.body.agent_code;
        }else{
            const [rows] = await db.query(`SELECT user_code FROM users WHERE id=?`, req.user.id);
            const authUserInfo = rows[0];
            if(!authUserInfo){
                if(property_brochure) await removeFile(property_brochure);
                if(property_image) await removeFile(property_image);
                return res.status(200).json({ status:false, msg: 'Something went wrong' });
            }
            agent_code = authUserInfo.user_code;
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if(property_brochure) await removeFile(property_brochure);
            if(property_image) await removeFile(property_image);
            return res.status(200).json({ status:false, errors: errors.array() });
        }
        let  { property_name, area, city, property_type, number_of_units, property_size, property_rate,
            seller_name, seller_mobile, buyer_name, buyer_mobile, seller_brokerage_type, seller_brokerage_value, 
            buyer_brokerage_type, buyer_brokerage_value, full_deal_amount, video_link } = req.body;
        
        property_brochure = (property_brochure) ? mainUrl+property_brochure : null;
        property_image = (property_image) ? mainUrl+property_image : null;
        
        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' '); 
        const propertyCode = await uniqueCode('PROP');

        const insertQuery = `INSERT INTO properties (property_code, property_name, area, city, property_type, number_of_units, property_size,
                    property_rate, seller_name, seller_mobile, buyer_name, buyer_mobile, seller_brokerage_type, seller_brokerage_value,
                    buyer_brokerage_type, buyer_brokerage_value, full_deal_amount, agent_code, property_image, property_brochure, video_link,
                    created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertValues = [propertyCode, property_name, area, city, property_type, number_of_units, property_size,
            property_rate, seller_name, seller_mobile, buyer_name, buyer_mobile, seller_brokerage_type, seller_brokerage_value,
            buyer_brokerage_type, buyer_brokerage_value, full_deal_amount, agent_code, property_image, property_brochure, video_link,
            nowUtc, nowUtc
        ];
        const [result] = await db.query(insertQuery, insertValues);
        return res.status(200).json({ status:true, msg: 'Property added successfully' });
    }catch (error) {
        console.error('Error in store property:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.update = async (req, res) => {
    try {
        const pId = req.params.id;
        const [rows] = await db.query(`SELECT * FROM properties WHERE id = ? LIMIT 1`, [pId]);
        const pInfo = rows[0];
        if(!pInfo) return res.status(200).json({ status:false, msg:'Property not found' });

        let  brochurePath = req.files && req.files.property_brochure ? req.files.property_brochure[0].path : '';
        let  imagePath = req.files && req.files.property_image ? req.files.property_image[0].path : '';
        
        const userRoles = await RolePermissionService.authUserRole(req.user.id);
        let property_brochure = brochurePath ? brochurePath.replace(/\\/g, "/") : '';
        let property_image = imagePath ? imagePath.replace(/\\/g, "/") : '';

        let agent_code = '';
        // Super Admin (1), Admin (2), Manager (3) can select agent from form
        if([1,2,3].includes(userRoles[0].id)){
            if(!req.body.agent_code){
                let error = [{path:'agent_code', msg: 'The agent field is required'}];
                if(property_brochure) await removeFile(property_brochure);
                if(property_image) await removeFile(property_image);
                return res.status(200).json({ status:false, errors: error });
            }
            agent_code = req.body.agent_code;
        }else{
            const [rows] = await db.query(`SELECT user_code FROM users WHERE id=?`, req.user.id);
            const authUserInfo = rows[0];
            if(!authUserInfo){
                if(property_brochure) await removeFile(property_brochure);
                if(property_image) await removeFile(property_image);
                return res.status(200).json({ status:false, msg: 'Something went wrong' });
            }
            agent_code = authUserInfo.user_code;
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if(property_brochure) await removeFile(property_brochure);
            if(property_image) await removeFile(property_image);
            return res.status(200).json({ status:false, errors: errors.array() });
        }

        // Delete old files only if new files are being uploaded
        if(property_brochure && pInfo.property_brochure) {
            await deletePropertyFile(pInfo.property_brochure);
        }
        if(property_image && pInfo.property_image) {
            await deletePropertyFile(pInfo.property_image);
        }

        if(!property_image){
            property_image = pInfo.property_image;
        }else{
            property_image = mainUrl+property_image;
        }

        if(!property_brochure){
            property_brochure = pInfo.property_brochure;
        }else {
            property_brochure = mainUrl+property_brochure;
        }

        let  { property_name, area, city, property_type, number_of_units, property_size, property_rate,
            seller_name, seller_mobile, buyer_name, buyer_mobile, seller_brokerage_type, seller_brokerage_value, 
            buyer_brokerage_type, buyer_brokerage_value, full_deal_amount, video_link } = req.body;
        
        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' '); 
        
        // Check if property_code is null or empty, then generate new code
        let propertyCode = pInfo.property_code;
        if (!pInfo.property_code || pInfo.property_code === null || pInfo.property_code === '') {
            propertyCode = await uniqueCode('PROP');
        }

        const updateQuery = `UPDATE properties SET property_code = ?, property_name = ?, area = ?, city = ?, property_type = ?, number_of_units = ?, property_size = ?,
                            property_rate = ?, seller_name = ?, seller_mobile = ?, buyer_name = ?, buyer_mobile = ?, seller_brokerage_type = ?, seller_brokerage_value = ?,
                            buyer_brokerage_type = ?, buyer_brokerage_value = ?, full_deal_amount = ?, agent_code = ?, property_brochure = ?, property_image = ?, video_link = ?,
                            updated_at = ? WHERE id = ?`;

        const updateValues = [propertyCode, property_name, area, city, property_type, number_of_units, property_size,
            property_rate, seller_name, seller_mobile, buyer_name, buyer_mobile, seller_brokerage_type, seller_brokerage_value,
            buyer_brokerage_type, buyer_brokerage_value, full_deal_amount, agent_code, property_brochure, property_image, video_link,
            nowUtc, pId
        ];
        const [result] = await db.query(updateQuery, updateValues);

        return res.status(200).json({ status:true, msg: 'Property updated successfully'});
    }catch (error) {
        console.error('Error in store property:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.destroy = async (req, res) => {
    try {
        const pId = req.params.id;
        const [rows] = await db.query(`SELECT * FROM properties WHERE id = ? LIMIT 1`, [pId]);
        const pInfo = rows[0];
        if(!pInfo) return res.status(200).json({ status:false, msg:'Property not found' });

        const [rowsDelete] = await db.query(`DELETE FROM properties WHERE id = ?`, [pId]);
        
        // Delete property files from folders
        await deletePropertyFile(pInfo.property_brochure);
        await deletePropertyFile(pInfo.property_image);

        return res.status(200).json({ status:true, msg: 'Property deleted successfully'});
    } catch (error) {
        console.error('Error in delete property:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.toggleSaveProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;
        const userId = req.user.id;

        // Check if the property exists
        const [propertyRows] = await db.query('SELECT id FROM properties WHERE id = ?', [propertyId]);
        if (propertyRows.length === 0) {
            return res.status(404).json({ status: false, msg: 'Property not found' });
        }

        // Check if the user has already saved the property
        const [savedRows] = await db.query('SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?', [userId, propertyId]);

        if (savedRows.length > 0) {
            // Property is already saved, so unsave it (delete the record)
            await db.query('DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?', [userId, propertyId]);
            return res.status(200).json({ status: true, saved: false, msg: 'Property removed from saved list.' });
        } else {
            // Property is not saved, so save it (insert a new record)
            const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.query('INSERT INTO saved_properties (user_id, property_id, created_at) VALUES (?, ?, ?)', [userId, propertyId, nowUtc]);
            return res.status(200).json({ status: true, saved: true, msg: 'Property added to saved list.' });
        }
    } catch (error) {
        console.error('Error in toggleSaveProperty:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};