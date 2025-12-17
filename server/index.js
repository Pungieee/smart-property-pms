const express = require('express');
const cors = require('cors');

const app = express();
const rawData = require('./data.json');

app.use(cors());
app.use(express.json());

// --- Simple RBAC setup ---
const ROLE_PERMISSIONS = {
  admin: ['view_overview', 'view_sales', 'view_maintenance'],
  sales: ['view_overview', 'view_sales'],
  technician: ['view_overview', 'view_maintenance'],
};

const authorize = (requiredPermission) => (req, res, next) => {
  const role = (req.header('x-role') || 'sales').toLowerCase();
  const permissions = ROLE_PERMISSIONS[role] || [];

  if (!permissions.includes(requiredPermission)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions', role });
  }

  req.user = { role, permissions };
  next();
};

// --- Utility: transform raw data into "entities" ---
const toUnit = (item, index) => ({
  unitId: item.LISTINGID || `UNIT-${index + 1}`,
  projectName: item.PROJECTNAME || item.SUBLOCALITY || 'Unknown Project',
  address: item.FULLADDRESS || item.SUBLOCALITY || 'Unknown Address',
  subLocality: item.SUBLOCALITY,
  price: item.PRICE,
  sqft: item.PROPERTYSQFT,
  pricePerSqft: item.PROPERTYSQFT ? item.PRICE / item.PROPERTYSQFT : null,
  status: item.STATUS || (item.PRICE > 800000 ? 'Reserved' : 'Available'),
});

// API: Overview
app.get('/api/dashboard/overview', authorize('view_overview'), (req, res) => {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return res.json({ totalValue: 0, unitCount: 0, avgPrice: 0, byArea: [] });
  }

  const units = rawData.map(toUnit);

  const totalValue = units.reduce((sum, u) => sum + (u.price || 0), 0);
  const unitCount = units.length;
  const avgPrice = unitCount > 0 ? totalValue / unitCount : 0;

  const areaMap = {};
  units.forEach((u) => {
    const area = u.subLocality || 'Unknown';
    if (!areaMap[area]) {
      areaMap[area] = { name: area, totalPrice: 0, count: 0 };
    }
    areaMap[area].totalPrice += u.price || 0;
    areaMap[area].count += 1;
  });

  const byArea = Object.values(areaMap)
    .map((item) => ({
      name: item.name,
      avgPrice: item.count ? Math.round(item.totalPrice / item.count) : 0,
      count: item.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    totalValue,
    unitCount,
    avgPrice,
    byArea,
  });
});

// API: Property insights
app.get('/api/property-insights', authorize('view_overview'), (req, res) => {
  const insights = rawData.map((item, index) => {
    const unit = toUnit(item, index);
    return {
      ...unit,
      original: item,
      isPremium: item.PRICE > 1000000,
    };
  });

  res.json(insights);
});

// API: Units / Inventory (Sales-focused)
app.get('/api/properties', authorize('view_sales'), (req, res) => {
  const { status, area } = req.query;

  let units = rawData.map(toUnit);

  if (status) {
    units = units.filter((u) => String(u.status).toLowerCase() === String(status).toLowerCase());
  }

  if (area) {
    units = units.filter(
      (u) => u.subLocality && u.subLocality.toLowerCase().includes(area.toLowerCase())
    );
  }

  res.json(units.slice(0, 200));
});

// API: Mock "contracts" linking units to buyers and payment schedules
app.get('/api/sales/contracts', authorize('view_sales'), (req, res) => {
  const units = rawData.slice(0, 100).map(toUnit); // subset for demo

  const contracts = units.map((unit, index) => ({
    contractId: `CN-${index + 1}`,
    unitId: unit.unitId,
    buyerName: `Buyer ${index + 1}`,
    bookingDate: new Date(Date.now() - index * 86400000).toISOString(),
    totalPrice: unit.price,
    downPayment: Math.round(unit.price * 0.2),
    installmentSchedule: [
      {
        installmentNo: 1,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        amount: Math.round(unit.price * 0.2),
        status: 'Pending',
      },
      {
        installmentNo: 2,
        dueDate: new Date(Date.now() + 60 * 86400000).toISOString(),
        amount: Math.round(unit.price * 0.3),
        status: 'Pending',
      },
      {
        installmentNo: 3,
        dueDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        amount: Math.round(unit.price * 0.3),
        status: 'Pending',
      },
    ],
  }));

  res.json(contracts);
});

// API: Maintenance tasks (Technician-focused)
app.get('/api/maintenance/tasks', authorize('view_maintenance'), (req, res) => {
  const units = rawData.slice(0, 50).map(toUnit);

  const tasks = units.map((unit, index) => ({
    taskId: `MT-${index + 1}`,
    unitId: unit.unitId,
    projectName: unit.projectName,
    subLocality: unit.subLocality,
    priority: unit.price > 900000 ? 'High' : 'Normal',
    type: unit.pricePerSqft && unit.pricePerSqft > 500 ? 'Inspection' : 'General Repair',
    status: index % 3 === 0 ? 'In Progress' : 'Open',
    scheduledDate: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
  }));

  res.json(tasks);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});