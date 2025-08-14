const db = require('../config/db');

async function authUserRole(userId) {
    try{
        const [rows] = await db.query(
            'SELECT r.id, r.name FROM model_has_roles AS mr INNER JOIN roles AS r ON mr.role_id = r.id WHERE mr.model_id = ?',
            [userId]
          );
        return rows;
    }catch (error) {
        console.error('Error fetching user roles:', error);
        return [];
    }
}

async function authUserPermissions(userId) {
    const userRoles = await authUserRole(userId); // now it's an array
    const roleIds = userRoles.map(role => role.id);

    if (roleIds.length === 0) return [];

    try {
        const placeholders = roleIds.map(() => '?').join(',');
        const [rows] = await db.query(
            `SELECT DISTINCT p.id, p.name 
             FROM role_has_permissions AS rp 
             INNER JOIN permissions AS p ON rp.permission_id = p.id 
             WHERE rp.role_id IN (${placeholders})`,
            roleIds
        );

        return rows;
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return [];
    }
}


async function assignRole(userId, roleIds) {
    // Delete existing roles
    await db.query(`DELETE FROM model_has_roles WHERE model_id = ?`, [userId]);

    // Insert new roles
    const insertPromises = roleIds.map(roleId => {
        return db.query(
            `INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, ?, ?)`,
            [roleId, "App\\Models\\User", userId]
        );
    });

    // Wait for all insert queries to complete
    await Promise.all(insertPromises);
    return true;
}
module.exports = {
    authUserRole,
    authUserPermissions,
    assignRole
};