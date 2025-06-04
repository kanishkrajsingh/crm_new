// Node.js with Express (example - adapt to your backend framework)
const express = require('express');
const router = express.Router();
const pool = require('../database'); // Assuming you have a database connection setup using mysql2/promise

// Middleware to parse JSON request bodies
router.use(express.json());

// GET daily updates for a specific date
router.get('/', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT update_id, customer_id, date, delivered_qty, collected_qty, notes FROM daily_updates WHERE date = ?',
      [date]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching daily updates:', error);
    res.status(500).json({ error: 'Failed to fetch daily updates' });
  }
});

// Function to get the previous day's updates for calculating unreturned quantities
async function getPreviousDayUpdates(date) {
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);
  const previousDayString = previousDay.toISOString().split('T')[0];

  try {
    const [rows] = await pool.execute(
      'SELECT customer_id, delivered_qty, collected_qty FROM daily_updates WHERE date = ?',
      [previousDayString]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching previous day updates:', error);
    return [];
  }
}

// POST a new daily update (or update an existing one for the day)
router.post('/', async (req, res) => {
  const { customer_id, date, delivered_qty, collected_qty, notes } = req.body;

  if (!customer_id || !date) {
    return res.status(400).json({ error: 'Customer ID and date are required' });
  }

  try {
    // Check if an update already exists for this customer and date
    const [existingUpdate] = await pool.execute(
      'SELECT update_id FROM daily_updates WHERE customer_id = ? AND date = ?',
      [customer_id, date]
    );

    if (existingUpdate.length > 0) {
      // Update the existing record
      await pool.execute(
        'UPDATE daily_updates SET delivered_qty = ?, collected_qty = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND date = ?',
        [delivered_qty, collected_qty, notes, customer_id, date]
      );
      res.status(200).json({ message: `Daily update for customer ${customer_id} on ${date} updated successfully` });
    } else {
      // Insert a new record
      const [result] = await pool.execute(
        'INSERT INTO daily_updates (customer_id, date, delivered_qty, collected_qty, notes) VALUES (?, ?, ?, ?, ?)',
        [customer_id, date, delivered_qty, collected_qty, notes]
      );
      const newUpdateId = result.insertId;
      const [newUpdate] = await pool.execute(
        'SELECT update_id, customer_id, date, delivered_qty, collected_qty, notes FROM daily_updates WHERE update_id = ?',
        [newUpdateId]
      );
      res.status(201).json(newUpdate[0]);
    }
  } catch (error) {
    console.error('Error saving/updating daily update:', error);
    res.status(500).json({ error: 'Failed to save/update daily update' });
  }
});

// GET unreturned quantities for the previous day (for initializing the next day's collected)
router.get('/previous-unreturned', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  try {
    const previousDayUpdates = await getPreviousDayUpdates(date);
    const unreturnedQuantities = {};
    previousDayUpdates.forEach(update => {
      const unreturned = update.delivered_qty - update.collected_qty;
      if (unreturned > 0) {
        unreturnedQuantities[update.customer_id] = unreturned;
      }
    });
    res.status(200).json(unreturnedQuantities);
  } catch (error) {
    console.error('Error fetching previous day unreturned quantities:', error);
    res.status(500).json({ error: 'Failed to fetch previous day unreturned quantities' });
  }
});

// Optional: DELETE a daily update by ID (if needed for specific use cases)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [existingUpdate] = await pool.execute(
      'SELECT update_id FROM daily_updates WHERE update_id = ?',
      [id]
    );

    if (existingUpdate.length === 0) {
      return res.status(404).json({ message: `Daily update with ID ${id} not found` });
    }

    await pool.execute('DELETE FROM daily_updates WHERE update_id = ?', [id]);
    res.status(200).json({ message: `Daily update with ID ${id} deleted successfully` });
  } catch (error) {
    console.error(`Error deleting daily update with ID ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete daily update' });
  }
});

module.exports = router;