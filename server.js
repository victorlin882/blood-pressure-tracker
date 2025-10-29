const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// MySQL Connection Configuration
// Use environment variables for Railway, fallback to local for development
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'blood_pressure_tracker',
    port: process.env.MYSQLPORT || 3306
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS blood_pressure (
            id BIGINT PRIMARY KEY,
            upper_pressure INT NOT NULL,
            lower_pressure INT NOT NULL,
            pulse_rate INT NOT NULL,
            input_date DATE NOT NULL,
            input_time TIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table ready');
        }
    });
});

// API Routes

// Get all readings (with optional date range filter)
app.get('/api/readings', (req, res) => {
    const { fromDate, toDate } = req.query;
    
    let query = 'SELECT * FROM blood_pressure';
    let queryParams = [];
    
    if (fromDate && toDate) {
        query += ' WHERE input_date BETWEEN ? AND ?';
        queryParams = [fromDate, toDate];
    }
    
    query += ' ORDER BY input_date DESC, input_time DESC';
    
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching readings:', err);
            return res.status(500).json({ error: 'Failed to fetch readings' });
        }
        
        // Convert snake_case to camelCase for frontend
        const readings = results.map(row => ({
            id: row.id,
            upperPressure: row.upper_pressure,
            lowerPressure: row.lower_pressure,
            pulseRate: row.pulse_rate,
            inputDate: row.input_date,
            inputTime: row.input_time,
            dateTime: `${row.input_date} ${row.input_time}`
        }));
        
        res.json(readings);
    });
});

// Add a new reading
app.post('/api/readings', (req, res) => {
    const { id, upperPressure, lowerPressure, pulseRate, inputDate, inputTime } = req.body;
    
    const query = `
        INSERT INTO blood_pressure (id, upper_pressure, lower_pressure, pulse_rate, input_date, input_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [id, upperPressure, lowerPressure, pulseRate, inputDate, inputTime], (err, result) => {
        if (err) {
            console.error('Error adding reading:', err);
            return res.status(500).json({ error: 'Failed to add reading' });
        }
        
        res.status(201).json({ 
            message: 'Reading added successfully',
            id: id
        });
    });
});

// Update a reading
app.put('/api/readings/:id', (req, res) => {
    const { id } = req.params;
    const { upperPressure, lowerPressure, pulseRate } = req.body;
    
    const query = `
        UPDATE blood_pressure 
        SET upper_pressure = ?, lower_pressure = ?, pulse_rate = ?
        WHERE id = ?
    `;
    
    db.query(query, [upperPressure, lowerPressure, pulseRate, id], (err, result) => {
        if (err) {
            console.error('Error updating reading:', err);
            return res.status(500).json({ error: 'Failed to update reading' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reading not found' });
        }
        
        res.json({ message: 'Reading updated successfully' });
    });
});

// Delete a reading
app.delete('/api/readings/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM blood_pressure WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting reading:', err);
            return res.status(500).json({ error: 'Failed to delete reading' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reading not found' });
        }
        
        res.json({ message: 'Reading deleted successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API is available at http://localhost:${PORT}/api`);
});



