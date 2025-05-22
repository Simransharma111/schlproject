// routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /addSchool
router.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, address, latitude, longitude], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'School added successfully' });
  });
});

// 1. GET /listSchools?latitude=...&longitude=...
// Fetch schools sorted by distance from user location
router.get('/listSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const sql = `
    SELECT *,
      (6371 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )) AS distance
    FROM schools
    ORDER BY distance
  `;

  db.query(sql, [latitude, longitude, latitude], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(results);
  });
});

// 2. GET /allSchools
// Fetch all schools sorted by distance from fixed default location
router.get('/allSchools', (req, res) => {
  // Choose your default location — example: Delhi coordinates
  const defaultLatitude = 28.6139;
  const defaultLongitude = 77.2090;

  const sql = `
    SELECT *,
      (6371 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )) AS distance
    FROM schools
    ORDER BY distance
  `;

  db.query(sql, [defaultLatitude, defaultLongitude, defaultLatitude], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(results);
  });
});

module.exports = router;
