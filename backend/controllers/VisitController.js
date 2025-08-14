const db = require("../config/db");
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');
const { buildVisitFilters, validateVisitData, handleError } = require('../utils/visitUtils');

// List visits with filtering and role-based access
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 50, ...filters } = req.query;
    const user = req.user;
    const offset = (page - 1) * limit;
    const { sql, countSql, params, countParams } = buildVisitFilters({ filters, user, limit, offset });
    const [rows] = await db.query(sql, params);
    const [countResult] = await db.query(countSql, countParams);
    const total = countResult[0].total;
    res.json({
      visits: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch visits', 500);
  }
};

// Create a new visit
exports.create = async (req, res) => {
  try {
    const user = req.user;
    const validationError = validateVisitData(req.body, user);
    if (validationError) return handleError(res, null, validationError, 400);
    const { agentCode, managerCode, propertyCode, visitDate, clientName, clientMobile, visitNotes, visitStatus } = req.body;
    const finalAgentCode = user.role === "Agent" ? user.code : agentCode;
    const finalManagerCode = user.role === "Manager" ? user.code : managerCode;
    const [result] = await db.query(
      `INSERT INTO visits 
      (agent_code, manager_code, property_code, visit_date, client_name, client_mobile, visit_notes, visit_status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAgentCode,
        finalManagerCode,
        propertyCode,
        visitDate,
        clientName.trim(),
        clientMobile.trim(),
        visitNotes?.trim() || "",
        visitStatus || "Pending",
        user.id,
      ],
    );
    res.json({ success: true, id: result.insertId, message: "Visit logged successfully" });
  } catch (err) {
    handleError(res, err, 'Failed to create visit', 500);
  }
};

// Update a visit
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    let checkSql = "SELECT * FROM visits WHERE id = ?";
    const checkParams = [id];
    if (user.role === "agent") {
      checkSql += " AND agent_code = ?";
      checkParams.push(user.code);
    } else if (user.role === "manager") {
      checkSql += " AND manager_code = ?";
      checkParams.push(user.code);
    }
    const [existingVisit] = await db.query(checkSql, checkParams);
    if (existingVisit.length === 0) return handleError(res, null, "Visit not found or access denied", 404);
    const validationError = validateVisitData(req.body, user);
    if (validationError) return handleError(res, null, validationError, 400);
    const { agentCode, managerCode, propertyCode, visitDate, clientName, clientMobile, visitNotes, visitStatus } = req.body;
    await db.query(
      `UPDATE visits SET 
      agent_code = ?, manager_code = ?, property_code = ?, visit_date = ?, 
      client_name = ?, client_mobile = ?, visit_notes = ?, visit_status = ?
      WHERE id = ?`,
      [
        agentCode,
        managerCode,
        propertyCode,
        visitDate,
        clientName.trim(),
        clientMobile.trim(),
        visitNotes?.trim() || "",
        visitStatus || "Pending",
        id,
      ], 
    );
    res.json({ success: true, message: "Visit updated successfully" });
  } catch (err) {
    handleError(res, err, 'Failed to update visit', 500);
  }
};

// Delete a visit
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    let checkSql = "SELECT * FROM visits WHERE id = ?";
    const checkParams = [id];
    if (user.role === "agent") {
      checkSql += " AND agent_code = ?";
      checkParams.push(user.code);
    } else if (user.role === "manager") {
      checkSql += " AND manager_code = ?";
      checkParams.push(user.code);
    }
    const [existingVisit] = await db.query(checkSql, checkParams);
    if (existingVisit.length === 0) return handleError(res, null, "Visit not found or access denied", 404);
    await db.query("DELETE FROM visits WHERE id = ?", [id]);
    res.json({ success: true, message: "Visit deleted successfully" });
  } catch (err) {
    handleError(res, err, 'Failed to delete visit', 500);
  }
};

// Get visit statistics
exports.getStats = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;
    const { startDate, endDate } = req.query;
    
    // Base query with LEFT JOIN to agents table for role-based filtering
    let conditions = [];
    const params = [];

    // Role-based filtering with proper conditions
    if (role === 'super admin' || role === "Super Admin") {
        // No extra where clause - can see all visit statistics
    } else if (role === 'admin' || role === "Admin") {
        conditions.push('a.admin_code = ?');
        params.push(user.code);
    } else if (role === 'manager' || role === "Manager") {
        conditions.push('a.manager_code = ?');
        params.push(user.code);
    } else if (role === 'agent' || role === "Agent") {
        conditions.push('v.agent_code = ?');
        params.push(user.code);
    } else {
        return res.status(403).json({ status: false, msg: 'Not authorized' });
    }

    if (startDate) {
      conditions.push("DATE(v.visit_date) >= ?");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("DATE(v.visit_date) <= ?");
      params.push(endDate);
    }

    // Build WHERE clause
    let baseCondition = "1=1";
    if (conditions.length > 0) {
      baseCondition = conditions.join(' AND ');
    }
    const [totalVisits] = await db.query(
      `SELECT COUNT(*) as count FROM visits v LEFT JOIN agents a ON v.agent_code = a.agent_code WHERE ${baseCondition}`, 
      params
    );
    const [statusStats] = await db.query(
      `SELECT v.visit_status, COUNT(*) as count FROM visits v LEFT JOIN agents a ON v.agent_code = a.agent_code WHERE ${baseCondition} GROUP BY v.visit_status`,
      params
    );
    const [dailyStats] = await db.query(
      `SELECT DATE(v.visit_date) as date, COUNT(*) as count FROM visits v LEFT JOIN agents a ON v.agent_code = a.agent_code WHERE ${baseCondition} AND v.visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(v.visit_date) ORDER BY date DESC`,
      params
    );
    let topAgents = [];
    if (role !== "agent" && role !== "Agent") {
      let agentCondition = baseCondition;
      const agentParams = [...params];
      const [agentStats] = await db.query(
        `SELECT 
          v.agent_code, 
          u.name as agent_name, 
          COUNT(*) as total_visits, 
          SUM(CASE WHEN v.visit_status = 'Interested' THEN 1 ELSE 0 END) as interested_count, 
          SUM(CASE WHEN v.visit_status = 'Converted' THEN 1 ELSE 0 END) as converted_count 
        FROM visits v 
        LEFT JOIN agents a ON v.agent_code = a.agent_code
        LEFT JOIN users u ON v.agent_code = u.user_code 
        WHERE ${agentCondition} 
        GROUP BY v.agent_code, u.name 
        ORDER BY total_visits DESC 
        LIMIT 10`,
        agentParams
      );
      topAgents = agentStats;
    }
    res.json({
      totalVisits: totalVisits[0].count,
      statusStats,
      dailyStats,
      topAgents,
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch statistics', 500);
  }
};

// Export visits to CSV
exports.exportCSV = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;
    const { startDate, endDate, agentCode, propertyCode, managerCode, visitStatus } = req.query;
    
    // Base query with LEFT JOIN to agents table
    let baseQuery = `
      SELECT v.id, v.agent_code, v.manager_code, v.property_code, 
             DATE_FORMAT(v.visit_date, '%Y-%m-%d %H:%i') as visit_date, 
             v.client_name, v.client_mobile, v.visit_notes, v.visit_status, 
             DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i') as created_at 
      FROM visits v 
      LEFT JOIN agents a ON v.agent_code = a.agent_code
    `;
    
    let conditions = [];
    let params = [];

    // Role-based filtering with proper conditions
    if (role === 'super admin' || role === "Super Admin") {
        // No extra where clause - can see all visits
    } else if (role === 'admin' || role === "Admin") {
        conditions.push('a.admin_code = ?');
        params.push(user.code);
    } else if (role === 'manager' || role === "Manager") {
        conditions.push('a.manager_code = ?');
        params.push(user.code);
    } else if (role === 'agent' || role === "Agent") {
        conditions.push('v.agent_code = ?');
        params.push(user.code);
    } else {
        return res.status(403).json({ status: false, msg: 'Not authorized' });
    }

    if (startDate) {
      conditions.push("DATE(v.visit_date) >= ?");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("DATE(v.visit_date) <= ?");
      params.push(endDate);
    }
    if (agentCode) {
      conditions.push("v.agent_code = ?");
      params.push(agentCode);
    }
    if (propertyCode) {
      conditions.push("v.property_code = ?");
      params.push(propertyCode);
    }
    if (managerCode) {
      conditions.push("v.manager_code = ?");
      params.push(managerCode);
    }
    if (visitStatus) {
      conditions.push("v.visit_status = ?");
      params.push(visitStatus);
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
    }

    baseQuery += " ORDER BY v.visit_date DESC";
    const [rows] = await db.query(baseQuery, params);
    const csvHeader = "ID,Agent Code,Manager Code,Property Code,Visit Date,Client Name,Client Mobile,Visit Notes,Visit Status,Created At\n";
    const csvRows = rows.map(row => `${row.id},"${row.agent_code}","${row.manager_code || ""}","${row.property_code}","${row.visit_date}","${row.client_name}","${row.client_mobile}","${(row.visit_notes || "").replace(/"/g, '""')}","${row.visit_status}","${row.created_at}"`).join("\n");
    const csv = csvHeader + csvRows;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="visits_export_${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    handleError(res, err, 'Failed to export visits', 500);
  }
};

