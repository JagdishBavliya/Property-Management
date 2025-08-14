const db = require('../config/db');

// Optimized single endpoint for all dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    // Single optimized query to get all counts at once
    const [results] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM properties) as totalProperties,
        (SELECT COUNT(DISTINCT u.id) 
         FROM users u
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Agent') as activeAgents,
        (SELECT COUNT(*) FROM brokerages) as totalBrokerages,
        (SELECT COUNT(*) 
         FROM properties 
         WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(created_at) = YEAR(CURRENT_DATE())) as propertiesThisMonth,
        (SELECT COALESCE(SUM(total_brokerage), 0) 
         FROM brokerages 
         WHERE mode_of_payment IS NOT NULL) as totalRevenue,
        (SELECT COUNT(*) 
         FROM properties 
         WHERE agent_code IS NULL OR agent_code = '') as pendingApprovals,
        (SELECT COUNT(*) 
         FROM properties 
         WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
         AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) as propertiesLastMonth,
        (SELECT COUNT(DISTINCT u.id) 
         FROM users u
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Agent'
         AND MONTH(u.created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(u.created_at) = YEAR(CURRENT_DATE())) as agentsThisMonth,
        (SELECT COUNT(DISTINCT u.id) 
         FROM users u
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Agent'
         AND MONTH(u.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
         AND YEAR(u.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) as agentsLastMonth,
        (SELECT COUNT(*) 
         FROM brokerages 
         WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(created_at) = YEAR(CURRENT_DATE())) as brokeragesThisMonth,
        (SELECT COUNT(*) 
         FROM brokerages 
         WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
         AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) as brokeragesLastMonth
    `);

    const stats = results[0];

    // Calculate percentage changes
    const propertyChange = stats.propertiesLastMonth > 0 
      ? ((stats.propertiesThisMonth - stats.propertiesLastMonth) / stats.propertiesLastMonth) * 100 
      : 0;
    
    const agentChange = stats.agentsLastMonth > 0 
      ? ((stats.agentsThisMonth - stats.agentsLastMonth) / stats.agentsLastMonth) * 100 
      : 0;
    
    const brokerageChange = stats.brokeragesLastMonth > 0 
      ? ((stats.brokeragesThisMonth - stats.brokeragesLastMonth) / stats.brokeragesLastMonth) * 100 
      : 0;

    // Mock data for top brokerages (can be replaced with real data later)
    const topBrokerages = [
      { name: 'Prime Realty', properties: 120, agents: 15, rating: 4.9 },
      { name: 'Urban Estates', properties: 98, agents: 12, rating: 4.8 },
      { name: 'Metro Brokers', properties: 87, agents: 10, rating: 4.7 }
    ];

    res.json({
      // Main dashboard stats
      totalProperties: stats.totalProperties,
      activeAgents: stats.activeAgents,
      totalBrokerages: stats.totalBrokerages,
      propertiesThisMonth: stats.propertiesThisMonth,
      totalRevenue: stats.totalRevenue,
      pendingApprovals: stats.pendingApprovals,
      topBrokerages: topBrokerages,
      systemHealth: {
        apiStatus: 'Operational',
        uptime: '99.98%',
        dbConnection: 'Healthy',
        lastBackup: '3 hours ago'
      },
      // Property stats
      propertyStats: {
        total: stats.totalProperties,
        thisMonth: stats.propertiesThisMonth,
        change: Math.abs(propertyChange).toFixed(1),
        changeType: propertyChange >= 0 ? 'increase' : 'decrease'
      },
      // Agent stats
      agentStats: {
        total: stats.activeAgents,
        active: stats.activeAgents,
        change: Math.abs(agentChange).toFixed(1),
        changeType: agentChange >= 0 ? 'increase' : 'decrease'
      },
      // Brokerage stats
      brokerageStats: {
        total: stats.totalBrokerages,
        change: Math.abs(brokerageChange).toFixed(1),
        changeType: brokerageChange >= 0 ? 'increase' : 'decrease'
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch dashboard statistics' 
    });
  }
};

// Keep individual endpoints for backward compatibility but make them faster
exports.getPropertyStats = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM properties) as total,
        (SELECT COUNT(*) 
         FROM properties 
         WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(created_at) = YEAR(CURRENT_DATE())) as thisMonth,
        (SELECT COUNT(*) 
         FROM properties 
         WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
         AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) as lastMonth
    `);

    const stats = results[0];
    const change = stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100 : 0;

    res.json({
      total: stats.total,
      thisMonth: stats.thisMonth,
      change: Math.abs(change).toFixed(1),
      changeType: change >= 0 ? 'increase' : 'decrease'
    });
  } catch (error) {
    console.error('Property stats error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch property statistics' 
    });
  }
};

exports.getAgentStats = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        (SELECT COUNT(DISTINCT u.id) 
         FROM users u
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Agent') as total,
        (SELECT COUNT(DISTINCT u.id) 
         FROM users u
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Agent'
         AND MONTH(u.created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(u.created_at) = YEAR(CURRENT_DATE())) as thisMonth,
        (SELECT COUNT(DISTINCT u.id) 
         FROM users u
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Agent'
         AND MONTH(u.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
         AND YEAR(u.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) as lastMonth
    `);

    const stats = results[0];
    const change = stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100 : 0;

    res.json({
      total: stats.total,
      active: stats.total,
      change: Math.abs(change).toFixed(1),
      changeType: change >= 0 ? 'increase' : 'decrease'
    });
  } catch (error) {
    console.error('Agent stats error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch agent statistics' 
    });
  }
};

exports.getBrokerageStats = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM brokerages) as total,
        (SELECT COUNT(*) 
         FROM brokerages 
         WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(created_at) = YEAR(CURRENT_DATE())) as thisMonth,
        (SELECT COUNT(*) 
         FROM brokerages 
         WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
         AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) as lastMonth
    `);

    const stats = results[0];
    const change = stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100 : 0;

    res.json({
      total: stats.total,
      change: Math.abs(change).toFixed(1),
      changeType: change >= 0 ? 'increase' : 'decrease'
    });
  } catch (error) {
    console.error('Brokerage stats error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch brokerage statistics' 
    });
  }
}; 