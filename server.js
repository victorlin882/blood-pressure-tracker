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

// MySQL Connection Pool Configuration (better for Railway)
// Use environment variables for Railway, fallback to local for development
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'blood_pressure_tracker',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    reconnect: true
});

// Create promise-based pool
const promisePool = pool.promise();

// Test connection and create table
(async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('Connected to MySQL database');
        
        // Set timezone to Hong Kong (UTC+8)
        await connection.query("SET time_zone = '+08:00'");
        console.log('Timezone set to Hong Kong (UTC+8)');
        
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
        
        await connection.query(createTableQuery);
        console.log('Table ready');
        connection.release();
    } catch (err) {
        console.error('Database initialization error:', err);
    }
})();

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
    
    // Set timezone to Hong Kong before querying
    promisePool.query("SET time_zone = '+08:00'")
        .then(() => promisePool.query(query, queryParams))
        .then(([results]) => {
            // Convert snake_case to camelCase for frontend
            const readings = results.map(row => {
                // Convert created_at to Hong Kong time if it exists
                let createdAt = row.created_at;
                if (createdAt) {
                    // If it's a Date object, format it as Hong Kong time
                    const date = new Date(createdAt);
                    const hkFormatter = new Intl.DateTimeFormat('en-CA', {
                        timeZone: 'Asia/Hong_Kong',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    });
                    const parts = hkFormatter.formatToParts(date);
                    const year = parts.find(p => p.type === 'year').value;
                    const month = parts.find(p => p.type === 'month').value;
                    const day = parts.find(p => p.type === 'day').value;
                    const hour = parts.find(p => p.type === 'hour').value;
                    const minute = parts.find(p => p.type === 'minute').value;
                    const second = parts.find(p => p.type === 'second').value;
                    createdAt = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
                }
                
                return {
                    id: row.id,
                    upperPressure: row.upper_pressure,
                    lowerPressure: row.lower_pressure,
                    pulseRate: row.pulse_rate,
                    inputDate: row.input_date,
                    inputTime: row.input_time,
                    createdAt: createdAt,
                    dateTime: `${row.input_date} ${row.input_time}`
                };
            });
            
            res.json(readings);
        })
        .catch((err) => {
            console.error('Error fetching readings:', err);
            res.status(500).json({ error: 'Failed to fetch readings' });
        });
});

// Add a new reading
app.post('/api/readings', (req, res) => {
    const { id, upperPressure, lowerPressure, pulseRate, inputDate, inputTime } = req.body;
    
    // Calculate Hong Kong timestamp for created_at (UTC+8)
    const now = new Date();
    
    // Format date in Hong Kong timezone using Intl.DateTimeFormat
    const hkFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Format as: "YYYY-MM-DD, HH, MM, SS"
    const parts = hkFormatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const second = parts.find(p => p.type === 'second').value;
    
    // Format: "YYYY-MM-DD HH:mm:ss"
    const hkTimestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    
    // Set timezone to Hong Kong and insert with explicit Hong Kong timestamp
    const query = `
        INSERT INTO blood_pressure (id, upper_pressure, lower_pressure, pulse_rate, input_date, input_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    promisePool.query("SET time_zone = '+08:00'")
        .then(() => promisePool.query(query, [id, upperPressure, lowerPressure, pulseRate, inputDate, inputTime, hkTimestamp]))
        .then(([result]) => {
            res.status(201).json({ 
                message: 'Reading added successfully',
                id: id
            });
        })
        .catch((err) => {
            console.error('Error adding reading:', err);
            res.status(500).json({ error: 'Failed to add reading' });
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
    
    promisePool.query(query, [upperPressure, lowerPressure, pulseRate, id])
        .then(([result]) => {
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reading not found' });
            }
            res.json({ message: 'Reading updated successfully' });
        })
        .catch((err) => {
            console.error('Error updating reading:', err);
            res.status(500).json({ error: 'Failed to update reading' });
        });
});

// Delete a reading
app.delete('/api/readings/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM blood_pressure WHERE id = ?';
    
    promisePool.query(query, [id])
        .then(([result]) => {
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reading not found' });
            }
            res.json({ message: 'Reading deleted successfully' });
        })
        .catch((err) => {
            console.error('Error deleting reading:', err);
            res.status(500).json({ error: 'Failed to delete reading' });
        });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API is available at http://localhost:${PORT}/api`);
});



