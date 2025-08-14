const db = require("../config/db")
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');

// --- Helper for error responses ---
function sendError(res, message, status = 500) {
  res.status(status).json({ error: message });
}

// --- Property Reports ---
exports.getPropertyReports = async (req, res) => {
  try {
    const { startDate, endDate, city, propertyType } = req.query
    const user = req.user

    let baseCondition = "1=1"
    const params = []

    // Role-based filtering
    if (user.role === "agent") {
      baseCondition += " AND agent_code = ?"
      params.push(user.code)
    } else if (user.role === "manager") {
      baseCondition += " AND manager_code = ?"
      params.push(user.code)
    }

    // Date filtering
    if (startDate) {
      baseCondition += " AND deal_date >= ?"
      params.push(startDate)
    }
    if (endDate) {
      baseCondition += " AND deal_date <= ?"
      params.push(endDate)
    }
    if (city) {
      baseCondition += " AND city = ?"
      params.push(city)
    }
    if (propertyType) {
      baseCondition += " AND property_type = ?"
      params.push(propertyType)
    }

    // Get total deals and amounts
    const [totalStats] = await db.query(
      `SELECT 
        COUNT(*) as total_deals,
        SUM(CASE WHEN deal_status = 'Completed' THEN 1 ELSE 0 END) as completed_deals,
        SUM(CASE WHEN deal_status = 'Completed' THEN deal_amount ELSE 0 END) as total_amount,
        AVG(CASE WHEN deal_status = 'Completed' THEN deal_amount ELSE NULL END) as avg_deal_amount
       FROM deals 
       WHERE ${baseCondition}`,
      params,
    )

    // Get deals by property type
    const [propertyTypeStats] = await db.query(
      `SELECT 
        property_type,
        COUNT(*) as count,
        SUM(CASE WHEN deal_status = 'Completed' THEN deal_amount ELSE 0 END) as total_amount
       FROM deals 
       WHERE ${baseCondition}
       GROUP BY property_type
       ORDER BY total_amount DESC`,
      params,
    )

    // Get deals by city
    const [cityStats] = await db.query(
      `SELECT 
        city,
        COUNT(*) as count,
        SUM(CASE WHEN deal_status = 'Completed' THEN deal_amount ELSE 0 END) as total_amount
       FROM deals 
       WHERE ${baseCondition}
       GROUP BY city
       ORDER BY total_amount DESC`,
      params,
    )

    // Get monthly trends
    const [monthlyTrends] = await db.query(
      `SELECT 
        DATE_FORMAT(deal_date, '%Y-%m') as month,
        COUNT(*) as deals_count,
        SUM(CASE WHEN deal_status = 'Completed' THEN deal_amount ELSE 0 END) as total_amount
       FROM deals 
       WHERE ${baseCondition}
       GROUP BY DATE_FORMAT(deal_date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`,
      params,
    )

    res.json({
      totalStats: totalStats[0],
      propertyTypeStats,
      cityStats,
      monthlyTrends,
    })
  } catch (err) {
    console.error("Property reports error:", err);
    sendError(res, err.message || "Failed to fetch property reports", 500);
  }
}

