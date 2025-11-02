# 🔄 Railway Database Migration Guide

This guide explains how to migrate your Railway MySQL database from the old schema to the new schema with AUTO_INCREMENT primary key.

## Problem

If your Railway database was created before this update, it still has:
- Old schema: `id BIGINT PRIMARY KEY` (manual IDs from Date.now())
- No unique constraint on (input_date, input_time)

This will cause:
- ❌ Date/time cannot be updated properly
- ❌ Potential ID collisions

## Solution

You need to update the database schema on Railway. Here are your options:

---

## Option 1: Drop and Recreate Table (⚠️ Deletes All Data)

**Use this if:** You don't have important data or want to start fresh.

### Steps:

1. **Access Railway MySQL Database:**
   - Go to https://railway.app
   - Click on your project
   - Click on the **MySQL service**
   - Go to the **"Data"** tab
   - Click **"Query"** or **"Console"**

2. **Drop the old table:**
   ```sql
   DROP TABLE IF EXISTS blood_pressure;
   ```

3. **Restart your app:**
   - The server will automatically create the new table with AUTO_INCREMENT
   - Go to your app service in Railway
   - Click **"Redeploy"** or **"Restart"**

4. **Verify:**
   ```sql
   DESCRIBE blood_pressure;
   ```
   
   You should see:
   - `id` with `AUTO_INCREMENT`
   - `UNIQUE KEY unique_datetime (input_date, input_time)`

---

## Option 2: Migrate Existing Data (✅ Preserves Records)

**Use this if:** You want to keep your existing readings.

### Steps:

1. **Access Railway MySQL Console** (same as Option 1)

2. **Create backup and migrate:**
   ```sql
   -- Step 1: Create backup table
   CREATE TABLE blood_pressure_backup AS SELECT * FROM blood_pressure;
   
   -- Step 2: Count records (for verification)
   SELECT COUNT(*) AS total_records FROM blood_pressure_backup;
   
   -- Step 3: Drop old table
   DROP TABLE blood_pressure;
   ```

3. **Restart your app:**
   - The server will automatically create the new table
   - Go to your app service in Railway
   - Click **"Redeploy"** or **"Restart"**
   - Wait 2-3 minutes for the table to be created

4. **Restore data:**
   ```sql
   -- Step 4: Re-insert data into new table
   INSERT INTO blood_pressure (upper_pressure, lower_pressure, pulse_rate, input_date, input_time, created_at)
   SELECT upper_pressure, lower_pressure, pulse_rate, input_date, input_time, created_at
   FROM blood_pressure_backup;
   
   -- Step 5: Verify all records migrated
   SELECT COUNT(*) AS total_records FROM blood_pressure;
   
   -- Step 6: Delete backup table
   DROP TABLE blood_pressure_backup;
   ```

---

## Option 3: Manual ALTER TABLE (⚠️ Advanced)

**Use this if:** You want to modify the existing table without dropping it.

⚠️ **Warning:** This approach is complex and may have issues with existing data.

```sql
-- Not recommended for Railway due to complexity
-- This requires careful handling of AUTO_INCREMENT and existing data
-- Use Option 1 or 2 instead
```

---

## How to Access Railway MySQL Console

### Method 1: Railway Web Console
1. Go to https://railway.app
2. Select your project
3. Click on the **MySQL** service
4. Click the **"Data"** tab
5. Click **"Query"** or look for **"MySQL Console"**

### Method 2: Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Connect to database
railway shell

# Run MySQL commands
mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE
```

### Method 3: External MySQL Client
Connect using Railway's connection details:
1. Go to MySQL service → **"Variables"** tab
2. Copy connection details:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`
3. Use MySQL Workbench, DBeaver, or any MySQL client

---

## Verification After Migration

Run these SQL queries to verify the migration worked:

```sql
-- Check table structure
DESCRIBE blood_pressure;

-- Check for AUTO_INCREMENT on id
SHOW CREATE TABLE blood_pressure;

-- Check for unique constraint
SHOW INDEX FROM blood_pressure;
```

Expected output:
- `id` should show `AUTO_INCREMENT`
- `unique_datetime` index should exist on `(input_date, input_time)`

---

## Troubleshooting

### "Table doesn't exist" error after dropping
- The server will auto-create the table on next startup
- Just restart/redeploy your app service

### "Duplicate entry" error when re-inserting
- You may have duplicate date/time combinations in old data
- Either remove duplicates or adjust times:
  ```sql
  -- Find duplicates
  SELECT input_date, input_time, COUNT(*) 
  FROM blood_pressure_backup 
  GROUP BY input_date, input_time 
  HAVING COUNT(*) > 1;
  
  -- Update duplicates to add 1 second
  -- (adjust as needed before re-inserting)
  ```

### "Access denied" in MySQL console
- Check your MySQL service is running in Railway
- Verify environment variables in the app service

### App crashes after migration
- Check Railway logs: App service → "Deployments" → Latest deployment → "View Logs"
- Look for database connection errors
- Make sure MySQL service is running and connected

---

## Need Help?

If you encounter issues:
1. Check Railway logs for error messages
2. Verify database is accessible
3. Ensure all environment variables are set
4. Try restarting both app and MySQL services

