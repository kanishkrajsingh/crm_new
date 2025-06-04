// server/routes/dashboard.routes.js (or server.js)
const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET dashboard statistics
router.get('/', async (req, res) => {
  try {
  //  const [todayOrdersResult] = await pool.execute('SELECT COUNT(*) AS count FROM orders WHERE DATE(order_date) = CURDATE()');
    const [monthlyCustomersResult] = await pool.execute('SELECT COUNT(*) AS count FROM customers WHERE customer_type = ?', ['monthly']);
    //const [shopCustomersVisitedResult] = await pool.execute('SELECT COUNT(DISTINCT customer_id) AS count FROM visits WHERE DATE(visit_date) = CURDATE()'); // Assuming you have a visits table
   // const [cansDeliveredTodayResult] = await pool.execute('SELECT SUM(delivered_qty) AS total FROM daily_updates WHERE date = CURDATE()');
    //const [cansCollectedTodayResult] = await pool.execute('SELECT SUM(collected_qty) AS total FROM daily_updates WHERE date = CURDATE()');
    //const [pendingCansTotalResult] = await pool.execute('SELECT SUM(can_qty) AS total FROM customers'); // This might need more complex logic depending on your definition of "pending"

    const stats = {
     // todayOrders: todayOrdersResult[0]?.count || 0,
     totalMonthlyCustomers: monthlyCustomersResult[0][0]?.count || 0,
           //shopCustomersVisited: shopCustomersVisitedResult[0]?.count || 0,
      //cansDeliveredToday: cansDeliveredTodayResult[0]?.total || 0,
      //cansCollectedToday: cansCollectedTodayResult[0]?.total || 0,
      //pendingCansTotal: pendingCansTotalResult[0]?.total || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});





module.exports = router; // If you created a separate dashboard.routes.js