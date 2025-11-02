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
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                upper_pressure INT NOT NULL,
                lower_pressure INT NOT NULL,
                pulse_rate INT NOT NULL,
                input_date DATE NOT NULL,
                input_time TIME NOT NULL,
                created_at DATETIME NOT NULL,
                UNIQUE KEY unique_datetime (input_date, input_time)
            )
        `;
        
        await connection.query(createTableQuery);
        
        // Check if table needs migration from old schema
        const checkIdColumnQuery = `
            SELECT COLUMN_TYPE, EXTRA
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'blood_pressure' 
            AND COLUMN_NAME = 'id'
        `;
        const [idColumns] = await connection.query(checkIdColumnQuery);
        
        if (idColumns.length > 0 && !idColumns[0].EXTRA.includes('auto_increment')) {
            console.log('Migrating table to use AUTO_INCREMENT id...');
            // Drop the table and recreate (CAUTION: This deletes data!)
            // For production, you'd want a proper migration strategy
            console.log('WARNING: If table has data, it will be lost. Skipping migration.');
            // Uncomment below to enable migration (use with caution):
            // await connection.query('DROP TABLE IF EXISTS blood_pressure');
            // await connection.query(createTableQuery);
            // console.log('Table migrated to AUTO_INCREMENT id');
        }
        
        // Add unique index if table already existed without it
        try {
            await connection.query(`
                ALTER TABLE blood_pressure 
                ADD UNIQUE KEY unique_datetime (input_date, input_time)
            `);
            console.log('Unique index on (input_date, input_time) added');
        } catch (err) {
            // Ignore error if index already exists
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('Unique index on (input_date, input_time) already exists');
            } else {
                console.log('Index already exists or other issue, continuing...');
            }
        }
        
        // Check if created_at is TIMESTAMP and alter to DATETIME if needed
        const checkColumnQuery = `
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'blood_pressure' 
            AND COLUMN_NAME = 'created_at'
        `;
        const [columns] = await connection.query(checkColumnQuery);
        
        if (columns.length > 0 && columns[0].COLUMN_TYPE.includes('timestamp')) {
            console.log('Converting created_at from TIMESTAMP to DATETIME...');
            await connection.query('ALTER TABLE blood_pressure MODIFY created_at DATETIME NOT NULL');
            console.log('Column converted to DATETIME');
        }
        
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
                // created_at is now DATETIME (stores exactly what we insert, no timezone conversion)
                let createdAt = row.created_at;
                if (createdAt) {
                    // Format as string if it's a Date object
                    if (createdAt instanceof Date) {
                        const year = createdAt.getFullYear();
                        const month = String(createdAt.getMonth() + 1).padStart(2, '0');
                        const day = String(createdAt.getDate()).padStart(2, '0');
                        const hour = String(createdAt.getHours()).padStart(2, '0');
                        const minute = String(createdAt.getMinutes()).padStart(2, '0');
                        const second = String(createdAt.getSeconds()).padStart(2, '0');
                        createdAt = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
                    }
                    // If it's already a string, use it as-is (should already be in HK time)
                }
                
                // Format input_date to string (YYYY-MM-DD) for frontend
                let formattedDate = row.input_date;
                if (formattedDate instanceof Date) {
                    const year = formattedDate.getFullYear();
                    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(formattedDate.getDate()).padStart(2, '0');
                    formattedDate = `${year}-${month}-${day}`;
                } else if (typeof formattedDate === 'string') {
                    // Ensure it's in YYYY-MM-DD format (extract date part only)
                    formattedDate = formattedDate.split(' ')[0].split('T')[0];
                    // Validate format
                    if (!formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        console.warn('Warning: Invalid date format from database:', row.input_date, '->', formattedDate);
                    }
                } else if (!formattedDate) {
                    console.error('Error: input_date is null/undefined for reading id:', row.id);
                    // Fallback to created_at date if input_date is missing
                    if (row.created_at) {
                        const fallbackDate = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
                        const year = fallbackDate.getFullYear();
                        const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
                        const day = String(fallbackDate.getDate()).padStart(2, '0');
                        formattedDate = `${year}-${month}-${day}`;
                        console.log('Using created_at as fallback for input_date:', formattedDate);
                    } else {
                        formattedDate = ''; // Will be caught by frontend
                    }
                }
                
                // Format input_time to string (HH:MM:SS)
                let formattedTime = row.input_time;
                if (formattedTime instanceof Date) {
                    const hours = String(formattedTime.getHours()).padStart(2, '0');
                    const minutes = String(formattedTime.getMinutes()).padStart(2, '0');
                    const seconds = String(formattedTime.getSeconds()).padStart(2, '0');
                    formattedTime = `${hours}:${minutes}:${seconds}`;
                } else if (typeof formattedTime === 'string') {
                    // Ensure it's in HH:MM:SS format
                    formattedTime = formattedTime.split('.')[0]; // Remove milliseconds if present
                }
                
                return {
                    id: row.id,
                    upperPressure: row.upper_pressure,
                    lowerPressure: row.lower_pressure,
                    pulseRate: row.pulse_rate,
                    inputDate: formattedDate,
                    inputTime: formattedTime,
                    createdAt: createdAt || null,
                    dateTime: `${formattedDate} ${formattedTime}`
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
    const { upperPressure, lowerPressure, pulseRate, inputDate, inputTime } = req.body;
    
    // Calculate Hong Kong timestamp for created_at (UTC+8)
    const now = new Date();
    
    // Get Hong Kong time components
    const hkYear = now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong', year: 'numeric' });
    const hkMonth = String(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong', month: '2-digit' })).padStart(2, '0');
    const hkDay = String(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong', day: '2-digit' })).padStart(2, '0');
    const hkHour = String(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong', hour: '2-digit', hour12: false })).padStart(2, '0');
    const hkMinute = String(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong', minute: '2-digit' })).padStart(2, '0');
    const hkSecond = String(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong', second: '2-digit' })).padStart(2, '0');
    
    // Format: "YYYY-MM-DD HH:mm:ss" in Hong Kong time
    const hkTimestamp = `${hkYear}-${hkMonth}-${hkDay} ${hkHour}:${hkMinute}:${hkSecond}`;
    
    console.log('Inserting with Hong Kong timestamp:', hkTimestamp);
    
    // Use DATETIME format explicitly - insert as string in Hong Kong time
    // Note: id is now AUTO_INCREMENT, so we don't include it in INSERT
    const query = `
        INSERT INTO blood_pressure (upper_pressure, lower_pressure, pulse_rate, input_date, input_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    promisePool.query("SET time_zone = '+08:00'")
        .then(() => promisePool.query(query, [upperPressure, lowerPressure, pulseRate, inputDate, inputTime, hkTimestamp]))
        .then(([result]) => {
            res.status(201).json({ 
                message: 'Reading added successfully',
                id: result.insertId  // Return the auto-generated ID
            });
        })
        .catch((err) => {
            console.error('Error adding reading:', err);
            // Handle duplicate datetime error
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ error: 'A reading with this date and time already exists' });
            } else {
                res.status(500).json({ error: 'Failed to add reading' });
            }
        });
});

// Update a reading
app.put('/api/readings/:id', (req, res) => {
    const { id } = req.params;
    const { inputDate, inputTime, upperPressure, lowerPressure, pulseRate } = req.body;
    
    const query = `
        UPDATE blood_pressure 
        SET input_date = ?, input_time = ?, upper_pressure = ?, lower_pressure = ?, pulse_rate = ?
        WHERE id = ?
    `;
    
    promisePool.query(query, [inputDate, inputTime, upperPressure, lowerPressure, pulseRate, id])
        .then(([result]) => {
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reading not found' });
            }
            res.json({ message: 'Reading updated successfully' });
        })
        .catch((err) => {
            console.error('Error updating reading:', err);
            // Handle duplicate datetime error
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ error: 'A reading with this date and time already exists' });
            } else {
                res.status(500).json({ error: 'Failed to update reading' });
            }
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



