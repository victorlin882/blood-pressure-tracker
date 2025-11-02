# 🩺 Blood Pressure & Pulse Tracker

A full-stack web application for tracking blood pressure and pulse rate measurements. Built with Node.js, Express, MySQL, and vanilla JavaScript.

## Features

- ✅ **Input blood pressure readings** - Upper pressure, lower pressure, and pulse rate
- ✅ **Automatic timestamp** - Records date and time for each entry
- ✅ **View history** - Displays all readings in descending order (newest first)
- ✅ **Edit records** - Modify existing readings
- ✅ **Delete records** - Remove unwanted entries
- ✅ **Date range filtering** - Filter records by date range
- ✅ **Print functionality** - Print records to A4 paper
- ✅ **Health indicators** - Automatically categorizes blood pressure and pulse readings
- ✅ **Responsive design** - Works on both desktop and mobile devices

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 14 or higher)
- **MySQL** (XAMPP recommended)
- A web browser

## Installation & Setup

### 1. Start MySQL Server

Make sure your MySQL server is running. If using XAMPP:
- Open XAMPP Control Panel
- Start Apache and MySQL services

### 2. Database Setup

The application is configured to use the existing database:
- Database: `blood_pressure_tracker`
- Table: `blood_pressure`
- Location: `d:\xampp\mysql\data\blood_pressure_tracker\blood_pressure`

The table will be created automatically with the following structure:
```sql
CREATE TABLE IF NOT EXISTS blood_pressure (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    upper_pressure INT NOT NULL,
    lower_pressure INT NOT NULL,
    pulse_rate INT NOT NULL,
    input_date DATE NOT NULL,
    input_time TIME NOT NULL,
    created_at DATETIME NOT NULL,
    UNIQUE KEY unique_datetime (input_date, input_time)
);
```

**Note:** The `id` field uses `AUTO_INCREMENT` which automatically generates a unique record number for each entry. This allows the date and time to be edited without affecting the primary key. A unique constraint on `(input_date, input_time)` ensures no duplicate readings for the same date and time.

### 3. Configure Database Connection

Open `server.js` and update the MySQL password if needed:

```javascript
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your MySQL root password here if you have one
    database: 'blood_pressure_tracker'
});
```

### 4. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install:
- `express` - Web server framework
- `mysql2` - MySQL database driver
- `cors` - Cross-Origin Resource Sharing middleware

### 5. Start the Application

Run the server:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 6. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## Usage

### Adding a Reading

1. Enter the **Upper Pressure (Systolic)** (50-300 mmHg)
2. Enter the **Lower Pressure (Diastolic)** (30-200 mmHg)
3. Enter the **Pulse Rate** (30-200 bpm)
4. Click **"Add Reading"**

The application will automatically record the current date and time.

### Viewing History

- All readings are displayed in the "Reading History" section
- Readings are sorted by date and time (newest first)
- Each reading shows:
  - Date and time
  - Blood pressure (with health category indicator)
  - Pulse rate (with health category indicator)

### Filtering Records by Date

1. Select a **From Date**
2. Select a **To Date**
3. Click **"Filter"**
4. To view all records again, click **"Clear Filter"**

### Editing a Reading

1. Click the **"Edit"** button on any reading
2. Modify the values in the modal
3. Click **"Save Changes"**

### Deleting a Reading

1. Click the **"Delete"** button on any reading
2. Confirm the deletion in the popup

### Printing Records

1. Optionally, filter records by date range first
2. Click the **🖨️ Print** button
3. A print-formatted page will open with the selected records
4. Use your browser's print function (Ctrl+P or Cmd+P)
5. Select your printer or save as PDF

## Health Categories

### Blood Pressure
- **Normal**: < 120/80 mmHg
- **Elevated**: 120-129/< 80 mmHg
- **High Stage 1**: 130-139/80-89 mmHg
- **High Stage 2**: 140-179/90-119 mmHg
- **Crisis**: ≥ 180/≥ 120 mmHg (seek immediate medical attention)