// --- Agent Reports ---
exports.getAgentReports = async (req, res) => {
  try {
    const { startDate, endDate, agentCode } = req.query
    const user = req.user

    let baseCondition = "1=1"
    const params = []

    if (user.role === "agent") {
      baseCondition += " AND d.agent_code = ?"
      params.push(user.code)
    } else if (user.role === "manager") {
      baseCondition += " AND d.manager_code = ?"
      params.push(user.code)
    }

    if (startDate) {
      baseCondition += " AND d.deal_date >= ?"
      params.push(startDate)
    }
    if (endDate) {
      baseCondition += " AND d.deal_date <= ?"
      params.push(endDate)
    }
    if (agentCode && user.role !== "agent") {
      baseCondition += " AND d.agent_code = ?"
      params.push(agentCode)
    }

    const [agentStats] = await db.query(
      `SELECT 
        d.agent_code,
        COUNT(d.id) as total_deals,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN 1 ELSE 0 END) as completed_deals,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN d.commission_amount ELSE 0 END) as total_commission,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN d.deal_amount ELSE 0 END) as total_deal_amount,
        COALESCE(ao.overdraft_amount, 0) as overdraft_amount,
        COALESCE(ao.credit_limit, 0) as credit_limit
       FROM deals d
       LEFT JOIN agent_overdrafts ao ON d.agent_code = ao.agent_code
       WHERE ${baseCondition}
       GROUP BY d.agent_code, ao.overdraft_amount, ao.credit_limit
       ORDER BY total_commission DESC`,
      params,
    )

    let topAgents = []
    if (user.role !== "agent") {
      const [topAgentsData] = await db.query(
        `SELECT 
          d.agent_code,
          SUM(CASE WHEN d.deal_status = 'Completed' THEN d.commission_amount ELSE 0 END) as total_commission,
          COUNT(CASE WHEN d.deal_status = 'Completed' THEN 1 END) as completed_deals
         FROM deals d
         WHERE ${baseCondition}
         GROUP BY d.agent_code
         ORDER BY total_commission DESC
         LIMIT 10`,
        params,
      )
      topAgents = topAgentsData
    }

    // Get commission trends
    const [commissionTrends] = await db.query(
      `SELECT 
        DATE_FORMAT(d.deal_date, '%Y-%m') as month,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN d.commission_amount ELSE 0 END) as total_commission
       FROM deals d
       WHERE ${baseCondition}
       GROUP BY DATE_FORMAT(d.deal_date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`,
      params,
    )

    res.json({
      agentStats,
      topAgents,
      commissionTrends,
    })
  } catch (err) {
    console.error("Agent reports error:", err);
    sendError(res, err.message || "Failed to fetch agent reports", 500);
  }
}

// --- Manager Reports ---
exports.getManagerReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const user = req.user

    // Only managers and admins can access this
    if (user.role === "agent") {
      return sendError(res, "You do not have permission to perform this action.", 403)
    }

    let baseCondition = "1=1"
    const params = []

    // Role-based filtering
    if (user.role === "manager") {
      baseCondition += " AND d.manager_code = ?"
      params.push(user.code)
    }

    // Date filtering
    if (startDate) {
      baseCondition += " AND d.deal_date >= ?"
      params.push(startDate)
    }
    if (endDate) {
      baseCondition += " AND d.deal_date <= ?"
      params.push(endDate)
    }

    // Get team performance by manager
    const [teamStats] = await db.query(
      `SELECT 
        d.manager_code,
        COUNT(DISTINCT d.agent_code) as team_size,
        COUNT(d.id) as total_deals,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN 1 ELSE 0 END) as completed_deals,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN d.commission_amount ELSE 0 END) as total_commission,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN d.deal_amount ELSE 0 END) as total_deal_amount
       FROM deals d
       WHERE ${baseCondition} AND d.manager_code IS NOT NULL
       GROUP BY d.manager_code
       ORDER BY total_commission DESC`,
      params,
    )

    // Get individual agent performance under managers
    const [agentPerformance] = await db.query(
      `SELECT 
        d.manager_code,
        d.agent_code,
        COUNT(d.id) as total_deals,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN 1 ELSE 0 END) as completed_deals,
        SUM(CASE WHEN d.deal_status = 'Completed' THEN d.commission_amount ELSE 0 END) as total_commission
       FROM deals d
       WHERE ${baseCondition} AND d.manager_code IS NOT NULL
       GROUP BY d.manager_code, d.agent_code
       ORDER BY d.manager_code, total_commission DESC`,
      params,
    )

    res.json({
      teamStats,
      agentPerformance,
    })
  } catch (err) {
    console.error("Manager reports error:", err);
    sendError(res, err.message || "Failed to fetch manager reports", 500);
  }
}

