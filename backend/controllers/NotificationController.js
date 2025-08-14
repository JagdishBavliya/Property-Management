const db = require("../config/db")
const nodemailer = require("nodemailer")
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');

// Email transporter configuration (configure based on your email service)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// --- Helper: Build role-based SQL condition and params ---
function buildRoleBasedCondition(user, alias = 'n') {
  let condition = '';
  let params = [];
  if (user.role === 'agent') {
    condition += ` AND (${alias}.target_audience = 'all' OR ${alias}.target_audience = 'agents' OR (${alias}.target_audience = 'specific' AND FIND_IN_SET(?, ${alias}.specific_users)))`;
    params.push(user.code);
  } else if (user.role === 'manager') {
    condition += ` AND (${alias}.created_by = ? OR ${alias}.target_audience = 'all' OR ${alias}.target_audience = 'managers' OR (${alias}.target_audience = 'specific' AND FIND_IN_SET(?, ${alias}.specific_users)))`;
    params.push(user.id, user.code);
  }
  return { condition, params };
}

// --- Helper: Build filter SQL condition and params ---
function buildFilterCondition(filters, alias = 'n', userAlias = 'u') {
  let condition = '';
  let params = [];
  if (filters.search) {
    condition += ` AND (${alias}.title LIKE ? OR ${alias}.message LIKE ? OR ${userAlias}.name LIKE ?)`;
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  if (filters.type) {
    condition += ` AND ${alias}.type = ?`;
    params.push(filters.type);
  }
  if (filters.priority) {
    condition += ` AND ${alias}.priority = ?`;
    params.push(filters.priority);
  }
  if (filters.status) {
    if (filters.status === 'active') {
      condition += ` AND (${alias}.expires_at IS NULL OR ${alias}.expires_at > NOW()) AND (${alias}.scheduled_at IS NULL OR ${alias}.scheduled_at <= NOW())`;
    } else if (filters.status === 'expired') {
      condition += ` AND ${alias}.expires_at IS NOT NULL AND ${alias}.expires_at <= NOW()`;
    } else if (filters.status === 'scheduled') {
      condition += ` AND ${alias}.scheduled_at IS NOT NULL AND ${alias}.scheduled_at > NOW()`;
    }
  }
  if (filters.startDate) {
    condition += ` AND DATE(${alias}.created_at) >= ?`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    condition += ` AND DATE(${alias}.created_at) <= ?`;
    params.push(filters.endDate);
  }
  return { condition, params };
}

// --- List notifications with filtering and role-based access ---
// GET /api/notifications
// Supports search, type, priority, status, date filters, and role-based access
exports.list = async (req, res) => {
  try {
    const { search, type, priority, status, startDate, endDate, page = 1, limit = 20 } = req.query
    const user = req.user
    const offset = (page - 1) * limit

    // Use helpers for role-based and filter conditions
    let baseCondition = "1=1"
    let params = [user.id]
    let countParams = []

    // Role-based
    const roleCond = buildRoleBasedCondition(user, 'n')
    baseCondition += roleCond.condition
    params.push(...roleCond.params)
    countParams.push(...roleCond.params)

    // Filters
    const filterCond = buildFilterCondition({ search, type, priority, status, startDate, endDate }, 'n', 'u')
    baseCondition += filterCond.condition
    params.push(...filterCond.params)
    countParams.push(...filterCond.params)

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT n.id) as total 
       FROM notifications n 
       LEFT JOIN users u ON n.created_by = u.id
       WHERE ${baseCondition}`,
      countParams,
    )
    const total = countResult[0].total

    // Get notifications with pagination
    const [notifications] = await db.query(
      `SELECT 
        n.*,
        u.name as created_by_name,
        nr.read_at,
        CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END as is_read,
        DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i') as formatted_created_at,
        DATE_FORMAT(n.scheduled_at, '%Y-%m-%d %H:%i') as formatted_scheduled_at,
        DATE_FORMAT(n.expires_at, '%Y-%m-%d %H:%i') as formatted_expires_at
       FROM notifications n 
       LEFT JOIN users u ON n.created_by = u.id
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
       WHERE ${baseCondition}
       ORDER BY n.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, Number.parseInt(limit), Number.parseInt(offset)],
    )

    res.json({
      notifications,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("List notifications error:", err)
    res.status(500).json({ error: err.message || "Failed to fetch notifications" })
  }
}

