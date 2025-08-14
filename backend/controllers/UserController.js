const db = require('../config/db');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const RolePermissionService = require('../services/RolePermissionService');
const { uniqueCode } = require('./ApiController');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL;
const PORT = process.env.PORT;
const mainUrl = `${URL}:${PORT}`;

async function managerExists(connection, userId) {
    const [rows] = await connection.query('SELECT 1 FROM managers WHERE user_id = ? LIMIT 1', [userId]);
    return rows.length > 0;
}
async function agentExists(connection, userId) {
    const [rows] = await connection.query('SELECT 1 FROM agents WHERE user_id = ? LIMIT 1', [userId]);
    return rows.length > 0;
}

async function deleteUserAvatarFile(connection, userId) {
    try {
        // Get user's current avatar URL
        const [userRows] = await connection.query('SELECT avatar FROM users WHERE id = ? LIMIT 1', [userId]);
        if (userRows.length > 0 && userRows[0].avatar) {
            const avatarUrl = userRows[0].avatar;
            
            // Extract filename from URL
            const urlParts = avatarUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = path.join(__dirname, '../uploads/avatars', fileName);
            
            // Check if file exists and delete it
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Avatar deleted: ${filePath}`);
            }
        }
    } catch (error) {
        console.error('Error deleting avatar file:', error);
        // Don't throw error, just log it - we don't want to stop user deletion
    }
}

function _getUserCodePrefix(roleNames) {
    if (roleNames.includes('super admin')) return 'SADM';
    if (roleNames.includes('admin')) return 'ADM';
    if (roleNames.includes('manager')) return 'MNG';
    if (roleNames.includes('agent')) return 'AGT';
    return 'USR'; // Default prefix
}

exports.index = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { search, name, email, phone, role, user_code } = req.query;

        let whereConditions = [];
        let whereValues = [];
        if (search && search.trim()) {
            whereConditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR user_code LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            whereValues.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (name && name.trim()) {
            whereConditions.push('name LIKE ?');
            whereValues.push(`%${name.trim()}%`);
        }
        if (email && email.trim()) {
            whereConditions.push('email LIKE ?');
            whereValues.push(`%${email.trim()}%`);
        }
        if (phone && phone.trim()) {
            whereConditions.push('phone LIKE ?');
            whereValues.push(`%${phone.trim()}%`);
        }
        if (user_code && user_code.trim()) {
            whereConditions.push('user_code LIKE ?');
            whereValues.push(`%${user_code.trim()}%`);
        }
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const [countRows] = await db.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, whereValues);
        const totalUsers = countRows[0].total;
        const totalPages = Math.ceil(totalUsers / limit);

        const [rows] = await db.query(`SELECT * FROM users ${whereClause} LIMIT ? OFFSET ?`, [...whereValues, limit, offset]);        
        // Batch fetch roles for all user ids
        const userIds = rows.map(row => row.id);
        let userRolesMap = {};
        if (userIds.length > 0) {
            const [roleRows] = await db.query(
                'SELECT mhr.model_id as user_id, r.name as role_name FROM model_has_roles mhr JOIN roles r ON mhr.role_id = r.id WHERE mhr.model_id IN (?)',
                [userIds]
            );
            roleRows.forEach(r => {
                if (!userRolesMap[r.user_id]) userRolesMap[r.user_id] = [];
                userRolesMap[r.user_id].push({ name: r.role_name });
            });
        }
        const users = rows.map(row => ({
            ...row,
            roles: userRolesMap[row.id] || []
        }));

        let filteredUsers = users;
        if (role && role.trim()) {
            filteredUsers = users.filter(user => {
                if (!user.roles || !Array.isArray(user.roles)) return false;
                return user.roles.some(userRole => 
                    userRole.name && userRole.name.toLowerCase().includes(role.toLowerCase())
                );
            });
        }
        
        return res.status(200).json({ 
            status: true, 
            users: filteredUsers,
            pagination: {
                current_page: page,
                per_page: limit,
                total: totalUsers,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_prev_page: page > 1
            }
        });
    }catch (error) {
        console.error('Error in users index:', error);
        return res.status(500).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, name, email, phone, user_code, role } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClauses = ["u.id > 0"]; // Start with a non-empty condition
        let params = [];
        let joinClauses = "";

        if (search) {
            whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.user_code LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (name) { whereClauses.push('u.name LIKE ?'); params.push(`%${name.trim()}%`); }
        if (email) { whereClauses.push('u.email LIKE ?'); params.push(`%${email.trim()}%`); }
        if (phone) { whereClauses.push('u.phone LIKE ?'); params.push(`%${phone.trim()}%`); }
        if (user_code) { whereClauses.push('u.user_code LIKE ?'); params.push(`%${user_code.trim()}%`); }
        
        if (role) {
            joinClauses = `
                JOIN model_has_roles mhr ON u.id = mhr.model_id
                JOIN roles r ON mhr.role_id = r.id
            `;
            if (role.toLowerCase() === 'admin') {
                 whereClauses.push(`r.name = 'Admin'`);
            } else {
                whereClauses.push('r.name LIKE ?');
                params.push(`%${role.trim()}%`);
            }
        }
        
        const whereSql = whereClauses.join(' AND ');

        const countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u ${joinClauses} WHERE ${whereSql}`;
        const [countRows] = await db.query(countQuery, params);
        const totalUsers = countRows[0].total;
        const totalPages = Math.ceil(totalUsers / limit);

        const usersQuery = `
            SELECT u.*, GROUP_CONCAT(r.name) as roles
            FROM users u
            LEFT JOIN model_has_roles mhr ON u.id = mhr.model_id
            LEFT JOIN roles r ON mhr.role_id = r.id
            ${joinClauses ? '' : `WHERE ${whereSql}`}
            ${joinClauses ? `WHERE ${whereSql}` : ''}
            GROUP BY u.id
            ORDER BY u.id DESC
            LIMIT ? OFFSET ?
        `;
        
        const [users] = await db.query(usersQuery, [...params, parseInt(limit), offset]);
        const finalUsers = users.map(u => ({...u, roles: u.roles ? u.roles.split(',').map(name => ({name})) : [] }));
        
        return res.status(200).json({ 
            status: true, 
            users: finalUsers,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: totalUsers,
                total_pages: totalPages,
                has_next_page: parseInt(page) < totalPages,
                has_prev_page: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error in getUsers:', error);
        return res.status(500).json({ status:false, msg: 'Something went wrong' });
    }
};

exports.store = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(200).json({ status:false, errors: errors.array() });
    }
    let {name, phone, email, password, confirm_password, roles,
        agent_type = '', agent_salary = 0, commission = 0, commission_type = 'percent', overdraft = 0, balance = 0, manager_code = '', admin_code = ''
    } = req.body;
    
    agent_salary = Number(agent_salary) || 0;
    commission   = Number(commission)   || 0;
    overdraft    = Number(overdraft)    || 0;
    balance      = Number(balance)      || 0;

    if(password != confirm_password) return res.status(200).json({ status:false, errors: [{path:'password', msg: 'Password and confirm password do not match.'}] });

    const connection = await db.getConnection(); // For transaction
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        const user = rows[0];
        let error = [{path:'email', msg: 'Email has already been taken.'}];
        if(user) {
            await connection.release();
            return res.status(200).json({ status:false, errors: error });
        }
        
        // Generate unique user code based on roles
        const rolePlaceholders = roles.map(() => '?').join(',');
        const [roleRowsForCode] = await connection.query(
            `SELECT name FROM roles WHERE id IN (${rolePlaceholders})`,
            roles
        );

        const roleNamesForCode = roleRowsForCode.map(role => role.name.toLowerCase());
        const prefix = _getUserCodePrefix(roleNamesForCode);
        
        const userCode = await uniqueCode(prefix);
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
    
        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' '); 
        
        // Get role names for the provided role IDs
        const placeholders = roles.map(() => '?').join(',');
        const [roleRows] = await connection.query(
            `SELECT name FROM roles WHERE id IN (${placeholders})`,
            roles
        );
        const roleNames = roleRows.map(role => role.name.toLowerCase());
        
        // Generic insert for all users, including agents
        const insertQuery = `INSERT INTO users (name, email, phone, password, user_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const insertValues = [name, email, phone, hashedPassword, userCode, nowUtc, nowUtc];
        
        const [result] = await connection.query(insertQuery, insertValues);

        const insertedUserId = result.insertId;
        await RolePermissionService.assignRole(insertedUserId, roles, connection);

        // --- If Manager, insert into managers table ---
        if (roleNames.includes('manager')) {
            if (!(await managerExists(connection, insertedUserId))) {
                const managerCode = await uniqueCode('MNG');
                await connection.query('INSERT INTO managers (user_id, manager_code, admin_code) VALUES (?, ?, ?)',
                    [insertedUserId, managerCode, admin_code]
                );
                await connection.query('UPDATE users SET user_code = ? WHERE id = ?',
                    [managerCode, insertedUserId]
                );
            }
        }

        // --- If Agent, insert into agents table with all agent-specific fields ---
        if (roleNames.includes('agent')) {
            if (!(await agentExists(connection, insertedUserId))) {
                await connection.query(
                    `INSERT INTO agents 
                        (user_id, agent_code, manager_code, admin_code, agent_type, agent_salary, commission, commission_type, overdraft, balance) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [insertedUserId, userCode, manager_code, admin_code, agent_type, agent_salary, commission, commission_type, overdraft, balance]
                );
            }
        }

        await connection.commit();
        await connection.release();

        return res.status(200).json({ status:true, msg:'User created successfully', user_code: userCode });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            await connection.release();
        }
        console.error('Error in store user:', error);
        return res.status(200).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.update = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(200).json({ status:false, errors: errors.array() });
    }
    
    const userId = req.params.id;
    let {name, phone, email, password, confirm_password, roles} = req.body;
    
    // If either password or confirm_password is provided, validate both
    if ((password || confirm_password) && password !== confirm_password) {
        return res.status(400).json({ status:false, errors: [{path:'password', msg: 'Password and confirm password do not match.'}] });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if user exists
        const [userRows] = await connection.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        const existingUser = userRows[0];
        if(!existingUser) {
            await connection.release();
            return res.status(404).json({ status:false, msg: 'User not found' });
        }

        // Check if email is already taken by another user
        const [emailRows] = await connection.query('SELECT * FROM users WHERE email = ? AND id != ? LIMIT 1', [email, userId]);
        if(emailRows[0]) {
            await connection.release();
            return res.status(409).json({ status:false, errors: [{path:'email', msg: 'Email has already been taken.'}] });
        }

        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Prepare user update data
        let userUpdateData = { name, email, phone, updated_at: nowUtc };
        if(password && confirm_password) {
            const saltRounds = 10;
            userUpdateData.password = await bcrypt.hash(password, saltRounds);
        }

        if(roles) {
            await RolePermissionService.assignRole(userId, roles, connection);
            // Regenerate user_code if it's missing
            if (!existingUser.user_code) {
                const rolePlaceholders = roles.map(() => '?').join(',');
                const [roleRowsForCode] = await connection.query(
                    `SELECT name FROM roles WHERE id IN (${rolePlaceholders})`,
                    roles
                );
                const roleNamesForCode = roleRowsForCode.map(role => role.name.toLowerCase());
                userUpdateData.user_code = await uniqueCode(_getUserCodePrefix(roleNamesForCode));
            }
        }

        // Update users table
        const userFields = Object.keys(userUpdateData).map(field => `${field} = ?`).join(', ');
        await connection.query(`UPDATE users SET ${userFields} WHERE id = ?`, [...Object.values(userUpdateData), userId]);

        // Prepare and execute update for 'agents' table
        let agentUpdateData = {};
        if (req.body.agent_type !== undefined) agentUpdateData.agent_type = req.body.agent_type;
        if (req.body.agent_salary !== undefined) agentUpdateData.agent_salary = req.body.agent_salary;
        if (req.body.commission !== undefined) agentUpdateData.commission = req.body.commission;
        if (req.body.commission_type !== undefined) agentUpdateData.commission_type = req.body.commission_type;
        if (req.body.overdraft !== undefined) agentUpdateData.overdraft = req.body.overdraft;
        if (req.body.balance !== undefined) agentUpdateData.balance = req.body.balance;
        if (req.body.manager_code !== undefined) agentUpdateData.manager_code = req.body.manager_code;

        if(Object.keys(agentUpdateData).length > 0) {
            const agentFields = Object.keys(agentUpdateData).map(field => `${field} = ?`).join(', ');
            await connection.query(`UPDATE agents SET ${agentFields} WHERE user_id = ?`, [...Object.values(agentUpdateData), userId]);
        }

        await connection.commit();

        return res.status(200).json({ 
            status:true, 
            msg:'User updated successfully',
            user_code: userUpdateData.user_code || existingUser.user_code
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error in update user:', error);
        return res.status(500).json({ status:false, msg: 'Something went wrong' });
    } finally {
        if(connection) await connection.release();
    }
}

exports.getUserProfile = async (req, res) => {
    const userId = req.params.id;
    try {
        const query = `
            SELECT
                u.*,
                GROUP_CONCAT(DISTINCT r.name) as roles,
                GROUP_CONCAT(DISTINCT p.name) as permissions,
                MAX(a.agent_type) AS agent_type,
                MAX(a.agent_salary) AS agent_salary,
                MAX(a.commission) AS commission,
                MAX(a.commission_type) AS commission_type,
                MAX(a.overdraft) AS overdraft,
                MAX(a.balance) AS balance,
                MAX(m.manager_code) AS manager_code,
                MAX(m.admin_code) AS manager_admin_code,
                MAX(ag.manager_code) AS agent_manager_code,
                MAX(ag.admin_code) AS agent_admin_code
            FROM users u
            LEFT JOIN model_has_roles mhr ON u.id = mhr.model_id
            LEFT JOIN roles r ON mhr.role_id = r.id
            LEFT JOIN role_has_permissions rhp ON r.id = rhp.role_id
            LEFT JOIN permissions p ON rhp.permission_id = p.id
            LEFT JOIN agents a ON u.id = a.user_id
            LEFT JOIN managers m ON u.id = m.user_id
            LEFT JOIN agents ag ON u.id = ag.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `;
        const [rows] = await db.query(query, [userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ status: false, msg: 'User not found' });
        }

        const user = rows[0];
        
        // Clean up the user object
        const roles = user.roles ? user.roles.split(',') : [];
        const permissions = user.permissions ? user.permissions.split(',') : [];

        const userProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            user_code: user.user_code,
            avatar: user.avatar,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };

        const roleDetails = {};
        if (roles.includes('Agent')) {
            roleDetails.agent_type = user.agent_type;
            roleDetails.agent_salary = user.agent_salary;
            roleDetails.commission = user.commission;
            roleDetails.commission_type = user.commission_type;
            roleDetails.overdraft = user.overdraft;
            roleDetails.balance = user.balance;
            roleDetails.manager_code = user.agent_manager_code;
            roleDetails.admin_code = user.agent_admin_code;
        } else if (roles.includes('Manager')) {
            roleDetails.manager_code = user.manager_code;
            roleDetails.admin_code = user.manager_admin_code;
        }

        return res.status(200).json({ 
            status: true, 
            user: { ...userProfile, ...roleDetails }, 
            roles: roles.map(name => ({ name })), 
            permissions 
        });

    } catch (error) {
        console.error("Error in getUserProfile:", error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.params.id;
    const authUserId = req.user.id;
    
    if (parseInt(userId) !== parseInt(authUserId)) {
        return res.status(403).json({ status: false, msg: 'You can only update your own profile' });
    }

    const { name, phone } = req.body;    
    if (!name || name.trim() === '') {
        return res.status(400).json({ 
            status: false, 
            errors: [{ path: 'name', msg: 'Name is required' }] 
        });
    }

    try {
        const connection = await db.getConnection();        
        const [userRows] = await connection.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        if (userRows.length === 0) {
            connection.release();
            return res.status(404).json({ status: false, msg: 'User not found' });
        }

        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');        
        await connection.query(
            'UPDATE users SET name = ?, phone = ?, updated_at = ? WHERE id = ?',
            [name.trim(), phone ? phone.trim() : null, nowUtc, userId]
        );
        connection.release();
        return res.status(200).json({
            status: true,
            msg: 'Profile updated successfully',
            user: {
                id: userId,
                name: name.trim(),
                phone: phone ? phone.trim() : null
            }
        });

    } catch (error) {
        console.error("Error in updateProfile:", error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};

exports.updateAvatar = async (req, res) => {
    const userId = req.params.id;
    const authUserId = req.user.id;
    
    if (parseInt(userId) !== parseInt(authUserId)) {
        return res.status(403).json({ status: false, msg: 'You can only update your own avatar' });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ status: false, msg: 'No file uploaded' });
        }

        const connection = await db.getConnection();        
        const [userRows] = await connection.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        if (userRows.length === 0) {
            connection.release();
            return res.status(404).json({ status: false, msg: 'User not found' });
        }

        await deleteUserAvatarFile(connection, userId);        
        const avatarUrl = `${mainUrl}/uploads/avatars/${req.file.filename}`;
        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        await connection.query('UPDATE users SET avatar = ?, updated_at = ? WHERE id = ?',
            [avatarUrl, nowUtc, userId]
        );
        connection.release();

        return res.status(200).json({
            status: true,
            msg: 'Avatar updated successfully',
            avatarUrl: avatarUrl
        });

    } catch (error) {        
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ 
                status: false, 
                msg: 'Database schema error: avatar column missing. Please run the database migration.',
                error: 'MISSING_AVATAR_COLUMN'
            });
        }
        
        return res.status(500).json({ 
            status: false, 
            msg: 'Something went wrong while updating avatar',
            error: error.message || 'Unknown error'
        });
    }
};