// --- Brokerage Reports ---
exports.getBrokerageReports = async (req, res) => {
  try {
    const { startDate, endDate, paymentMode } = req.query
    const user = req.user

    let baseCondition = "1=1"
    const params = []

    // Role-based filtering
    if (user.role === "agent") {
      baseCondition += " AND agent_code = ?"
      params.push(user.code)
    } else if (user.role === "manager") {
      baseCondition += " AND manager_code = ?"
      params.push(user.code)
    }

    // Date filtering
    if (startDate) {
      baseCondition += " AND deal_date >= ?"
      params.push(startDate)
    }
    if (endDate) {
      baseCondition += " AND deal_date <= ?"
      params.push(endDate)
    }
    if (paymentMode) {
      baseCondition += " AND payment_mode = ?"
      params.push(paymentMode)
    }

    // Get total brokerage stats
    const [brokerageStats] = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN deal_status = 'Completed' THEN brokerage_amount ELSE 0 END) as total_brokerage,
        SUM(CASE WHEN deal_status = 'Completed' THEN commission_amount ELSE 0 END) as total_commission,
        AVG(CASE WHEN deal_status = 'Completed' THEN brokerage_amount ELSE NULL END) as avg_brokerage
       FROM deals 
       WHERE ${baseCondition}`,
      params,
    )

    // Get brokerage by payment mode
    const [paymentModeStats] = await db.query(
      `SELECT 
        payment_mode,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN deal_status = 'Completed' THEN brokerage_amount ELSE 0 END) as total_brokerage
       FROM deals 
       WHERE ${baseCondition}
       GROUP BY payment_mode
       ORDER BY total_brokerage DESC`,
      params,
    )

    // Get commission splits (agent vs company)
    const [commissionSplits] = await db.query(
      `SELECT 
        SUM(CASE WHEN deal_status = 'Completed' THEN commission_amount ELSE 0 END) as agent_commission,
        SUM(CASE WHEN deal_status = 'Completed' THEN (brokerage_amount - commission_amount) ELSE 0 END) as company_share
       FROM deals 
       WHERE ${baseCondition}`,
      params,
    )

    // Get monthly brokerage trends
    const [monthlyBrokerage] = await db.query(
      `SELECT 
        DATE_FORMAT(deal_date, '%Y-%m') as month,
        SUM(CASE WHEN deal_status = 'Completed' THEN brokerage_amount ELSE 0 END) as total_brokerage,
        COUNT(CASE WHEN deal_status = 'Completed' THEN 1 END) as completed_deals
       FROM deals 
       WHERE ${baseCondition}
       GROUP BY DATE_FORMAT(deal_date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`,
      params,
    )

    res.json({
      brokerageStats: brokerageStats[0],
      paymentModeStats,
      commissionSplits: commissionSplits[0],
      monthlyBrokerage,
    })
  } catch (err) {
    console.error("Brokerage reports error:", err);
    sendError(res, err.message || "Failed to fetch brokerage reports", 500);
  }
}

// --- Visit Reports ---
exports.getVisitReports = async (req, res) => {
  try {
    const { startDate, endDate, agentCode } = req.query
    const user = req.user

    let baseCondition = "1=1"
    const params = []

    // Role-based filtering
    if (user.role === "agent") {
      baseCondition += " AND agent_code = ?"
      params.push(user.code)
    } else if (user.role === "manager") {
      baseCondition += " AND manager_code = ?"
      params.push(user.code)
    }

    // Additional filters
    if (startDate) {
      baseCondition += " AND DATE(visit_date) >= ?"
      params.push(startDate)
    }
    if (endDate) {
      baseCondition += " AND DATE(visit_date) <= ?"
      params.push(endDate)
    }
    if (agentCode && user.role !== "agent") {
      baseCondition += " AND agent_code = ?"
      params.push(agentCode)
    }

    // Get visit frequency stats
    const [visitStats] = await db.query(
      `SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT agent_code) as active_agents,
        COUNT(DISTINCT property_code) as properties_visited,
        SUM(CASE WHEN visit_status = 'Converted' THEN 1 ELSE 0 END) as converted_visits,
        SUM(CASE WHEN visit_status = 'Interested' THEN 1 ELSE 0 END) as interested_visits,
        ROUND((SUM(CASE WHEN visit_status = 'Converted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as conversion_rate
       FROM visits 
       WHERE ${baseCondition}`,
      params,
    )

    // Get conversion rates by agent
    const [agentConversion] = await db.query(
      `SELECT 
        agent_code,
        COUNT(*) as total_visits,
        SUM(CASE WHEN visit_status = 'Converted' THEN 1 ELSE 0 END) as converted_visits,
        ROUND((SUM(CASE WHEN visit_status = 'Converted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as conversion_rate
       FROM visits 
       WHERE ${baseCondition}
       GROUP BY agent_code
       HAVING COUNT(*) > 0
       ORDER BY conversion_rate DESC`,
      params,
    )

    // Get visit trends by status
    const [statusTrends] = await db.query(
      `SELECT 
        visit_status,
        COUNT(*) as count
       FROM visits 
       WHERE ${baseCondition}
       GROUP BY visit_status
       ORDER BY count DESC`,
      params,
    )

    // Get daily visit frequency
    const [dailyVisits] = await db.query(
      `SELECT 
        DATE(visit_date) as visit_date,
        COUNT(*) as visit_count
       FROM visits 
       WHERE ${baseCondition} AND visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(visit_date)
       ORDER BY visit_date DESC`,
      params,
    )

    res.json({
      visitStats: visitStats[0],
      agentConversion,
      statusTrends,
      dailyVisits,
    })
  } catch (err) {
    console.error("Visit reports error:", err);
    sendError(res, err.message || "Failed to fetch visit reports", 500);
  }
}

// --- Export reports to CSV ---
exports.exportReportsCSV = async (req, res) => {
  try {
    const { reportType, startDate, endDate, ...filters } = req.query
    const user = req.user

    let data = []
    let filename = "report"
    let headers = []

    switch (reportType) {
      case "property":
        const propertyData = await getPropertyReportData(user, { startDate, endDate, ...filters })
        data = propertyData
        filename = "property_report"
        headers = ["Property Code", "Property Type", "City", "Deal Amount", "Status", "Deal Date"]
        break

      case "agent":
        const agentData = await getAgentReportData(user, { startDate, endDate, ...filters })
        data = agentData
        filename = "agent_report"
        headers = ["Agent Code", "Total Deals", "Completed Deals", "Commission Earned", "Overdraft Amount"]
        break

      case "brokerage":
        const brokerageData = await getBrokerageReportData(user, { startDate, endDate, ...filters })
        data = brokerageData
        filename = "brokerage_report"
        headers = ["Deal ID", "Property Code", "Agent Code", "Brokerage Amount", "Payment Mode", "Deal Date"]
        break

      case "visit":
        const visitData = await getVisitReportData(user, { startDate, endDate, ...filters })
        data = visitData
        filename = "visit_report"
        headers = ["Visit ID", "Agent Code", "Property Code", "Client Name", "Visit Status", "Visit Date"]
        break

      default:
        return sendError(res, "Invalid report type", 400)
    }

    // Convert to CSV
    const csvHeader = headers.join(",") + "\n"
    const csvRows = data
      .map((row) =>
        Object.values(row)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n")

    const csv = csvHeader + csvRows

    res.setHeader("Content-Type", "text/csv")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}_${new Date().toISOString().split("T")[0]}.csv"`,
    )
    res.send(csv)
  } catch (err) {
    console.error("Export CSV error:", err);
    sendError(res, err.message || "Failed to export report", 500);
  }
}

// --- Export reports to PDF ---
exports.exportReportsPDF = async (req, res) => {
  try {
    const { reportType, startDate, endDate, ...filters } = req.query;
    const user = req.user;

    let data = [];
    let filename = 'report';
    let headers = [];

    switch (reportType) {
      case 'property':
        data = await getPropertyReportData(user, { startDate, endDate, ...filters });
        filename = 'property_report';
        headers = ["Property Code", "Property Type", "City", "Deal Amount", "Status", "Deal Date"];
        break;
      case 'agent':
        data = await getAgentReportData(user, { startDate, endDate, ...filters });
        filename = 'agent_report';
        headers = ["Agent Code", "Total Deals", "Completed Deals", "Commission Earned", "Overdraft Amount"];
        break;
      case 'brokerage':
        data = await getBrokerageReportData(user, { startDate, endDate, ...filters });
        filename = 'brokerage_report';
        headers = ["Deal ID", "Property Code", "Agent Code", "Brokerage Amount", "Payment Mode", "Deal Date"];
        break;
      case 'visit':
        data = await getVisitReportData(user, { startDate, endDate, ...filters });
        filename = 'visit_report';
        headers = ["Visit ID", "Agent Code", "Property Code", "Client Name", "Visit Status", "Visit Date"];
        break;
      default:
        return sendError(res, 'Invalid report type', 400);
    }

    // Render HTML from EJS template
    const html = await ejs.renderFile(
      path.join(__dirname, '../views/reportPdfTemplate.ejs'),
      { headers, data, reportType }
    );

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
      scale: 0.9,
    });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Export PDF error:', err);
    sendError(res, err.message || 'Failed to export report as PDF', 500);
  }
};

// --- Helper functions for CSV export ---
const getPropertyReportData = async (user, filters) => {
  let baseCondition = "1=1"
  const params = []

  if (user.role === "agent") {
    baseCondition += " AND agent_code = ?"
    params.push(user.code)
  } else if (user.role === "manager") {
    baseCondition += " AND manager_code = ?"
    params.push(user.code)
  }

  if (filters.startDate) {
    baseCondition += " AND deal_date >= ?"
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    baseCondition += " AND deal_date <= ?"
    params.push(filters.endDate)
  }
  if (filters.city) {
    baseCondition += " AND city = ?"
    params.push(filters.city)
  }
  if (filters.propertyType) {
    baseCondition += " AND property_type = ?"
    params.push(filters.propertyType)
  }

  const [data] = await db.query(
    `SELECT property_code, property_type, city, deal_amount, deal_status, deal_date
     FROM deals 
     WHERE ${baseCondition}
     ORDER BY deal_date DESC`,
    params,
  )

  return data
}

const getAgentReportData = async (user, filters) => {
  let baseCondition = "1=1"
  const params = []

  if (user.role === "agent") {
    baseCondition += " AND d.agent_code = ?"
    params.push(user.code)
  } else if (user.role === "manager") {
    baseCondition += " AND d.manager_code = ?"
    params.push(user.code)
  }

  if (filters.startDate) {
    baseCondition += " AND d.deal_date >= ?"
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    baseCondition += " AND d.deal_date <= ?"
    params.push(filters.endDate)
  }
  if (filters.agentCode && user.role !== "agent") {
    baseCondition += " AND d.agent_code = ?"
    params.push(filters.agentCode)
  }

  const [data] = await db.query(
    `SELECT 
      d.agent_code,
      COUNT(d.id) as total_deals,
      SUM(CASE WHEN d.deal_status = 'Completed' THEN 1 ELSE 0 END) as completed_deals,
      SUM(CASE WHEN d.deal_status = 'Completed' THEN d.commission_amount ELSE 0 END) as commission_earned,
      COALESCE(ao.overdraft_amount, 0) as overdraft_amount
     FROM deals d
     LEFT JOIN agent_overdrafts ao ON d.agent_code = ao.agent_code
     WHERE ${baseCondition}
     GROUP BY d.agent_code, ao.overdraft_amount`,
    params,
  )

  return data
}

const getBrokerageReportData = async (user, filters) => {
  let baseCondition = "1=1"
  const params = []

  if (user.role === "agent") {
    baseCondition += " AND agent_code = ?"
    params.push(user.code)
  } else if (user.role === "manager") {
    baseCondition += " AND manager_code = ?"
    params.push(user.code)
  }

  if (filters.startDate) {
    baseCondition += " AND deal_date >= ?"
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    baseCondition += " AND deal_date <= ?"
    params.push(filters.endDate)
  }
  if (filters.paymentMode) {
    baseCondition += " AND payment_mode = ?"
    params.push(filters.paymentMode)
  }

  const [data] = await db.query(
    `SELECT id, property_code, agent_code, brokerage_amount, payment_mode, deal_date
     FROM deals 
     WHERE ${baseCondition}
     ORDER BY deal_date DESC`,
    params,
  )

  return data
}

const getVisitReportData = async (user, filters) => {
  let baseCondition = "1=1"
  const params = []

  if (user.role === "agent") {
    baseCondition += " AND agent_code = ?"
    params.push(user.code)
  } else if (user.role === "manager") {
    baseCondition += " AND manager_code = ?"
    params.push(user.code)
  }

  if (filters.startDate) {
    baseCondition += " AND DATE(visit_date) >= ?"
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    baseCondition += " AND DATE(visit_date) <= ?"
    params.push(filters.endDate)
  }
  if (filters.status) {
    baseCondition += " AND visit_status = ?"
    params.push(filters.status)
  }

  const [data] = await db.query(
    `SELECT id, agent_code, property_code, client_name, visit_status, visit_date
     FROM visits 
     WHERE ${baseCondition}
     ORDER BY visit_date DESC`,
    params,
  )

  return data
}
