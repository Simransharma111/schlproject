const express = require('express');
const router = express.Router();
const db = require('../db'); // Your MySQL connection pool or connection

// POST /addSchool
router.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
  }

  const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, address, latNum, lngNum], (err, result) => {
    if (err) {
      console.error('DB Insert Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
  });
});

// GET /listSchools?latitude=...&longitude=...
router.get('/listSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
  }

  const sql = `
    SELECT *, 
    (
      6371 * acos( 
        cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + 
        sin( radians(?) ) * sin( radians( latitude ) )
      )
    ) AS distance 
    FROM schools 
    ORDER BY distance ASC
  `;

  db.query(sql, [latNum, lngNum, latNum], (err, results) => {
    if (err) {
      console.error('DB Query Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
