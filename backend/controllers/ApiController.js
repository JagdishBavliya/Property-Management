const db = require('../config/db');

exports.getRole = async (req, res) => {
  try {
      const [roles] = await db.query('SELECT id, name, created_at, updated_at FROM roles ORDER BY id ASC');
      return res.status(200).json({
          success: true,
          message: 'Roles retrieved successfully',
          data: roles,
          count: roles.length
      });
  } catch (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({
          success: false,
          message: 'Internal server error while fetching roles',
          error: error.message
      });
  }
};
exports.getPermission = async (req, res) => {
    try {
        const [permissions] = await db.query('SELECT id, name, created_at, updated_at FROM permissions ORDER BY id ASC');
        return res.status(200).json({
            success: true,
            message: 'Permissions retrieved successfully',
            data: permissions,
            count: permissions.length
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching permissions',
            error: error.message
        });
    }
};
exports.getRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate role ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID provided'
            });
        }

        // First check if the role exists
        const [roleCheck] = await db.query('SELECT id, name FROM roles WHERE id = ?', [id]);
        
        if (roleCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Get permissions for the specific role
        const [permissions] = await db.query(`
            SELECT p.id, p.name, p.created_at, p.updated_at 
            FROM permissions p 
            INNER JOIN role_has_permissions rp ON p.id = rp.permission_id 
            WHERE rp.role_id = ? 
            ORDER BY p.id ASC
        `, [id]);

        return res.status(200).json({
            success: true,
            message: 'Role permissions retrieved successfully',
            data: permissions,
            count: permissions.length
        });
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching role permissions',
            error: error.message
        });
    }
};
exports.updateRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        // Validate role ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID provided'
            });
        }

        // Validate permissions array
        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions must be an array'
            });
        }

        // Check if the role exists
        const [roleCheck] = await db.query('SELECT id, name FROM roles WHERE id = ?', [id]);
        
        if (roleCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Validate that all permission IDs exist
        if (permissions.length > 0) {
            const permissionIds = permissions.map(p => typeof p === 'object' ? p.id : p);
            const placeholders = permissionIds.map(() => '?').join(',');
            const [permissionCheck] = await db.query(
                `SELECT id FROM permissions WHERE id IN (${placeholders})`,
                permissionIds
            );

            if (permissionCheck.length !== permissionIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more permission IDs are invalid'
                });
            }
        }

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Delete existing role permissions
            await connection.query('DELETE FROM role_has_permissions WHERE role_id = ?', [id]);

            // Insert new role permissions
            if (permissions.length > 0) {
                const permissionIds = permissions.map(p => typeof p === 'object' ? p.id : p);
                const insertPromises = permissionIds.map(permissionId => {
                    return connection.query(
                        'INSERT INTO role_has_permissions (role_id, permission_id) VALUES (?, ?)',
                        [id, permissionId]
                    );
                });

                await Promise.all(insertPromises);
            }

            // Commit transaction
            await connection.commit();

            // Get updated permissions for response
            const [updatedPermissions] = await db.query(`
                SELECT p.id, p.name, p.created_at, p.updated_at 
                FROM permissions p 
                INNER JOIN role_has_permissions rp ON p.id = rp.permission_id 
                WHERE rp.role_id = ? 
                ORDER BY p.id ASC
            `, [id]);

            return res.status(200).json({
                success: true,
                message: 'Role permissions updated successfully',
                data: {
                    role: roleCheck[0],
                    permissions: updatedPermissions
                },
                count: updatedPermissions.length
            });

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error updating role permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating role permissions',
            error: error.message
        });
    }
};

// GENERATE UNIQUE CODES.
exports.uniqueCode = async (prefix) => {
    try {
        let table, column;        
        if(prefix === 'AGT' || prefix === 'MNG' || prefix === 'ADM' || prefix === 'SADM') {
            table = 'users';
            column = 'user_code';
        } else if(prefix === 'PROP') {
            table = 'properties'; 
            column = 'property_code';
        } else if(prefix === 'BRK') {
            table = 'brokerages';
            column = 'brokerage_code';
        } else {
            throw new Error('Invalid prefix');
        }

        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const uniqueCode = `${prefix}-${randomNum}`;
            const [existingRows] = await db.query(`SELECT ${column} FROM ${table} WHERE ${column} = ? LIMIT 1`,[uniqueCode]);
            if (existingRows.length === 0) return uniqueCode;   
            attempts++;
        }
        throw new Error(`Failed to generate unique code after ${maxAttempts} attempts`);
    } catch (error) {
        console.error('Error generating unique code:', error);
        throw error;
    }
}
