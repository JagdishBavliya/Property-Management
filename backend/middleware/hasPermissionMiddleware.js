const RolePermissionService = require('../services/RolePermissionService');
function hasPermissionMiddleware(permission) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const userPermissions = await RolePermissionService.authUserPermissions(user.id);
            const permissionArray = userPermissions.map(permission => permission.name);
            
            const hasPermission = permission.some(perm => permissionArray.includes(perm));

            if (hasPermission) {
                return next();
            } else {
                // If the permission does not exist, deny access
                return res.status(403).json({ status:false, msg: 'You do not have permission to access this resource' });
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
            return res.status(500).json({ message: 'An error occurred while checking permissions' });
        }
    };
}

module.exports = hasPermissionMiddleware;
