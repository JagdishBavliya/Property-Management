const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const apiRoutes = require('./routes/apiRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const brokerageRoutes = require('./routes/brokerageRoutes');
const estimateRoutes = require('./routes/EstimateRoutes');
const visitRoutes = require('./routes/visitRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes');


const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/test', (req, res) => res.send("You are on Property Management System"));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', apiRoutes)
app.use('/api/property', propertyRoutes);
app.use('/api/brokerage', brokerageRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Server Running Code
const PORT = process.env.PORT;
const URL = process.env.URL;
app.listen(PORT, () => { console.log(`Server running at ${URL}:${PORT}`); });