// --- Create new notification ---
// POST /api/notifications
// Only managers and admins can create. Supports email sending.
exports.create = async (req, res) => {
  try {
    const { title, message, type, priority, targetAudience, specificUsers, sendEmail, scheduledAt, expiresAt } =
      req.body
    const user = req.user


    // Validation
    if (!title || !message) {
      return res.status(400).json({
        error: "Title and message are required",
      })
    }

    // Role-based validation
    if (user.role === "agent") {
      return res.status(403).json({
        error: "Agents cannot create notifications",
      })
    }

    // --- NEW: Manager restrictions ---
    if (user.role === "manager") {
      if (targetAudience === "all" || targetAudience === "managers" || targetAudience === "admins") {
        return res.status(403).json({
          error: "Managers can only send notifications to their agents or specific users (their agents)",
        })
      }
      if (targetAudience === "specific") {
        if (!specificUsers) {
          return res.status(400).json({
            error: "Specific users are required when targeting specific users",
          })
        }
        const userCodes = specificUsers.split(",").map(code => code.trim()).filter(Boolean)
        if (userCodes.length === 0) {
          return res.status(400).json({
            error: "No valid user codes provided for specific users",
          })
        }
        const [agents] = await db.query(
          `SELECT code FROM users WHERE code IN (${userCodes.map(() => "?").join(",")}) AND manager_id = ? AND role = 'agent'`,
          [...userCodes, user.id]
        )
        if (agents.length !== userCodes.length) {
          return res.status(403).json({
            error: "Managers can only send notifications to their own agents",
          })
        }
      }
    }

    if (targetAudience === "specific" && !specificUsers) {
      return res.status(400).json({
        error: "Specific users are required when targeting specific users",
      })
    }

    const [result] = await db.query(
      `INSERT INTO notifications 
       (title, message, type, priority, target_audience, specific_users, email_sent, scheduled_at, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        message.trim(),
        type || "announcement",
        priority || "medium",
        targetAudience || "all",
        specificUsers?.trim() || null,
        sendEmail || false,
        scheduledAt || null,
        expiresAt || null,
        user.id,
      ],
    )

    // Send email notifications if requested
    if (sendEmail) {
      await sendEmailNotifications(result.insertId, {
        title,
        message,
        type,
        priority,
        targetAudience,
        specificUsers,
        scheduledAt,
        expiresAt,
        createdBy: user.name,
      })
    }

    res.json({
      success: true,
      id: result.insertId,
      message: "Notification created successfully",
    })
  } catch (err) {
    console.error("Create notification error:", err)
    res.status(500).json({ error: err.message || "Failed to create notification" })
  }
}

// --- Mark notification as read ---
// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user

    // Check if notification exists and user has access
    const [notification] = await db.query(`SELECT * FROM notifications WHERE id = ?`, [id])

    if (notification.length === 0) {
      return res.status(404).json({ error: "Notification not found." })
    }

    // Check access permissions
    const notif = notification[0]
    const hasAccess = await checkNotificationAccess(notif, user)

    if (!hasAccess) {
      return res.status(403).json({ error: "You do not have permission to perform this action." })
    }

    // Insert or update read status
    await db.query(
      `INSERT INTO notification_reads (notification_id, user_id, read_at) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE read_at = NOW()`,
      [id, user.id],
    )

    res.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (err) {
    console.error("Mark as read error:", err)
    res.status(500).json({ error: err.message || "Failed to mark notification as read" })
  }
}

// --- Bulk mark notifications as read ---
// POST /api/notifications/bulk-read
exports.bulkMarkAsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    const user = req.user;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No notification IDs provided" });
    }
    // Check access for each notification
    const [notifications] = await db.query(`SELECT * FROM notifications WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    for (const notif of notifications) {
      const hasAccess = await checkNotificationAccess(notif, user);
      if (!hasAccess) {
        return res.status(403).json({ error: "You do not have permission to perform this action." });
      }
    }
    // Mark as read
    for (const id of ids) {
      await db.query(
        `INSERT INTO notification_reads (notification_id, user_id, read_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE read_at = NOW()`,
        [id, user.id]
      );
    }
    res.json({ success: true, message: "Notifications marked as read" });
  } catch (err) {
    console.error("Bulk mark as read error:", err);
    res.status(500).json({ error: err.message || "Failed to mark notifications as read" });
  }
};

// --- Bulk delete notifications ---
// POST /api/notifications/bulk-delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    const user = req.user;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No notification IDs provided" });
    }
    // Check access for each notification
    let baseCondition = `id IN (${ids.map(() => '?').join(',')})`;
    const params = [...ids];
    if (user.role !== "admin" && user.role !== "super_admin") {
      baseCondition += " AND created_by = ?";
      params.push(user.id);
    }
    const [existingNotifications] = await db.query(
      `SELECT * FROM notifications WHERE ${baseCondition}`,
      params
    );
    if (existingNotifications.length === 0) {
      return res.status(403).json({ error: "You do not have permission to perform this action or notifications not found." });
    }
    // Delete notification reads first
    await db.query(
      `DELETE FROM notification_reads WHERE notification_id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    // Delete notifications
    await db.query(
      `DELETE FROM notifications WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    res.json({ success: true, message: "Notifications deleted successfully" });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ error: err.message || "Failed to delete notifications" });
  }
};

