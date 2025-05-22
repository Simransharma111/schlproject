// routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Check if all fields are present
  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Ensure name is a string
  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Name must be a string' });
  }

  // Validate name format
  const nameRegex = /^[a-zA-Z\s]{2,100}$/;
  if (!nameRegex.test(name)) {
    return res.status(400).json({ error: 'Name must be 2–100 alphabetic characters' });
  }

  // Ensure address is a string and valid
  if (typeof address !== 'string' || address.trim().length === 0 || address.length > 255) {
    return res.status(400).json({ error: 'Address must be a non-empty string (max 255 characters)' });
  }

  // Check if latitude and longitude are numbers or numeric strings
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (typeof latitude === 'boolean' || typeof longitude === 'boolean') {
    return res.status(400).json({ error: 'Latitude and longitude must be numbers, not booleans' });
  }

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return res.status(400).json({ error: 'Latitude must be a number between -90 and 90' });
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Longitude must be a number between -180 and 180' });
  }

  // Insert into DB
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


// GET /allSchools
router.get('/allSchools', (req, res) => {
  // Use default coordinates if not provided
  const latitude = req.query.latitude || 28.6139;    // Default: New Delhi latitude
  const longitude = req.query.longitude || 77.2090;  // Default: New Delhi longitude

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