exports.delete = async (req, res) => {
    const userId = req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();        
        await deleteUserAvatarFile(connection, userId);
        
        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        if(result.affectedRows === 0) {
            await connection.rollback();
            await connection.release();
            return res.status(404).json({ status:false, msg: 'User not found' });
        }
        
        await connection.commit();
        await connection.release();
        return res.status(200).json({ status:true, msg: 'User deleted successfully' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            await connection.release();
        }
        return res.status(500).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.getSavedProperties = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT p.* 
            FROM properties p
            JOIN saved_properties sp ON p.id = sp.property_id
            WHERE sp.user_id = ?
        `;
        const [properties] = await db.query(query, [userId]);

        return res.status(200).json({
            status: true,
            properties: properties
        });
    } catch (error) {
        console.error('Error fetching saved properties:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};

async function _deleteAgentByCode(connection, agentCode) {
    const [agentRows] = await connection.query('SELECT user_id FROM agents WHERE agent_code = ? LIMIT 1', [agentCode]);
    if (agentRows.length > 0) {
        const userId = agentRows[0].user_id;

        // Delete user's avatar file first
        await deleteUserAvatarFile(connection, userId);

        // Delete from related tables (uncomment as needed)
        // await connection.query('DELETE FROM brokerages WHERE agent_code = ?', [agentCode]);
        // await connection.query('DELETE FROM deals WHERE agent_code = ?', [agentCode]);
        // await connection.query('DELETE FROM properties WHERE agent_code = ?', [agentCode]);
        // await connection.query('DELETE FROM visits WHERE agent_code = ?', [agentCode]);
        // await connection.query('DELETE FROM estimates WHERE agent_code = ?', [agentCode]);

        // Delete from agents, users, and model_has_roles
        await connection.query('DELETE FROM agents WHERE agent_code = ?', [agentCode]);
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        // await connection.query('DELETE FROM model_has_roles WHERE model_id = ?', [userId]);
    }
}

// Delete agent and all related data by agent_code
exports.deleteAgentByAgentCode = async (req, res) => {
    const agentCode = req.params.agent_code;
    if (!agentCode) {
        return res.status(400).json({ status: false, msg: 'agent_code is required' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // Find agent to check for existence before sending success message
        const [agentRows] = await connection.query('SELECT user_id FROM agents WHERE agent_code = ? LIMIT 1', [agentCode]);
        if (!agentRows.length) {
            await connection.release();
            return res.status(404).json({ status: false, msg: 'Agent not found' });
        }

        await _deleteAgentByCode(connection, agentCode);

        await connection.commit();
        await connection.release();
        return res.status(200).json({ status: true, msg: 'Agent and all related data deleted successfully' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            await connection.release();
        }
        console.error('Error in deleteAgentByAgentCode:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong', error: error.message });
    }
};

// Delete manager and all related data by manager_code
exports.deleteManagerByManagerCode = async (req, res) => {
    const managerCode = req.params.manager_code;
    if (!managerCode) {
        return res.status(400).json({ status: false, msg: 'manager_code is required' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // 1. Find user_id for this manager_code
        const [managerRows] = await connection.query('SELECT user_id FROM managers WHERE manager_code = ? LIMIT 1', [managerCode]);
        if (!managerRows.length) {
            await connection.release();
            return res.status(404).json({ status: false, msg: 'Manager not found' });
        }
        const userId = managerRows[0].user_id;
        
        // New: Find and delete all agents related to this manager
        const [agentsToDelete] = await connection.query('SELECT agent_code FROM agents WHERE manager_code = ?', [managerCode]);
        for (const agent of agentsToDelete) {
            await _deleteAgentByCode(connection, agent.agent_code);
        }

        // Delete manager's avatar file before deleting user
        await deleteUserAvatarFile(connection, userId);

        // 2. Delete from all related tables by manager_code
        // await connection.query('DELETE FROM brokerages WHERE manager_code = ?', [managerCode]);
        // await connection.query('DELETE FROM deals WHERE manager_code = ?', [managerCode]);
        // await connection.query('DELETE FROM properties WHERE manager_code = ?', [managerCode]);
        // await connection.query('DELETE FROM visits WHERE manager_code = ?', [managerCode]);
        // // 3. Delete from managers table
        await connection.query('DELETE FROM managers WHERE manager_code = ?', [managerCode]);
        // // 4. Delete from users table
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        // // 5. Optionally, delete from model_has_roles
        // await connection.query('DELETE FROM model_has_roles WHERE model_id = ?', [userId]);
        await connection.commit();
        await connection.release();
        return res.status(200).json({ status: true, msg: 'Manager and all related agents deleted successfully' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            await connection.release();
        }
        console.error('Error in deleteManagerByManagerCode:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong', error: error.message });
    }
};

// Get all admin users (excluding super admin) - Reverted to context-aware logic with performance improvements
exports.getAllAdmins = async (req, res) => {
    try {
        const userId = req.user.id;
        const [userRows] = await db.query('SELECT u.user_code, r.name as role_name FROM users u JOIN model_has_roles mhr ON u.id = mhr.model_id JOIN roles r ON mhr.role_id = r.id WHERE u.id = ?', [userId]);

        if (!userRows.length) {
            return res.status(404).json({ status: false, msg: 'User not found' });
        }
        
        const user_code = userRows[0].user_code;
        const roleNames = userRows.map(r => r.role_name.toLowerCase());
        
        let admins = [];
        if (roleNames.includes('super admin')) {
            const [rows] = await db.query(`
                SELECT u.id, u.name, u.email, u.user_code 
                FROM users u
                JOIN model_has_roles mhr ON u.id = mhr.model_id
                JOIN roles r ON mhr.role_id = r.id
                WHERE r.name = 'Admin'
            `);
            admins = rows;
        } else if (roleNames.includes('admin')) {
            const [user] = await db.query('SELECT id, name, email, user_code FROM users WHERE id = ?', [userId]);
            admins = user;
        } else if (roleNames.includes('manager')) {
            const [managerRows] = await db.query('SELECT admin_code FROM managers WHERE user_id = ? LIMIT 1', [userId]);
            if (managerRows.length > 0) {
                const [adminRows] = await db.query('SELECT id, name, email, user_code FROM users WHERE user_code = ?', [managerRows[0].admin_code]);
                admins = adminRows;
            }
        } else {
            // Agents or other roles should not be able to query for admins.
            return res.status(200).json({ status: true, admins: [] });
        }

        return res.status(200).json({ status: true, admins });
    } catch (error) {
        console.error('Error fetching admin dropdown:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};

// Get all managers - Reverted to context-aware logic with performance improvements
exports.getAllManagers = async (req, res) => {
    try {
        const userId = req.user.id;
        const [userRows] = await db.query('SELECT u.user_code, r.name as role_name FROM users u JOIN model_has_roles mhr ON u.id = mhr.model_id JOIN roles r ON mhr.role_id = r.id WHERE u.id = ?', [userId]);

        if (!userRows.length) {
            return res.status(404).json({ status: false, msg: 'User not found' });
        }
        
        const user_code = userRows[0].user_code;
        const roleNames = userRows.map(r => r.role_name.toLowerCase());

        let managers = [];
        if (roleNames.includes('super admin')) {
            const [rows] = await db.query(`
                SELECT u.id, u.name, u.email, u.user_code, m.admin_code
                FROM users u
                JOIN managers m ON u.id = m.user_id
            `);
            managers = rows;
        } else if (roleNames.includes('admin')) {
            const [rows] = await db.query(
                'SELECT m.user_id as id, u.name, u.email, u.user_code, m.admin_code FROM managers m JOIN users u ON m.user_id = u.id WHERE m.admin_code = ?',
                [user_code]
            );
            managers = rows;
        } else if (roleNames.includes('manager')) {
            const [user] = await db.query(`
                SELECT u.id, u.name, u.email, u.user_code, m.admin_code 
                FROM users u 
                LEFT JOIN managers m ON u.id = m.user_id
                WHERE u.id = ?
            `, [userId]);
            managers = user;
        } else {
             // Agents or other roles should not be able to query for managers.
             return res.status(200).json({ status: true, managers: [] });
        }
        
        return res.status(200).json({ status: true, managers });
    } catch (error) {
        console.error('Error fetching manager dropdown:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};

// Get managers for current admin, or all managers for super admin, with pagination and search
exports.getManagersForCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, search = '' } = req.query;
        const currentPage = parseInt(page) || 1;
        const perPage = parseInt(limit) || 10;
        const offset = (currentPage - 1) * perPage;

        // Get current user's roles
        const roles = await RolePermissionService.authUserRole(userId);
        const roleNames = roles.map(role => role.name.toLowerCase());
        const [userRows] = await db.query('SELECT user_code FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!userRows.length) {
            return res.status(404).json({ status: false, msg: 'User not found' });
       }
        const user_code = userRows[0].user_code;

        let baseQuery = `
            SELECT m.*, u.name, u.email, u.user_code, u.phone
            FROM managers m
            JOIN users u ON m.user_id = u.id
        `;
        let whereClauses = [];
        let params = [];

        if (roleNames.includes('super admin')) {
        } else if (roleNames.includes('admin')) {
            whereClauses.push('m.admin_code = ?');
            params.push(user_code);
        } else {
            return res.status(403).json({ status: false, msg: 'Not authorized' });
        }

        // Search filter
        if (search && search.trim()) {
            whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR m.manager_code LIKE ? OR m.admin_code LIKE ? OR u.phone LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Get total count for pagination
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM managers m JOIN users u ON m.user_id = u.id ${whereSQL}`,
            params
        );
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / perPage);

        // Get paginated results
        const [managers] = await db.query(
            `${baseQuery} ${whereSQL} LIMIT ? OFFSET ?`,
            [...params, perPage, offset]
        );

        // Ensure manager_code is included in each manager object
        const managersWithManagerCode = managers.map(manager => ({
            ...manager,
            manager_code: manager.manager_code // already present from m.*
        }));

        return res.status(200).json({
            status: true,
            managers: managersWithManagerCode,
            pagination: {
                currentPage,
                perPage,
                total,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        });
    } catch (error) {
        console.error('Error in getManagersForCurrentUser:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};

exports.getAgentsForCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, search = '' } = req.query;
        const currentPage = parseInt(page) || 1;
        const perPage = parseInt(limit) || 10;
        const offset = (currentPage - 1) * perPage;

        const roles = await RolePermissionService.authUserRole(userId);
        const roleNames = roles.map(role => role.name.toLowerCase());

        const [userRows] = await db.query('SELECT user_code FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!userRows.length) {
            return res.status(404).json({ status: false, msg: 'User not found' });
       }
        const user_code = userRows[0].user_code;

        let baseQuery = `
            SELECT a.*, u.name, u.email, u.user_code, u.phone
            FROM agents a
            JOIN users u ON a.user_id = u.id
        `;
        let whereClauses = [];
        let params = [];

        if (roleNames.includes('super admin')) {
            // No extra where clause
        } else if (roleNames.includes('admin')) {
            whereClauses.push('a.admin_code = ?');
            params.push(user_code);
        } else if (roleNames.includes('manager')) {
            whereClauses.push('a.manager_code = ?');
            params.push(user_code);
        } else if (roleNames.includes('agent')) {
            whereClauses.push('a.user_id = ?');
            params.push(userId);
        } else {
            return res.status(403).json({ status: false, msg: 'Not authorized' });
        }

        // Search filter
        if (search && search.trim()) {
            whereClauses.push(`
                u.name LIKE ? OR 
                u.email LIKE ? OR 
                u.user_code LIKE ? OR 
                u.phone LIKE ? OR 
                a.manager_code LIKE ? OR 
                a.admin_code LIKE ? OR 
                a.agent_code LIKE ? OR 
                a.agent_type LIKE ? OR
                a.agent_salary LIKE ?
                `);
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Get total count for pagination
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM agents a JOIN users u ON a.user_id = u.id ${whereSQL}`,
            params
        );
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / perPage);

        // Get paginated results
        const [agents] = await db.query(
            `${baseQuery} ${whereSQL} LIMIT ? OFFSET ?`,
            [...params, perPage, offset]
        );

        return res.status(200).json({
            status: true,
            agents,
            pagination: {
                currentPage,
                perPage,
                total,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        });
    } catch (error) {
        console.error('Error in getAgentsForCurrentUser:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
};

