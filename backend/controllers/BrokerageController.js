const db = require('../config/db');
const { validationResult } = require('express-validator');
const { uniqueCode } = require('./ApiController');


exports.index =  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.user.role;
    const {search, property_code, ag_code, manager_code} = req.query;

    try {
        
        let baseQuery = `SELECT b.*, ag.name as agent_name, m.name as manager_name, p.property_name, p.property_type
                        FROM brokerages as b
                        INNER JOIN users as ag ON ag.user_code = b.agent_code
                        INNER JOIN users as m ON m.user_code = b.manager_code 
                        INNER JOIN properties as p ON p.property_code = b.property_code
                        LEFT JOIN agents a ON b.agent_code = a.agent_code`;

        let countQuery = `SELECT COUNT(*) AS count FROM brokerages as b 
                        INNER JOIN users as ag ON ag.user_code = b.agent_code
                        INNER JOIN users as m ON m.user_code = b.manager_code 
                        INNER JOIN properties as p ON p.property_code = b.property_code
                        LEFT JOIN agents a ON b.agent_code = a.agent_code`;
                        
        let conditions = [];
        let values = [];

        // Role-based filtering with proper conditions
        if (role === 'super admin' || role === "Super Admin") {
            // No extra where clause - can see all brokerages
        } else if (role === 'admin' || role === "Admin") {
            conditions.push('a.admin_code = ?');
            values.push(req.user.code);
        } else if (role === 'manager' || role === "Manager") {
            conditions.push('a.manager_code = ?');
            values.push(req.user.code);
        } else if (role === 'agent' || role === "Agent") {
            conditions.push('b.agent_code = ?');
            values.push(req.user.code);
        } else {
            return res.status(403).json({ status: false, msg: 'Not authorized' });
        }

        if (search && search.trim()) {
            conditions.push('(b.property_code LIKE ? OR b.agent_code LIKE ? OR b.manager_code LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        if (property_code) {
            conditions.push(`b.property_code = ?`);
            values.push(property_code);
        }
        if (ag_code) {
            conditions.push(`b.agent_code = ?`);
            values.push(ag_code);
        }
        if (manager_code) {
            conditions.push(`b.manager_code = ?`);
            values.push(manager_code);
        }
        if (conditions.length > 0) {
            const whereClause = ` WHERE ` + conditions.join(' AND ');
            baseQuery += whereClause;
            countQuery += whereClause;
        }

        baseQuery += ` ORDER BY b.id ASC LIMIT ? OFFSET ?`;
        values.push(limit, offset);
        const [brokerages] = await db.query(baseQuery, values);
        const [countResult] = await db.query(countQuery, values.slice(0, values.length - 2));
        const totalBrokerages = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalBrokerages / limit);

        return res.status(200).json({
            status: true,
            brokerages: brokerages,
            pagination: {
                current_page: page,
                per_page: limit,
                total: totalBrokerages,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_prev_page: page > 1
            }
        });
    } catch (error) {
        return res.status(500).json({ status:false, msg: 'Something went wrong', error: error.message });
    }
}

exports.show = async (req, res) => {
    try {
        const bId = req.params.id;
        const [rows] = await db.query(`SELECT b.*, ag.name as agent_name, m.name as manager_name, p.property_name, p.property_type
                FROM brokerages as b 
                INNER JOIN users as ag ON ag.user_code = b.agent_code
                INNER JOIN users as m ON m.user_code = b.manager_code 
                INNER JOIN properties as p ON p.property_code = b.property_code
                WHERE b.id = ? LIMIT 1`, [bId]);
        const bInfo = rows[0];
        if(!bInfo) return res.status(200).json({ status:false, msg:'Brokerage not found' });

        return res.status(200).json({ status:true, msg:'Brokerage retrive successfully', data: bInfo});
    } catch (error) {
        console.error('Error in view property:', error);
        return res.status(500).json({ status:false, msg: 'Something went wrong' });
    }
}