// --- Delete notification ---
// DELETE /api/notifications/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user

    let baseCondition = "id = ?"
    const params = [id]

    // Role-based permission check
    if (user.role !== "admin" && user.role !== "super_admin") {
      baseCondition += " AND created_by = ?"
      params.push(user.id)
    }

    const [existingNotification] = await db.query(`SELECT * FROM notifications WHERE ${baseCondition}`, params)

    if (existingNotification.length === 0) {
      return res.status(403).json({ error: "You do not have permission to perform this action or notification not found." })
    }

    // Delete notification reads first (foreign key constraint)
    await db.query("DELETE FROM notification_reads WHERE notification_id = ?", [id])

    // Delete notification
    await db.query("DELETE FROM notifications WHERE id = ?", [id])

    res.json({
      success: true,
      message: "Notification deleted successfully",
    })
  } catch (err) {
    console.error("Delete notification error:", err)
    res.status(500).json({ error: err.message || "Failed to delete notification" })
  }
}

// --- Get notification statistics ---
// GET /api/notifications/stats
exports.getStats = async (req, res) => {
  try {
    const user = req.user   
    const role = user.role ? user.role.toLowerCase() : ""
    let baseCondition = "1=1"
    const params = []

    // Role-based filtering
    if (role === "agent") {
      baseCondition += ` AND (
        target_audience = 'all' OR 
        target_audience = 'agents' OR 
        (target_audience = 'specific' AND FIND_IN_SET(?, specific_users))  
      )`
      params.push(user.code)
    } else if (role === "manager") {
      baseCondition += ` AND (
        created_by = ? OR
        target_audience = 'all' OR 
        target_audience = 'managers' OR 
        (target_audience = 'specific' AND FIND_IN_SET(?, specific_users))
      )`
      params.push(user.id, user.code)
    }

    // Get total notifications
    const [totalNotifications] = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE ${baseCondition}`,
      params,
    )

    const stats = {
      totalNotifications: totalNotifications[0].count,
      unreadCount: 0,
      sentToday: 0,
      activeNotifications: 0,
    }

    // --- Calculate unreadCount for all roles ---
    let unreadBaseCondition = baseCondition;
    let unreadParams = [...params];

    if (role === "agent") {
      // already handled in baseCondition/params
      if (!user.code) {
        // fallback logic as discussed earlier
        const [rows] = await db.query("SELECT code FROM users WHERE id = ?", [user.id]);
        if (rows.length > 0) {
          unreadParams = [user.id, rows[0].code];
        } else {
          unreadParams = [user.id, null];
        }
      } else {
        unreadParams = [user.id, user.code];
      }
      unreadBaseCondition = `
        (n.target_audience = 'all' OR 
         n.target_audience = 'agents' OR 
         (n.target_audience = 'specific' AND FIND_IN_SET(?, n.specific_users))
        )
      `;
    } else if (role === "manager") {
      unreadParams = [user.id, user.id, user.code];
      unreadBaseCondition = `
        (n.created_by = ? OR
         n.target_audience = 'all' OR 
         n.target_audience = 'managers' OR 
         (n.target_audience = 'specific' AND FIND_IN_SET(?, n.specific_users))
        )
      `;
    } else {
      // admin, super_admin, etc. - see all notifications
      unreadParams = [user.id];
      unreadBaseCondition = "1=1";
    }

    const [unreadCount] = await db.query(
      `SELECT COUNT(*) as count 
       FROM notifications n
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
       WHERE ${unreadBaseCondition} AND nr.id IS NULL`,
      unreadParams
    );
    stats.unreadCount = unreadCount[0].count;

    if (role !== "agent") {
      // Get sent today count for managers and admins
      const [sentToday] = await db.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE DATE(created_at) = CURDATE() AND created_by = ?`,
        [user.id],
      )
      stats.sentToday = sentToday[0].count

      // Get active notifications count
      const [activeNotifications] = await db.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE ${baseCondition} 
         AND (expires_at IS NULL OR expires_at > NOW()) 
         AND (scheduled_at IS NULL OR scheduled_at <= NOW())`,
        params,
      )
      stats.activeNotifications = activeNotifications[0].count
    }

    res.json(stats)
  } catch (err) {
    console.error("Get stats error:", err)
    res.status(500).json({ error: err.message || "Failed to fetch statistics" })
  }
}

// --- Export notifications to CSV ---
// GET /api/notifications/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const user = req.user
    const { startDate, endDate, type, priority, status, search } = req.query

    const data = await getNotificationExportData(user, { startDate, endDate, type, priority, status, search })

    // Convert to CSV
    const csvHeader =
      "ID,Title,Message,Type,Priority,Target Audience,Specific Users,Email Sent,Created By,Created At,Scheduled At,Expires At\n"
    const csvRows = data
      .map(
        (row) =>
          `${row.id},"${row.title.replace(/"/g, '""')}","${row.message.replace(/"/g, '""')}","${row.type}","${row.priority}","${row.target_audience}","${row.specific_users || ""}","${row.email_sent ? "Yes" : "No"}","${row.created_by_name}","${row.created_at}","${row.scheduled_at || ""}","${row.expires_at || ""}"`,
      )
      .join("\n")

    const csv = csvHeader + csvRows

    res.setHeader("Content-Type", "text/csv")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="notifications_export_${new Date().toISOString().split("T")[0]}.csv"`,
    )
    res.send(csv)
  } catch (err) {
    console.error("Export CSV error:", err)
    res.status(500).json({ error: err.message || "Failed to export notifications" })
  }
}