### Pulse Rate
- **Low**: < 60 bpm
- **Normal**: 60-100 bpm
- **High**: > 100 bpm

## Mobile Compatibility

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

The interface automatically adapts to different screen sizes for optimal viewing.

## Deployment to Railway

### Quick Deployment (Recommended)

After making changes to your code, use one of the deployment scripts:

#### Option 1: PowerShell Script (Windows)
```powershell
.\deploy.ps1
```

#### Option 2: Batch File (Windows)
```batch
deploy.bat
```

Or with a custom commit message:
```batch
deploy.bat "Your commit message here"
```

#### Option 3: Manual Git Commands
```bash
git add .
git commit -m "Your commit message"
git push
```

### Deployment Process

1. **Run the deployment script** or use manual git commands
2. **Wait 2-3 minutes** for Railway to automatically deploy
3. **Hard refresh your browser** (Ctrl+F5) to see changes
4. **Monitor deployment** at https://railway.app

### What Happens

- ✅ Script stages all your changes
- ✅ Commits with your message
- ✅ Pushes to GitHub
- ✅ Railway automatically detects and deploys
- ✅ Your site updates in 2-3 minutes

### Deployment Scripts Features

**deploy.ps1** (PowerShell):
- Shows what files changed
- Prompts for commit message
- Provides status updates
- Shows deployment monitoring links

**deploy.bat** (Batch):
- Simple one-command deployment
- Can accept commit message as parameter
- Quick and easy to use

## Database Migration

### Updating from Old Schema

If you're upgrading from an older version that used `Date.now()` for IDs, you'll need to migrate your database:

**⚠️ Important:** Back up your data before migration!

#### Option 1: Drop and Recreate (Fresh Start)
If you don't mind losing existing data:
1. Stop the server
2. In MySQL, drop the old table: `DROP TABLE IF EXISTS blood_pressure;`
3. Start the server - it will create the new table automatically

#### Option 2: Migrate Existing Data (Preserves Records)
If you want to keep your existing data, connect to MySQL and run:

```sql
-- Step 1: Create backup table
CREATE TABLE blood_pressure_backup AS SELECT * FROM blood_pressure;

-- Step 2: Drop old table
DROP TABLE blood_pressure;

-- Step 3: The server will auto-create the new table on next start
```

Then manually re-insert your data (adjust values as needed):

```sql
INSERT INTO blood_pressure (upper_pressure, lower_pressure, pulse_rate, input_date, input_time, created_at)
SELECT upper_pressure, lower_pressure, pulse_rate, input_date, input_time, created_at
FROM blood_pressure_backup;

-- Step 4: Verify and drop backup
SELECT COUNT(*) FROM blood_pressure; -- Should match original count
DROP TABLE blood_pressure_backup;
```

## Troubleshooting

### Cannot connect to MySQL
- Make sure XAMPP MySQL service is running
- Verify the database name and credentials in `server.js`
- Check if port 3306 is not blocked by firewall

### Server won't start
- Make sure port 3000 is not in use by another application
- Run `npm install` to ensure all dependencies are installed

### Readings not showing
- Check browser console for errors (F12)
- Verify MySQL connection in server terminal output
- Make sure the database and table exist

### "Date and time cannot be updated" error
- This was fixed in the latest update with AUTO_INCREMENT primary key
- Update your database schema as described in the Database Migration section above

### "Duplicate entry" error when adding/editing
- The system prevents duplicate readings with the same date and time
- Change the date or time to make it unique

## Project Structure

```
blood-pressure-tracker/
├── index.html          # Main HTML file
├── script.js           # Frontend JavaScript
├── styles.css          # CSS styling
├── server.js           # Backend Node.js server
├── package.json        # Project dependencies
├── deploy.ps1          # PowerShell deployment script
├── deploy.bat          # Batch file deployment script
└── README.md          # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Architecture**: REST API

## License

This project is open source and available for personal use.

## Support

For issues or questions, please check the troubleshooting section or review the code comments for additional guidance.
