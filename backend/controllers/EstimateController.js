const db = require('../config/db');
const { Parser } = require('json2csv');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');

function handleError(res, err, userMessage = 'An error occurred', status = 500) {
  console.error(userMessage, err);
  res.status(status).json({ success: false, message: userMessage, error: err?.message || err });
}

exports.list = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const user = req.user;
    const role = user.role;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Base query with LEFT JOIN to agents table
    let baseQuery = `
      SELECT e.*
      FROM estimates e 
      LEFT JOIN agents a ON e.agent_code = a.agent_code
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM estimates e 
      LEFT JOIN agents a ON e.agent_code = a.agent_code
    `;
    
    let conditions = [];
    let params = [];
    let countParams = [];

    // Role-based filtering with proper conditions
    if (role === 'super admin' || role === "Super Admin") {
        // No extra where clause - can see all estimates
    } else if (role === 'admin' || role === "Admin") {
        conditions.push('a.admin_code = ?');
        params.push(user.code);
        countParams.push(user.code);
    } else if (role === 'manager' || role === "Manager") {
        conditions.push('a.manager_code = ?');
        params.push(user.code);
        countParams.push(user.code);
    } else if (role === 'agent' || role === "Agent") {
        conditions.push('e.agent_code = ?');
        params.push(user.code);
        countParams.push(user.code);
    } else {
        return res.status(403).json({ status: false, msg: 'Not authorized' });
    }

    // Search filtering
    if (search && search.trim()) {
      const searchCondition = '(e.property_code LIKE ? OR e.agent_code LIKE ? OR a.manager_code LIKE ?)';
      conditions.push(searchCondition);
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Get total count
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Get paginated results
    baseQuery += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [rows] = await db.query(baseQuery, params);
    
    const totalPages = Math.ceil(total / parseInt(limit));
    const currentPage = parseInt(page);

    res.json({
      estimates: rows,
      pagination: {
        currentPage: currentPage,
        perPage: parseInt(limit),
        total: total,
        totalPages: totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch estimates', 500);
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!id) {
      return handleError(res, null, 'Estimate ID is required', 400);
    }

    let query = 'SELECT * FROM estimates WHERE id = ?';
    let params = [id];

    // Role-based filtering
    if (user.role === 'agent') {
      query += ' AND agent_code = ?';
      params.push(user.code);
    }

    const [rows] = await db.query(query, params);
    
    if (!rows || rows.length === 0) {
      return handleError(res, null, 'Estimate not found', 404);
    }

    res.json({
      success: true,
      estimate: rows[0]
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch estimate details', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      propertyCode, agentCode, propertySize, propertyRate,
      brokerageSeller, brokerageBuyer, additionalCosts, total, totalBrokerage, status
    } = req.body;

    const user = req.user;
    const agent_code = user.role === 'agent' ? user.code : agentCode;

    // Basic validation
    if (!propertyCode || !propertySize || !propertyRate || !total) {
      return handleError(res, null, 'Missing required fields for estimate creation', 400);
    }

    const [result] = await db.query(
      `INSERT INTO estimates
      (property_code, agent_code, property_size, property_rate, brokerage_seller, brokerage_buyer, additional_costs, total, total_brokerage, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        propertyCode, agent_code, propertySize, propertyRate,
        brokerageSeller, brokerageBuyer, additionalCosts, total, totalBrokerage, status || 'Draft', user.id
      ]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    handleError(res, err, 'Failed to create estimate', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      propertyCode, agentCode, propertySize, propertyRate,
      brokerageSeller, brokerageBuyer, additionalCosts, total, totalBrokerage, status
    } = req.body;

    const user = req.user;

    if (!id) {
      return handleError(res, null, 'Estimate ID is required', 400);
    }

    // Check if estimate exists and user has permission
    let checkQuery = 'SELECT * FROM estimates WHERE id = ?';
    let checkParams = [id];

    if (user.role === 'agent') {
      checkQuery += ' AND agent_code = ?';
      checkParams.push(user.code);
    }

    const [existingRows] = await db.query(checkQuery, checkParams);
    if (!existingRows || existingRows.length === 0) {
      return handleError(res, null, 'Estimate not found or access denied', 404);
    }

    const agent_code = user.role === 'agent' ? user.code : agentCode;

    // Basic validation
    if (!propertyCode || !propertySize || !propertyRate || !total) {
      return handleError(res, null, 'Missing required fields for estimate update', 400);
    }

    const [result] = await db.query(
      `UPDATE estimates SET
      property_code = ?, agent_code = ?, property_size = ?, property_rate = ?, 
      brokerage_seller = ?, brokerage_buyer = ?, additional_costs = ?, total = ?, 
      total_brokerage = ?, status = ?, created_by = ?
      WHERE id = ?`,
      [
        propertyCode, agent_code, propertySize, propertyRate,
        brokerageSeller, brokerageBuyer, additionalCosts, total, totalBrokerage, status, user.id,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return handleError(res, null, 'Failed to update estimate', 400);
    }

    res.json({ success: true, message: 'Estimate updated successfully' });
  } catch (err) {
    handleError(res, err, 'Failed to update estimate', 500);
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      return handleError(res, null, 'Estimate ID is required', 400);
    }

    // Check if estimate exists and user has permission
    let checkQuery = 'SELECT * FROM estimates WHERE id = ?';
    let checkParams = [id];

    if (user.role === 'agent') {
      checkQuery += ' AND agent_code = ?';
      checkParams.push(user.code);
    }

    const [existingRows] = await db.query(checkQuery, checkParams);
    if (!existingRows || existingRows.length === 0) {
      return handleError(res, null, 'Estimate not found or access denied', 404);
    }

    const [result] = await db.query('DELETE FROM estimates WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return handleError(res, null, 'Failed to delete estimate', 400);
    }

    res.json({ success: true, message: 'Estimate deleted successfully' });
  } catch (err) {
    handleError(res, err, 'Failed to delete estimate', 500);
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const { agentCode, propertyCode, estimateStatus, startDate, endDate } = req.query;
    const user = req.user;
    const role = user.role;

    // Base query with LEFT JOIN to agents table
    let baseQuery = `
      SELECT e.*
      FROM estimates e 
      LEFT JOIN agents a ON e.agent_code = a.agent_code
    `;
    
    let conditions = [];
    let params = [];

    // Role-based filtering with proper conditions
    if (role === 'super admin' || role === "Super Admin") {
        // No extra where clause - can see all estimates
    } else if (role === 'admin' || role === "Admin") {
        conditions.push('a.admin_code = ?');
        params.push(user.code);
    } else if (role === 'manager' || role === "Manager") {
        conditions.push('a.manager_code = ?');
        params.push(user.code);
    } else if (role === 'agent' || role === "Agent") {
        conditions.push('e.agent_code = ?');
        params.push(user.code);
    } else {
        return res.status(403).json({ status: false, msg: 'Not authorized' });
    }

    if (agentCode) {
      conditions.push('e.agent_code = ?');
      params.push(agentCode);
    }
    if (propertyCode) {
      conditions.push('e.property_code = ?');
      params.push(propertyCode);
    }
    if (estimateStatus) {
      conditions.push('e.status = ?');
      params.push(estimateStatus);
    }
    if (startDate) {
      conditions.push('e.created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('e.created_at <= ?');
      params.push(endDate);
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
    }

    baseQuery += ' ORDER BY e.created_at DESC';

    const [rows] = await db.query(baseQuery, params);
    if (!rows || rows.length === 0) {
      return handleError(res, null, 'No estimates found for export', 404);
    }

    // Convert to CSV
    const fields = [
      'id', 'property_code', 'agent_code', 'property_size', 'property_rate',
      'brokerage_seller', 'brokerage_buyer', 'additional_costs', 'total', 'total_brokerage', 'created_at', 'status'
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('estimates_export.csv');
    return res.send(csv);
  } catch (err) {
    handleError(res, err, 'Failed to export estimates', 500);
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const { agentCode, propertyCode, estimateStatus, startDate, endDate } = req.query;
    const user = req.user;
    const role = user.role;

    // Base query with LEFT JOIN to agents table
    let baseQuery = `
      SELECT e.*
      FROM estimates e 
      LEFT JOIN agents a ON e.agent_code = a.agent_code
    `;
    
    let conditions = [];
    let params = [];

    // Role-based filtering with proper conditions
    if (role === 'super admin' || role === "Super Admin") {
        // No extra where clause - can see all estimates
    } else if (role === 'admin' || role === "Admin") {
        conditions.push('a.admin_code = ?');
        params.push(user.code);
    } else if (role === 'manager' || role === "Manager") {
        conditions.push('a.manager_code = ?');
        params.push(user.code);
    } else if (role === 'agent' || role === "Agent") {
        conditions.push('e.agent_code = ?');
        params.push(user.code);
    } else {
        return res.status(403).json({ status: false, msg: 'Not authorized' });
    }

    if (agentCode) {
      conditions.push('e.agent_code = ?');
      params.push(agentCode);
    }
    if (propertyCode) {
      conditions.push('e.property_code = ?');
      params.push(propertyCode);
    }
    if (estimateStatus) {
      conditions.push('e.status = ?');
      params.push(estimateStatus);
    }
    if (startDate) {
      conditions.push('e.created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('e.created_at <= ?');
      params.push(endDate);
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
    }

    baseQuery += ' ORDER BY e.created_at DESC';

    const [rows] = await db.query(baseQuery, params);
    if (!rows || rows.length === 0) {
      return handleError(res, null, 'No estimates found for export', 404);
    }

    // Render HTML from EJS template
    const html = await ejs.renderFile(
      path.join(__dirname, '../views/estimatePdfTemplate.ejs'),
      { estimates: rows }
    );

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
      scale: 0.8,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=estimates_export.pdf',
    });
    res.send(pdfBuffer);
  } catch (err) {
    handleError(res, err, 'Failed to export estimates as PDF', 500);
  }
};