// --- Export notifications to PDF ---
// GET /api/notifications/export/pdf
exports.exportPDF = async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate, type, priority, status, search } = req.query;
    const data = await getNotificationExportData(user, { startDate, endDate, type, priority, status, search });
    const headers = [
      "ID", "Title", "Message", "Type", "Priority", "Target Audience", "Specific Users", "Email Sent", "Created By", "Created At", "Scheduled At", "Expires At"
    ];
    // Render HTML from EJS template
    const html = await ejs.renderFile(
      path.join(__dirname, '../views/notificationPdfTemplate.ejs'),
      { headers, data }
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
      'Content-Disposition': `attachment; filename="notifications_export_${new Date().toISOString().split('T')[0]}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Export PDF error:', err);
    res.status(500).json({ error: err.message || 'Failed to export notifications as PDF' });
  }
};

// Helper function to check notification access
const checkNotificationAccess = async (notification, user) => {
  const role = user.role ? user.role.toLowerCase() : ""
  if (notification.target_audience === "all") {
    return true
  } else if (notification.target_audience === "agents" && role === "agent") {
    return true
  } else if (notification.target_audience === "managers" && role === "manager") {
    return true
  } else if (notification.target_audience === "admins" && (role === "admin" || role === "super admin")) {
    return true
  } else if (notification.target_audience === "specific" && notification.specific_users) {
    return notification.specific_users.split(",").includes(user.code)
  }
  return false
}

// Helper function to get notification export data
const getNotificationExportData = async (user, filters) => {
  let baseCondition = "1=1"
  const params = []

  // Role-based filtering
  if (user.role === "agent") {
    baseCondition += ` AND (
      n.target_audience = 'all' OR 
      n.target_audience = 'agents' OR 
      (n.target_audience = 'specific' AND FIND_IN_SET(?, n.specific_users))
    )`
    params.push(user.code)
  } else if (user.role === "manager") {
    baseCondition += ` AND (
      n.created_by = ? OR
      n.target_audience = 'all' OR 
      n.target_audience = 'managers' OR 
      (n.target_audience = 'specific' AND FIND_IN_SET(?, n.specific_users))
    )`
    params.push(user.id, user.code)
  }

  // Apply filters
  if (filters.startDate) {
    baseCondition += " AND DATE(n.created_at) >= ?"
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    baseCondition += " AND DATE(n.created_at) <= ?"
    params.push(filters.endDate)
  }
  if (filters.type) {
    baseCondition += " AND n.type = ?"
    params.push(filters.type)
  }
  if (filters.priority) {
    baseCondition += " AND n.priority = ?"
    params.push(filters.priority)
  }
  if (filters.status) {
    if (filters.status === 'active') {
      baseCondition += " AND (n.expires_at IS NULL OR n.expires_at > NOW()) AND (n.scheduled_at IS NULL OR n.scheduled_at <= NOW())";
    } else if (filters.status === 'expired') {
      baseCondition += " AND n.expires_at IS NOT NULL AND n.expires_at <= NOW()";
    } else if (filters.status === 'scheduled') {
      baseCondition += " AND n.scheduled_at IS NOT NULL AND n.scheduled_at > NOW()";
    }
  }
  if (filters.search) {
    const searchParam = `%${filters.search}%`;
    baseCondition += " AND (n.title LIKE ? OR n.message LIKE ? OR u.name LIKE ?)";
    params.push(searchParam, searchParam, searchParam);
  }

  const [data] = await db.query(
    `SELECT 
      n.id,
      n.title,
      n.message,
      n.type,
      n.priority,
      n.target_audience,
      n.specific_users,
      n.email_sent,
      u.name as created_by_name,
      DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i') as created_at,
      DATE_FORMAT(n.scheduled_at, '%Y-%m-%d %H:%i') as scheduled_at,
      DATE_FORMAT(n.expires_at, '%Y-%m-%d %H:%i') as expires_at
     FROM notifications n 
     LEFT JOIN users u ON n.created_by = u.id
     WHERE ${baseCondition}
     ORDER BY n.created_at DESC`,
    params,
  )

  return data
}

// Helper function to send email notifications
const sendEmailNotifications = async (notificationId, notificationData) => {
  try {
    const { title, message, type, priority, targetAudience, specificUsers, scheduledAt, expiresAt, createdBy } = notificationData

    const recipients = await getEmailRecipients(targetAudience, specificUsers)

    // Send emails if recipients exist
    if (recipients.length > 0) {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@brokeragefirm.com",
        to: recipients.join(","),
        subject: `[Brokerage Firm] ${title}`,
        html: generateEmailTemplate({ title, message, type, priority, targetAudience, scheduledAt, expiresAt, createdAt: new Date(), createdBy }),
      }

      try {
        const info = await emailTransporter.sendMail(mailOptions)
        console.log("Email sent successfully:", info.response || info);
      } catch (emailErr) {
        console.error("Error sending email:", emailErr);
      }

      // Update notification to mark email as sent
      await db.query("UPDATE notifications SET email_sent = 1 WHERE id = ?", [notificationId])
    }
  } catch (err) {
    console.error("Send email notifications error:", err)
    // Don't throw error to prevent notification creation from failing
  }
}

// Helper function to get email recipients
const getEmailRecipients = async (targetAudience, specificUsers) => {
  let recipients = []

  try {
    if (targetAudience === "all") {
      const [users] = await db.query("SELECT email FROM users WHERE email IS NOT NULL")
      recipients = users.map((user) => user.email)
    } else if (targetAudience === "agents") {
      const [users] = await db.query(
        `SELECT u.email 
         FROM users u 
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Agent' AND u.email IS NOT NULL`,
      )
      recipients = users.map((user) => user.email)
    } else if (targetAudience === "managers") {
      const [users] = await db.query(
        `SELECT u.email 
         FROM users u 
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE r.name = 'Manager' AND u.email IS NOT NULL`,
      )
      recipients = users.map((user) => user.email)
    } else if (targetAudience === "admins") {
      const [users] = await db.query(
        `SELECT u.email 
         FROM users u 
         JOIN model_has_roles mhr ON u.id = mhr.model_id
         JOIN roles r ON mhr.role_id = r.id
         WHERE (r.name = 'Admin' OR r.name = 'Super Admin') AND u.email IS NOT NULL`,
      )
      recipients = users.map((user) => user.email)
    } else if (targetAudience === "specific" && specificUsers) {
      const userCodes = specificUsers.split(",").map((code) => code.trim())
      const placeholders = userCodes.map(() => "?").join(",")
      const [users] = await db.query(
        `SELECT email FROM users WHERE user_code IN (${placeholders}) AND email IS NOT NULL`,
        userCodes,
      )
      recipients = users.map((user) => user.email)
    }
  } catch (err) {
    console.error("Error getting email recipients:", err)
  }

  return recipients.filter((email) => email) // Remove null/undefined emails
}

