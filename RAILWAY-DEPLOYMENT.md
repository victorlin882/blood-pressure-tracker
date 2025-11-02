# 🚂 Deploy Blood Pressure Tracker to Railway

## Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app with GitHub)

---

## 📋 Step-by-Step Deployment Guide

### Step 1: Create a GitHub Repository

1. **Go to GitHub:** https://github.com
2. **Click "New Repository"**
3. **Repository Settings:**
   - Name: `blood-pressure-tracker`
   - Description: Blood Pressure & Pulse Tracker
   - Visibility: Public or Private (your choice)
   - ✅ Check "Add a README file"
4. **Click "Create repository"**

---

### Step 2: Push Your Code to GitHub

1. **Open terminal in your project folder** (`C:\Users\Victor\test`)

2. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Blood Pressure Tracker"
   ```

3. **Connect to your GitHub repository:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/blood-pressure-tracker.git
   git branch -M main
   git push -u origin main
   ```
   
   Replace `YOUR_USERNAME` with your actual GitHub username

---

### Step 3: Sign Up for Railway

1. **Go to:** https://railway.app
2. **Click "Start a New Project"** or "Login with GitHub"
3. **Authorize Railway** to access your GitHub account
4. **You'll get $5 free credit** (enough for several months!)

---

### Step 4: Deploy Your Application

1. **In Railway Dashboard:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your `blood-pressure-tracker` repository
   - Railway will automatically detect it's a Node.js app

2. **Wait for deployment** (2-3 minutes)
   - Railway will install dependencies
   - Build your application
   - Start the server

---

### Step 5: Add MySQL Database

1. **In your Railway project:**
   - Click **"+ New"**
   - Select **"Database"**
   - Choose **"Add MySQL"**

2. **Railway will automatically:**
   - Create a MySQL database
   - Set environment variables
   - Connect it to your app

3. **Important:** Railway will automatically set these variables:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

---

### Step 6: Get Your Public URL

1. **In your app service:**
   - Click on **"Settings"**
   - Scroll to **"Networking"**
   - Click **"Generate Domain"**
   - You'll get a URL like: `your-app.up.railway.app`

2. **Copy this URL** - this is your public access URL!

---

### Step 7: Test Your Deployed App

1. **Open the Railway URL** in your browser
2. **You should see** your Blood Pressure Tracker!
3. **Try adding a reading** to test database connection

---

## 📱 Access from Anywhere

Now you can access your app from:
- **Any computer:** `https://your-app.up.railway.app`
- **Any mobile phone:** Same URL (no WiFi requirement!)
- **From anywhere in the world** with internet connection

---

## 💰 Railway Pricing

- **Free Tier:** $5 credit per month
- **Hobby Plan:** $5/month for personal projects
- Your app will use approximately:
  - **Web Service:** ~$2-3/month
  - **MySQL Database:** ~$2-3/month
  - **Total:** ~$4-6/month (within free tier initially!)

---

## 🔧 Troubleshooting

### If deployment fails:

1. **Check Railway Logs:**
   - Click on your service
   - Go to "Deployments"
   - Click on latest deployment
   - View logs for errors

2. **Common Issues:**
   - **Port Error:** Make sure `process.env.PORT` is used (✅ Already done!)
   - **Database Error:** Ensure MySQL service is added
   - **Build Error:** Check if `node_modules` is in `.gitignore` (✅ Already done!)

### If database connection fails:

1. **Check environment variables:**
   - Go to service → Variables
   - Ensure all MYSQL* variables are set

2. **Restart services:**
   - Click on each service
   - Click "Restart"

---

## 🎉 You're Done!

Your Blood Pressure Tracker is now:
- ✅ Hosted on Railway
- ✅ Accessible from anywhere
- ✅ Using cloud MySQL database
- ✅ Always available (24/7)
- ✅ Automatically backed up

---

## 📝 Next Steps (Optional)

1. **Custom Domain:** Add your own domain in Railway settings
2. **Environment Variables:** Add any custom configurations
3. **Monitoring:** Check Railway dashboard for usage stats
4. **Updates:** Push to GitHub, Railway auto-deploys!

---

## 🔄 To Update Your App Later

1. Make changes in your local files
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
3. Railway automatically detects changes and redeploys!

---

## 💡 Tips

- Railway gives you free SSL (HTTPS) automatically
- Database backups are automatic
- Monitor usage in Railway dashboard
- First $5 credit renews monthly
- Upgrade to Hobby plan if needed ($5/month)