exports.store = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({ status:false, errors: errors.array() });
        } 

        const {property_code, agent_code, total_brokerage, mode_of_payment, agent_commission, 
            manager_commission_type, manager_commission_value, notes}= req.body;
    
        const [agents] = await db.query(`
            SELECT u.*, a.manager_code 
            FROM users u 
            JOIN agents a ON u.user_code = a.agent_code 
            WHERE u.user_code = ? LIMIT 1
        `, [agent_code]);
        const agent = agents[0];
        if(!agent) return res.status(200).json({ status:false, msg: 'Agent not found' });
        if(!agent.manager_code) return res.status(200).json({ status:false, msg: 'Agent not assigned to manager.' });
                
        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' '); 
        const managerCode = agent.manager_code;
        const brokerageCode = await uniqueCode('BRK');
        const [rows] = await db.query(`INSERT INTO brokerages (brokerage_code, property_code, agent_code, manager_code, total_brokerage, mode_of_payment, 
                                    agent_commission, manager_commission_type, manager_commission_value, notes, created_at, updated_at)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [brokerageCode, property_code, agent_code, managerCode, total_brokerage, mode_of_payment,
                                agent_commission,  manager_commission_type, manager_commission_value, notes, nowUtc, nowUtc]);
    
        const [createdBrokerage] = await db.query(`SELECT b.*, ag.name as agent_name, m.name as manager_name, p.property_name, p.property_type
                FROM brokerages as b 
                INNER JOIN users as ag ON ag.user_code = b.agent_code
                INNER JOIN users as m ON m.user_code = b.manager_code 
                INNER JOIN properties as p ON p.property_code = b.property_code
                WHERE b.id = ? ORDER BY b.id ASC LIMIT 1`, [rows.insertId]);
        
        return res.status(200).json({ 
            status: true, 
            msg: 'Brokerage added successfully',
            data: createdBrokerage[0]
        });
    } catch (error) {
        return res.status(500).json({ status:false, msg: 'Something went wrong', error: error.message });
    }
}

exports.update = async (req, res) => {
    try {
        const errors = validationResult(req);
        const bId = req.params.id;
        if(!bId) return res.status(200).json({ status:false, msg: 'Brokerage ID is required' });

        const [[brokerage]] = await db.query(`SELECT * FROM brokerages WHERE id = ? LIMIT 1`, [bId]);
        if(!brokerage) return res.status(200).json({ status:false, msg: 'Brokerage not found' });
        
        const {property_code, agent_code, total_brokerage, mode_of_payment, agent_commission, 
            manager_commission_type, manager_commission_value, notes}= req.body;
        
        if (!errors.isEmpty()) {
            return res.status(200).json({ status:false, errors: errors.array() });
        } 
    
        const [[property]] = await db.query(`SELECT * FROM properties WHERE property_code = ? LIMIT 1`, [property_code]);
        if(!property) return res.status(200).json({ status:false, msg: 'Property not found' });

        const [agents] = await db.query(`
            SELECT u.*, a.manager_code 
            FROM users u 
            JOIN agents a ON u.user_code = a.agent_code 
            WHERE u.user_code = ? LIMIT 1
        `, [agent_code]);
        const agent = agents[0];
        if(!agent) return res.status(200).json({ status:false, msg: 'Agent not found' });
    
        if(!agent.manager_code) return res.status(200).json({ status:false, msg: 'Agent not assigned to manager.' });
                
        const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' '); 
        const managerCode = agent.manager_code;

        let brokerageCode = brokerage.brokerage_code;
        if (!brokerage.brokerage_code || brokerage.brokerage_code === null || brokerage.brokerage_code === '') {
            brokerageCode = await uniqueCode('BRK');
        }

        const totalBrokerageValue = parseFloat(total_brokerage);
        const agentCommissionValue = parseFloat(agent_commission);
        const managerCommissionValue = parseFloat(manager_commission_value);
        const [rows] = await db.query(`UPDATE brokerages SET brokerage_code =?, property_code =?, agent_code=?, manager_code=?, total_brokerage=?, mode_of_payment=?, 
                                    agent_commission=?, manager_commission_type=?, manager_commission_value=?, notes=?, updated_at=?
                                    WHERE id = ?`, 
                                    [brokerageCode, property_code, agent_code, managerCode, totalBrokerageValue, mode_of_payment,
                                    agentCommissionValue, manager_commission_type, managerCommissionValue, notes || null, nowUtc, bId]);
    
        if (rows.affectedRows === 0) {
            return res.status(200).json({ status:false, msg: 'No changes made to brokerage' });
        }
    
        return res.status(200).json({ status:true, msg: 'Brokerage updated successfully' });
        
    } catch (error) {
        return res.status(500).json({ status:false, msg: 'Something went wrong', error: error.message });
    }
}

exports.destroy =  async (req, res) => {
    try {
        const bId = req.params.id;
        if(!bId) return res.status(200).json({ status:false, msg: 'Something went wrong' });

        const [[brokerage]] = await db.query(`SELECT * FROM brokerages WHERE id = ? LIMIT 1`, [bId]);
        if(!brokerage) return res.status(200).json({ status:false, msg: 'Brokerage not found' });

        const [rowsDelete] = await db.query(`DELETE FROM brokerages WHERE id = ?`, [bId]);
        return res.status(200).json({ status:true, msg: 'Brokerage deleted successfully'});

    } catch (error) {
        return res.status(500).json({ status:false, msg: 'Something went wrong', error: error.message });
    }
}