// Helper function to generate email template
const generateEmailTemplate = ({
  title,
  message,
  type,
  priority,
  targetAudience,
  scheduledAt,
  expiresAt,
  createdAt,
  createdBy
}) => {
  return `
  <div style="background: #f4f6fb; padding: 32px 0; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden;">
      <div style="background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%); padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 2rem; font-weight: 700; letter-spacing: 1px;">🔔 New Notification</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1e293b; font-size: 1.5rem; margin-bottom: 8px;">${title}</h2>
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; background: #e0e7ff; color: #3730a3; border-radius: 6px; padding: 4px 12px; font-size: 0.95rem; margin-right: 8px; text-transform: capitalize;">${type ? type.replace(/_/g, ' ') : 'General'}</span>
          <span style="display: inline-block; background: #fef9c3; color: #b45309; border-radius: 6px; padding: 4px 12px; font-size: 0.95rem; margin-right: 8px; text-transform: capitalize;">${priority || 'Medium'}</span>
          <span style="display: inline-block; background: #d1fae5; color: #065f46; border-radius: 6px; padding: 4px 12px; font-size: 0.95rem; text-transform: capitalize;">${targetAudience ? targetAudience.replace(/_/g, ' ') : 'All Users'}</span>
        </div>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px; color: #334155; font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap;">
          ${message}
        </div>
        <table style="width: 100%; font-size: 0.98rem; color: #475569; margin-bottom: 24px;">
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Sent by:</td>
            <td>${createdBy || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Created At:</td>
            <td>${createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}</td>
          </tr>
          ${scheduledAt ? `<tr>
            <td style="padding: 4px 0; font-weight: 600;">Scheduled For:</td>
            <td>${new Date(scheduledAt).toLocaleString()}</td>
          </tr>` : ''}
          ${expiresAt ? `<tr>
            <td style="padding: 4px 0; font-weight: 600;">Expires At:</td>
            <td>${new Date(expiresAt).toLocaleString()}</td>
          </tr>` : ''}
        </table>
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background: #2563eb; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 1rem;">Go to Dashboard</a>
        </div>
      </div>
      <div style="background: #f1f5f9; color: #64748b; text-align: center; padding: 16px; font-size: 0.95rem;">
        This is an automated message from the Brokerage Firm Management System.<br>
        &copy; ${new Date().getFullYear()} Brokerage Firm. All rights reserved.
      </div>
    </div>
  </div>
  `;
};
