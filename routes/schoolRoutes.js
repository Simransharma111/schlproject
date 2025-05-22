// routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /addSchool – Add new school with full validation
router.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const nameRegex = /^[a-zA-Z\s]{2,100}$/;
  if (!nameRegex.test(name)) {
    return res.status(400).json({ error: 'Name must be 2–100 alphabetic characters' });
  }

  if (typeof address !== 'string' || address.trim().length === 0 || address.length > 255) {
    return res.status(400).json({ error: 'Address must be a non-empty string (max 255 characters)' });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return res.status(400).json({ error: 'Latitude must be a number between -90 and 90' });
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Longitude must be a number between -180 and 180' });
  }

  const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(sql, [name.trim(), address.trim(), lat, lon], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'School added successfully' });
  });
});


// GET /listSchools – Schools sorted by proximity
router.get('/listSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return res.status(400).json({ error: 'Latitude must be a number between -90 and 90' });
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Longitude must be a number between -180 and 180' });
  }

  const sql = `
    SELECT *, 
      (6371 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )) AS distance 
    FROM schools 
    ORDER BY distance ASC`;

  db.query(sql, [lat, lon, lat], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});


// GET /allSchools?latitude=...&longitude=...
router.get('/allSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const sql = `
    SELECT *, (
      6371 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )
    ) AS distance
    FROM schools
    ORDER BY distance ASC, name ASC
  `;

  db.query(sql, [latitude, longitude, latitude], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(results);
  });
});


module.exports = router;
