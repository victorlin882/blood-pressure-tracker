# Quick Setup with ngrok

## Step 1: Download ngrok
1. Go to https://ngrok.com/download
2. Download the Windows version
3. Extract the ZIP file

## Step 2: Run ngrok
1. Open Command Prompt or PowerShell
2. Navigate to where you extracted ngrok
3. Run: `ngrok http 3000`

## Step 3: Get Your Public URL
You'll see something like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

## Step 4: Access from Anywhere
- Copy the `https://abc123.ngrok.io` URL
- Open it on your mobile (anywhere, any network)
- Your app will work!

## Important Notes:
- Keep the ngrok window open while using
- Keep your computer on
- Keep `npm start` running
- The URL changes each time you restart ngrok (unless you upgrade to paid)

## Optional: Sign up for free account
- Keeps same URL for 2 hours
- Get custom subdomain (paid plan)