// Export visits to PDF
exports.exportPDF = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;
    const { startDate, endDate, agentCode, propertyCode, managerCode, visitStatus } = req.query;
    
    // Base query with LEFT JOIN to agents table
    let baseQuery = `
      SELECT v.id, v.agent_code, v.manager_code, v.property_code, 
             DATE_FORMAT(v.visit_date, '%Y-%m-%d %H:%i') as visit_date, 
             v.client_name, v.client_mobile, v.visit_notes, v.visit_status, 
             DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i') as created_at 
      FROM visits v 
      LEFT JOIN agents a ON v.agent_code = a.agent_code
    `;
    
    let conditions = [];
    let params = [];

    // Role-based filtering with proper conditions
    if (role === 'super admin' || role === "Super Admin") {
        // No extra where clause - can see all visits
    } else if (role === 'admin' || role === "Admin") {
        conditions.push('a.admin_code = ?');
        params.push(user.code);
    } else if (role === 'manager' || role === "Manager") {
        conditions.push('a.manager_code = ?');
        params.push(user.code);
    } else if (role === 'agent' || role === "Agent") {
        conditions.push('v.agent_code = ?');
        params.push(user.code);
    } else {
        return res.status(403).json({ status: false, msg: 'Not authorized' });
    }

    if (startDate) {
      conditions.push("DATE(v.visit_date) >= ?");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("DATE(v.visit_date) <= ?");
      params.push(endDate);
    }
    if (agentCode) {
      conditions.push("v.agent_code = ?");
      params.push(agentCode);
    }
    if (propertyCode) {
      conditions.push("v.property_code = ?");
      params.push(propertyCode);
    }
    if (managerCode) {
      conditions.push("v.manager_code = ?");
      params.push(managerCode);
    }
    if (visitStatus) {
      conditions.push("v.visit_status = ?");
      params.push(visitStatus);
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
    }

    baseQuery += " ORDER BY v.visit_date DESC";
    const [rows] = await db.query(baseQuery, params);
    const html = await ejs.renderFile(
      path.join(__dirname, '../views/visitPdfTemplate.ejs'),
      { visits: rows }
    );
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
      'Content-Disposition': `attachment; filename=visits_export_${new Date().toISOString().split("T")[0]}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    handleError(res, err, 'Failed to export visits as PDF', 500);
  }
};

// Get single visit by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    let sql = "SELECT * FROM visits WHERE id = ?";
    const params = [id];
    if (user.role === "Agent" || user.role === "agent") {
      sql += " AND agent_code = ?";
      params.push(user.code);
    } else if (user.role === "Manager" || user.role === "manager") {
      sql += " AND manager_code = ?";
      params.push(user.code);
    }
    const [rows] = await db.query(sql, params);
    if (!rows.length) {
      return handleError(res, null, "Visit not found or access denied", 404);
    }
    res.json({ visit: rows[0] });
  } catch (err) {
    handleError(res, err, 'Failed to fetch visit details', 500);
  }
};
