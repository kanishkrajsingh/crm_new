// server/routes/daily-can-status.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET cans to collect for the next day based on the provided date
router.get('/next-collection', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  const previousDay = getPreviousDay(date);

  try {
    const [rows] = await pool.execute(`
      SELECT c.customer_id, c.name, d.holding_status
      FROM customers c
      JOIN daily_updates d ON c.customer_id = d.customer_id
      WHERE d.date = ? AND d.holding_status > 0
    `, [previousDay]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching next day collection data:', error);
    res.status(500).json({ error: 'Failed to fetch next day collection data' });
  }
});

function getPreviousDay(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

module.exports = router;