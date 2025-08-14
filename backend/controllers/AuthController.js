const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const RolePermissionService = require('../services/RolePermissionService');
const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if(!email){
        let error = [{path:'email', msg: 'The email is required'}];
        return res.status(200).json({ status:false, errors: error });
    }
    if(!password){
        let error = [{path:'password', msg: 'The password is required'}];
        return res.status(200).json({ status:false, errors: error });
    }
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    let error = [{path:'email', msg: 'Invalid email or password.'}];
    const user = rows[0];
    if(!user) return res.status(200).json({ status:false, errors: error });
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(200).json({ status:false, errors: error });
    
    let userRole = await RolePermissionService.authUserRole(user.id);
    let userPermissions = await RolePermissionService.authUserPermissions(user.id);
    const token = jwt.sign({ id: user.id, email: user.email, name:user.name }, JWT_SECRET, { expiresIn: '8h' });
    return res.status(200).json({ status:true, token:`Basic ${token}`, user: { id: user.id, email: user.email, name:user.name, roles:userRole, permissions:userPermissions } });

}