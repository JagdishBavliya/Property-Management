

function buildVisitFilters({ filters, user, limit, offset }) {
  // Base query with LEFT JOIN to agents table
  let sql = `
    SELECT 
      v.*,
      DATE_FORMAT(v.visit_date, '%Y-%m-%d %H:%i') as formatted_visit_date,
      DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i') as formatted_created_at
    FROM visits v 
    LEFT JOIN agents a ON v.agent_code = a.agent_code
  `;
  
  let countSql = `
    SELECT COUNT(*) as total 
    FROM visits v 
    LEFT JOIN agents a ON v.agent_code = a.agent_code
  `;
  
  let conditions = [];
  const params = [];
  const countParams = [];
  const role = user.role;

  // Role-based filtering with proper conditions
  if (role === 'super admin' || role === "Super Admin") {
    // No extra where clause - can see all visits
  } else if (role === 'admin' || role === "Admin") {
    conditions.push('a.admin_code = ?');
    params.push(user.code);
    countParams.push(user.code);
  } else if (role === 'manager' || role === "Manager") {
    conditions.push('a.manager_code = ?');
    params.push(user.code);
    countParams.push(user.code);
  } else if (role === 'agent' || role === "Agent") {
    conditions.push('v.agent_code = ?');
    params.push(user.code);
    countParams.push(user.code);
  } else {
    throw new Error('Not authorized');
  }

  // Search filtering
  if (filters.search && filters.search.trim()) {
    const searchCondition = '(v.agent_code LIKE ? OR v.property_code LIKE ? OR v.client_name LIKE ? OR v.client_mobile LIKE ?)';
    conditions.push(searchCondition);
    const searchTerm = `%${filters.search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Additional filters
  if (filters.agentCode) {
    conditions.push('v.agent_code = ?');
    params.push(filters.agentCode);
    countParams.push(filters.agentCode);
  }
  if (filters.managerCode) {
    conditions.push('v.manager_code = ?');
    params.push(filters.managerCode);
    countParams.push(filters.managerCode);
  }
  if (filters.propertyCode) {
    conditions.push('v.property_code = ?');
    params.push(filters.propertyCode);
    countParams.push(filters.propertyCode);
  }
  if (filters.visitStatus) {
    conditions.push('v.visit_status = ?');
    params.push(filters.visitStatus);
    countParams.push(filters.visitStatus);
  }
  if (filters.startDate) {
    conditions.push('DATE(v.visit_date) >= ?');
    params.push(filters.startDate);
    countParams.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push('DATE(v.visit_date) <= ?');
    params.push(filters.endDate);
    countParams.push(filters.endDate);
  }

  // Add WHERE clause if conditions exist
  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    sql += whereClause;
    countSql += whereClause;
  }

  sql += ' ORDER BY v.visit_date DESC LIMIT ? OFFSET ?';
  params.push(Number.parseInt(filters.limit || limit), Number.parseInt(filters.offset || offset));

  return { sql, countSql, params, countParams };
}


function validateVisitData(data, user) {
  if (!data.agentCode && user.role !== 'agent') return 'Agent Code is required';
  if (!data.propertyCode) return 'Property Code is required';
  if (!data.visitDate) return 'Visit Date is required';
  if (!data.clientName) return 'Client Name is required';
  if (!data.clientMobile) return 'Client Mobile is required';
  const sanitizedMobile = String(data.clientMobile || '').replace(/\D/g, '');
  if (sanitizedMobile.length !== 10) {
    return 'Please enter a valid 10-digit mobile number';
  }
  return undefined;
}


function handleError(res, err, defaultMsg) {
  console.error(defaultMsg, err);
  res.status(500).json({ error: defaultMsg });
}

module.exports = {
  buildVisitFilters,
  validateVisitData,
  handleError,
}; 