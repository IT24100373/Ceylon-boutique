# Ceylon Boutique — Complete Deployment Guide

> **Who is this for?** Anyone with zero deployment experience.  
> **What will you achieve?** Your entire system live on the internet — backend API, admin web panel, and mobile app.

---

## Table of Contents

1. [Understanding the Big Picture](#1-understanding-the-big-picture)
2. [Prerequisites — What You Need Before Starting](#2-prerequisites--what-you-need-before-starting)
3. [Part A — Deploy the Backend API (Render)](#3-part-a--deploy-the-backend-api-render)
4. [Part B — Deploy the Admin Web Panel (Vercel)](#4-part-b--deploy-the-admin-web-panel-vercel)
5. [Part C — Mobile App (Expo EAS Build for APK)](#5-part-c--mobile-app-expo-eas-build-for-apk)
6. [Post-Deployment Checklist](#6-post-deployment-checklist)
7. [Troubleshooting Common Issues](#7-troubleshooting-common-issues)
8. [Glossary of Terms](#8-glossary-of-terms)

---

## 1. Understanding the Big Picture

Your project has **three apps** that all talk to **one backend API** and **one database**:

```
┌─────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│   Mobile App    │      │   Backend API        │      │  MongoDB Atlas   │
│  (Expo / APK)   │─────▶│  (Node.js on Render) │◀────▶│  (Cloud Database)│
└─────────────────┘      └──────────────────────┘      └──────────────────┘
                                   ▲
                                   │
                         ┌─────────┴─────────┐
                         │  Admin Web Panel   │
                         │  (React on Vercel) │
                         └───────────────────┘
```

### What goes where?

| Component | What it is | Where to deploy | Why this platform? |
|-----------|-----------|----------------|-------------------|
| **Backend API** | Your Node.js + Express server | **Render** | Free tier, easy Node.js hosting, auto-deploys from GitHub |
| **Admin Web Panel** | Your React (Vite) website | **Vercel** | Free tier, built for React apps, instant deploys from GitHub |
| **Mobile App** | Your React Native (Expo) app | **Expo EAS Build** | Builds APK/IPA files in the cloud without Android Studio |
| **Database** | MongoDB | **MongoDB Atlas** | Already set up — no changes needed |

### ✅ Image Uploads — Handled by Cloudinary (No Extra Cost)

Your project supports **direct image uploads** from devices (products, shop logos, reviews). Images are uploaded to **Cloudinary** — a free cloud image storage service. This means:

- Images are stored on Cloudinary’s global CDN (fast loading worldwide)
- Images survive Render redeploys, restarts, and cold starts
- **No paid Render Disk needed** — Cloudinary’s free tier gives you 25GB storage + 25GB bandwidth/month
- Image URLs look like: `https://res.cloudinary.com/your-cloud/image/upload/v123/ceylon-boutique/abc.jpg`

You will set up a free Cloudinary account as part of **Part A, Step A4**.

### Deployment order (important!)

You **must** deploy in this exact order:
1. **Backend first** — because the admin panel and mobile app both need the backend URL
2. **Admin panel second** — because you need the admin panel URL to configure CORS on the backend
3. **Mobile app last** — because you need the backend URL hardcoded into the app

---

## 2. Prerequisites — What You Need Before Starting

Before you start, make sure you have:

- [x] **GitHub account** — with all your code pushed to the `main` branch
- [x] **MongoDB Atlas** — your database is already running in the cloud (no changes needed)
- [ ] **Cloudinary account** — sign up at [https://cloudinary.com](https://cloudinary.com) (free — 25GB storage)
- [ ] **Render account** — sign up at [https://render.com](https://render.com) (free)
- [ ] **Vercel account** — sign up at [https://vercel.com](https://vercel.com) (free)
- [ ] **Expo account** — sign up at [https://expo.dev](https://expo.dev) (free)
- [ ] **Node.js installed** on your computer (you already have this)

### Quick account setup tips

- **Use "Sign up with GitHub"** on all three platforms (Render, Vercel, Expo). This automatically connects your GitHub repos and saves time.
- All three platforms have **generous free tiers** — you will NOT need a credit card for basic usage.

---

## 3. Part A — Deploy the Backend API (Render)

### What is Render?

Render is a cloud platform that runs your backend server 24/7 on the internet. Instead of your computer running `npm run dev`, Render's servers will run your app and give it a public URL like `https://ceylon-boutique-api.onrender.com`.

### Step A1 — Create a Render Account

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Choose **"Sign up with GitHub"** (recommended — this links your repos automatically)
4. Authorize Render to access your GitHub account

### Step A2 — Create a New Web Service

1. Once logged in, click the **"New +"** button (top right)
2. Select **"Web Service"**
3. You'll see a list of your GitHub repositories
4. Find your repository (e.g., `WMT-PROJECT`) and click **"Connect"**
   - If you don't see it, click **"Configure account"** and grant Render access to the repo

### Step A3 — Configure the Web Service

Fill in these settings on the configuration page:

| Setting | Value | Explanation |
|---------|-------|-------------|
| **Name** | `ceylon-boutique-api` | This becomes part of your URL |
| **Region** | `Singapore (Southeast Asia)` | Pick the closest to Sri Lanka for speed |
| **Branch** | `main` | The branch Render will deploy from |
| **Root Directory** | `backend` | Tells Render your server code is inside the `backend` folder |
| **Runtime** | `Node` | Your backend is built with Node.js |
| **Build Command** | `npm install` | Installs your dependencies on Render's server |
| **Start Command** | `npm start` | Runs `node server.js` (defined in your package.json) |
| **Instance Type** | `Free` | Select the free tier |

### Step A4 — Add Environment Variables

> **What are environment variables?** These are secret settings (like passwords and API keys) that your app needs but should NEVER be in your code. On your local machine, they live in the `.env` file. On Render, you add them through the dashboard.

Scroll down to the **"Environment Variables"** section and add each one by clicking **"Add Environment Variable"**:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | `mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/ceylon_boutique?retryWrites=true&w=majority` | Copy from your local `.env` file — this is your Atlas connection string |
| `JWT_SECRET` | *(copy from your local `.env` file)* | The long random string you generated earlier |
| `JWT_EXPIRE` | `7d` | Tokens expire in 7 days |
| `NODE_ENV` | `production` | Tells your app it's running in production mode |
| `CORS_ORIGIN` | `*` | Allow all origins for now (we'll tighten this later) |
| `PLATFORM_COMMISSION_RATE` | `10` | Platform commission percentage |
| `CLOUDINARY_CLOUD_NAME` | *(from your Cloudinary dashboard)* | Your Cloudinary cloud name (see Step A4b below) |
| `CLOUDINARY_API_KEY` | *(from your Cloudinary dashboard)* | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | *(from your Cloudinary dashboard)* | Your Cloudinary API secret |

> ⚠️ **Where do I find these values?** For MongoDB/JWT values, open `backend/.env` on your computer. For Cloudinary values, follow Step A4b below.

### Step A4b — Set Up Cloudinary (Free Image Storage)

> **What is Cloudinary?** Cloudinary is a cloud service that stores and serves your images. Instead of saving images to your server’s hard drive (which gets wiped on Render), images are uploaded to Cloudinary’s global CDN. It’s **completely free** for up to 25GB of storage.

**Create your Cloudinary account:**

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"**
3. Fill in your name, email, and password
4. Choose **"Programmable Media"** when asked your use case
5. Once logged in, you’ll land on the **Dashboard**

**Find your API credentials:**

1. On the Cloudinary Dashboard, look for the **"API Keys"** section (or go to Settings → API Keys)
2. You’ll see three values:

   | Cloudinary Setting | Where to find it | Render Env Var Name |
   |-------------------|-----------------|--------------------|
   | **Cloud Name** | Top of dashboard (e.g., `dxyz1abc2`) | `CLOUDINARY_CLOUD_NAME` |
   | **API Key** | API Keys section (e.g., `123456789012345`) | `CLOUDINARY_API_KEY` |
   | **API Secret** | Click "eye" icon to reveal (e.g., `abcDEF123...`) | `CLOUDINARY_API_SECRET` |

3. Copy each value and add them as environment variables on Render (you already added placeholders in Step A4 — now replace them with the real values)

**Also add them to your local `.env` file:**

Open `backend/.env` on your computer and add:
```
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

> This ensures image uploads work both locally and in production.

### Step A5 — Deploy

1. Click **"Create Web Service"**
2. Render will now:
   - Clone your repository
   - Navigate to the `backend` folder
   - Run `npm install` (install dependencies)
   - Run `npm start` (start your server)
3. **Wait 3-5 minutes** — you'll see a live log of the build process
4. When you see `✅ MongoDB Connected` and `🚀 Server running in production mode`, your backend is LIVE!

### Step A6 — Test Your Live Backend

1. Render will show your URL at the top of the page, something like:
   ```
   https://ceylon-boutique-api.onrender.com
   ```
2. Open this URL in your browser
3. You should see:
   ```json
   {
     "success": true,
     "message": "Ceylon Boutique Marketplace API is running.",
     "version": "1.0.0",
     "environment": "production"
   }
   ```
4. **Save this URL** — you'll need it for the next steps

### Step A7 — Seed the Admin Account (One-Time)

You need to run the admin seed script against your production database. You have two options:

**Option 1 — Run locally pointing to production DB (Recommended):**

1. Open your terminal on your computer
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Temporarily change `MONGODB_URI` in your local `.env` to your Atlas URI (it should already be the same one you put in Render)
4. Run:
   ```bash
   node scripts/seedAdmin.js
   ```
5. You should see:
   ```
   ✅ Admin account created successfully!
   Email:    admin@ceylonboutique.com
   Password: Admin@123456
   ```

**Option 2 — Use Render Shell:**

1. In your Render dashboard, go to your web service
2. Click the **"Shell"** tab
3. Run:
   ```bash
   node scripts/seedAdmin.js
   ```

> ⚠️ **IMPORTANT:** Change the admin password after your first login! The default password `Admin@123456` is in your source code.

### ⚠️ Important Note About Render Free Tier

Render's free tier has a limitation called **"spin down"**: if no one visits your API for 15 minutes, Render puts your server to sleep. The next request will take ~30-50 seconds to "wake up" the server. This is normal for the free tier.

**How to reduce cold starts:**
- Use a free service like [UptimeRobot](https://uptimerobot.com) to ping your API URL every 14 minutes, keeping it awake
- Or upgrade to Render's paid plan ($7/month) for always-on hosting

---

## 4. Part B — Deploy the Admin Web Panel (Vercel)

### What is Vercel?

Vercel is a platform that hosts websites (frontends). Your admin panel is a React app — Vercel will build it and serve the HTML/CSS/JS files to anyone who visits the URL.

### Why deploy separately?

Your admin panel (`admin/` folder) is a **completely separate app** from your backend. It's a React website that runs in the browser and talks to your backend API via HTTP requests. It needs its own hosting.

### Step B1 — Create a Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub account

### Step B2 — Import Your Project

1. Once logged in, click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories listed
3. Find your repository (e.g., `WMT-PROJECT`) and click **"Import"**

### Step B3 — Configure the Project

Fill in these settings:

| Setting | Value | Explanation |
|---------|-------|-------------|
| **Project Name** | `ceylon-boutique-admin` | This becomes part of your URL |
| **Framework Preset** | `Vite` | Vercel auto-detects this, but select Vite if asked |
| **Root Directory** | Click **"Edit"** → type `admin` | Tells Vercel your admin code is in the `admin` folder |
| **Build Command** | `npm run build` | Vercel will auto-fill this (leave as-is) |
| **Output Directory** | `dist` | Vercel will auto-fill this (leave as-is) |
| **Install Command** | `npm install` | Vercel will auto-fill this (leave as-is) |

### Step B4 — Add Environment Variables

Click **"Environment Variables"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_URL` | `https://ceylon-boutique-api.onrender.com` | Replace with YOUR actual Render URL from Step A6 |

> **Why `VITE_` prefix?** Vite (your build tool) only exposes environment variables that start with `VITE_` to your frontend code. Your `admin/src/api/client.js` already uses `import.meta.env.VITE_API_URL`, so this will work automatically.

### Step B5 — Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Navigate to the `admin` folder
   - Run `npm install`
   - Run `npm run build` (creates optimized production files)
   - Deploy the `dist` folder to their CDN (global network of servers)
3. **Wait 1-2 minutes**
4. Once complete, Vercel will show you your URL:
   ```
   https://ceylon-boutique-admin.vercel.app
   ```

### Step B6 — Test Your Live Admin Panel

1. Open the Vercel URL in your browser
2. You should see your admin login page
3. Login with:
   - **Email:** `admin@ceylonboutique.com`
   - **Password:** `Admin@123456`
4. If you can log in and see the dashboard, your admin panel is working!

### Step B7 — Update Backend CORS (Important!)

Now that your admin panel has a real URL, you should tell your backend to accept requests from it:

1. Go to your **Render dashboard** → your web service
2. Click **"Environment"** tab
3. Find `CORS_ORIGIN` — change its value from `*` to your Vercel URL:
   ```
   https://ceylon-boutique-admin.vercel.app
   ```
4. Add a NEW environment variable:
   
   | Key | Value |
   |-----|-------|
   | `ADMIN_WEB_URL` | `https://ceylon-boutique-admin.vercel.app` |
   
5. Click **"Save Changes"**
6. Render will automatically redeploy your backend (wait 2-3 minutes)

> **Why do this?** CORS (Cross-Origin Resource Sharing) is a security feature. Setting `CORS_ORIGIN=*` means "allow ANY website to talk to my API," which is fine for development but not ideal for production. By setting it to your specific admin URL, only your admin panel can make requests to your API.
>
> **Note:** Your `server.js` already handles the `ADMIN_WEB_URL` environment variable in the `allowedOrigins` array, and mobile app requests (which have no `origin` header) are already allowed. So this change will NOT break anything.

### Step B8 — Set Up Auto-Deploy (Already Done!)

Since you connected your GitHub account, Vercel will **automatically redeploy** every time you push to the `main` branch. You don't need to do anything extra.

### Vercel Handles SPA Routing Automatically

Since you're using `react-router-dom` for navigation, Vercel needs to know to redirect all routes to `index.html`. **Vercel does this automatically for Vite projects** — no configuration needed. If you ever face 404 errors on page refresh, create a file called `admin/vercel.json` with:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 5. Part C — Mobile App (Expo EAS Build for APK)

### Understanding Your Options

| Option | What it is | Good for | Limitation |
|--------|-----------|----------|------------|
| **Expo Go (QR Code)** | A development app that loads your code | Testing during development | Cannot distribute to others; requires same Wi-Fi; not for production |
| **APK File (Android)** | A standalone installable file for Android | Sharing with testers, demo purposes | Not on the Play Store; users must enable "Install from unknown sources" |
| **Play Store / App Store** | Official app distribution | Real production apps | Requires developer accounts ($25 Google, $99/year Apple) |

### Recommended Approach

For a university project or initial launch:
- **Build an APK** using Expo EAS Build — this gives you a real, installable Android app
- You can share the APK file with anyone via WhatsApp, email, Google Drive, etc.
- No Play Store account needed

### Step C1 — Update the API URL in the Mobile App

Before building, you must point the mobile app to your live backend:

1. Open `mobile/src/api/client.js` on your computer
2. Find this line:
   ```javascript
   const BASE_URL = 'http://192.168.8.172:5000';
   ```
3. Change it to your Render URL:
   ```javascript
   const BASE_URL = 'https://ceylon-boutique-api.onrender.com';
   ```
4. Save the file
5. Commit and push to GitHub:
   ```bash
   git add mobile/src/api/client.js
   git commit -m "feat: update API URL to production"
   git push origin main
   ```

### Step C2 — Install EAS CLI

> **What is EAS?** EAS (Expo Application Services) is Expo's cloud build system. It builds your APK/IPA file on Expo's servers, so you don't need Android Studio or Xcode installed.

1. Open your terminal (Command Prompt or PowerShell)
2. Install the EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
3. Verify installation:
   ```bash
   eas --version
   ```
   You should see a version number like `12.x.x`

### Step C3 — Login to Your Expo Account

1. If you don't have an Expo account, create one at [https://expo.dev/signup](https://expo.dev/signup)
2. Login via terminal:
   ```bash
   eas login
   ```
3. Enter your Expo email and password when prompted
4. You should see: `Logged in as yourusername`

### Step C4 — Configure EAS Build

1. Navigate to the mobile folder:
   ```bash
   cd mobile
   ```
2. Run the EAS build configuration command:
   ```bash
   eas build:configure
   ```
3. When asked "Which platforms?", select **Android** (use arrow keys, press Space to select, then Enter)
4. This creates a file called `eas.json` in your `mobile` folder

5. Open the generated `eas.json` and replace its contents with:

   ```json
   {
     "cli": {
       "version": ">= 3.0.0"
     },
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         },
         "distribution": "internal"
       },
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```

   **What does this mean?**
   - `preview` profile: Builds an `.apk` file (for sharing directly, NOT via Play Store)
   - `production` profile: Builds an `.aab` file (for uploading to the Play Store later)

### Step C5 — Build the APK

1. Make sure you're in the `mobile` folder
2. Run:
   ```bash
   eas build --profile preview --platform android
   ```
3. **First time only:** EAS will ask some questions:
   - "Would you like to automatically generate a Keystore?" → **Yes**
     (A keystore is like a digital signature for your app. EAS manages it for you.)
   - It may also ask to update `app.json` — say **Yes**

4. EAS will now:
   - Upload your project to Expo's build servers
   - Build the APK in the cloud (takes **10-20 minutes**)
   - Give you a download link when done

5. You'll see a URL like:
   ```
   https://expo.dev/accounts/yourusername/projects/ceylon-boutique/builds/xxxx-xxxx
   ```

### Step C6 — Download and Share the APK

1. Click the URL from Step C5 (or go to [https://expo.dev](https://expo.dev) → your project → Builds)
2. Click **"Download"** to get the `.apk` file
3. The file will be named something like `ceylon-boutique.apk`

**To install on an Android phone:**
1. Transfer the APK to the phone (via WhatsApp, email, Google Drive, USB cable, etc.)
2. On the phone, tap the APK file to open it
3. If prompted, enable **"Install from unknown sources"**:
   - Go to Settings → Security → enable "Unknown sources"
   - Or on newer Android: Settings → Apps → Special access → Install unknown apps
4. Follow the install prompts
5. The app will appear in your app drawer like any other app!

### What About iOS?

Building for iOS requires:
- A paid Apple Developer account ($99/year)
- An `.ipa` file (iOS equivalent of APK)
- Distribution via TestFlight (Apple's beta testing platform)

For now, iOS users can continue using **Expo Go** for testing:
1. Publish your app to Expo:
   ```bash
   npx expo publish
   ```
2. iOS users open Expo Go → scan QR code or search your project
3. The app will now load from your live Render backend (since you updated the URL)

> **Note:** This is a reasonable approach for a university project. For a real commercial launch on the App Store, you would need to go through Apple's app review process.

---

## 6. Post-Deployment Checklist

After completing all three deployments, verify everything works:

### ✅ Backend Verification
- [ ] Visit `https://your-render-url.onrender.com` — see JSON response
- [ ] Check Render logs for `✅ MongoDB Connected`

### ✅ Image Upload Verification (Cloudinary)
- [ ] Upload a product image via the mobile app
- [ ] Verify the returned image URL starts with `https://res.cloudinary.com/`
- [ ] Open that URL in a browser — you should see the image
- [ ] Push a commit to trigger a Render redeploy — the same image URL should still load ✅

### ✅ Admin Panel Verification
- [ ] Visit `https://your-admin.vercel.app` — see login page
- [ ] Login with admin credentials
- [ ] Navigate through dashboard, sellers, products, orders, reviews pages
- [ ] Verify data loads from the live backend

### ✅ Mobile App Verification
- [ ] Install APK on an Android device
- [ ] Register a new customer account
- [ ] Browse products (verify product images load)
- [ ] Upload images when adding a product (seller flow)
- [ ] Place a test order

### ✅ Security Checklist
- [ ] Change the default admin password (`Admin@123456`) immediately
- [ ] Verify `.env` files are NOT in your GitHub repository
- [ ] Confirm `CORS_ORIGIN` is set to your admin URL (not `*`)
- [ ] MongoDB Atlas Network Access is set to "Allow from anywhere" (`0.0.0.0/0`) — this is required for Render to connect

---

## 7. Troubleshooting Common Issues

### Backend (Render)

| Problem | Solution |
|---------|----------|
| **Build fails with "npm ERR!"** | Check that `Root Directory` is set to `backend` in Render settings |
| **"Cannot connect to MongoDB"** | Verify `MONGODB_URI` in Render environment variables. Make sure Atlas Network Access allows `0.0.0.0/0` |
| **API works locally but not on Render** | Check Render logs (Dashboard → your service → Logs). Look for error messages |
| **First request takes 30+ seconds** | This is Render free tier cold start. Use [UptimeRobot](https://uptimerobot.com) to keep it awake |
| **"Application error" page** | Check that `Start Command` is `npm start` and `server.js` exists in the backend folder |

### Image Uploads (Cloudinary)

| Problem | Solution |
|---------|----------|
| **"Cloudinary" error in logs** | Check that `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set correctly in Render environment variables |
| **Image upload returns 500 error** | Verify your Cloudinary credentials are correct. Go to Cloudinary Dashboard → API Keys and double-check |
| **"File too large" error** | Image exceeds the 5MB per-file limit set in `middleware/upload.js`. Use a smaller image |
| **"Unsupported file format" error** | Only JPG, PNG, and WEBP files are allowed. Convert the image first |
| **Images load slowly** | Cloudinary serves images from a global CDN — this should be fast. If slow, check your internet connection |

### Admin Panel (Vercel)

| Problem | Solution |
|---------|----------|
| **Blank page after deploy** | Check that `Root Directory` is set to `admin` in Vercel project settings |
| **Login fails / network error** | Check that `VITE_API_URL` env var is set correctly in Vercel (must include `https://`) |
| **404 on page refresh** | Add `vercel.json` with rewrite rules (see Step B8 above) |
| **CORS error in browser console** | Update `CORS_ORIGIN` and `ADMIN_WEB_URL` on Render to match your Vercel URL exactly |
| **Changes not showing** | Vercel auto-deploys on push. Check the Vercel dashboard for deployment status |

### Mobile App (EAS Build)

| Problem | Solution |
|---------|----------|
| **"eas: command not found"** | Run `npm install -g eas-cli` again |
| **Build fails** | Check the build logs on expo.dev. Common cause: outdated packages |
| **App opens but shows network error** | Make sure you updated `BASE_URL` in `mobile/src/api/client.js` to your Render URL |
| **App crashes on launch** | Check build logs at expo.dev for errors. Try rebuilding |
| **"Owner field required"** | Add `"owner": "your-expo-username"` to `app.json` under the `expo` key |

---

## 8. Glossary of Terms

| Term | Meaning |
|------|---------|
| **Deploy** | Making your app available on the internet for others to use |
| **Hosting** | A service that runs your app on their servers 24/7 |
| **Environment Variables** | Secret settings (passwords, API keys) that your app needs but shouldn't be in code |
| **CORS** | A browser security rule that controls which websites can talk to your API |
| **CDN** | Content Delivery Network — servers around the world that serve your website files fast |
| **APK** | Android Package — an installable file for Android apps (like `.exe` for Windows) |
| **IPA** | iOS App Archive — an installable file for iOS apps |
| **AAB** | Android App Bundle — a format required by Google Play Store |
| **Cold Start** | When a sleeping server takes extra time to respond to the first request |
| **CI/CD** | Automatic building and deploying when you push code to GitHub |
| **EAS** | Expo Application Services — Expo's cloud build and distribution system |
| **Keystore** | A digital certificate that signs your Android app (proves it's from you) |
| **JWT** | JSON Web Token — a secure way to prove a user is logged in |
| **Build Command** | The command that compiles/prepares your code for production |
| **Start Command** | The command that actually runs your server |
| **Root Directory** | Which folder in your repo contains the app you're deploying |
| **SPA** | Single Page Application — a website that loads once and navigates without full page reloads |
| **Multer** | A Node.js middleware that handles file uploads sent as multipart/form-data |
| **Cloudinary** | A free cloud service that stores and serves your images via a global CDN (no local disk needed) |
| **CDN (Cloudinary)** | Images stored on Cloudinary are served from servers worldwide for fast loading |
| **FormData** | A web/mobile API for sending files (images) along with text data in a single HTTP request |

---

## Quick Reference — Your Production URLs

After deployment, fill in your actual URLs here:

| Component | URL |
|-----------|-----|
| **Backend API** | `https://ceylon-boutique-api.onrender.com` |
| **Admin Panel** | `https://ceylon-boutique-admin.vercel.app` |
| **Mobile APK** | Download from [https://expo.dev](https://expo.dev) → Builds |
| **MongoDB Atlas** | `https://cloud.mongodb.com` (manage your database) |
| **Cloudinary** | `https://console.cloudinary.com` (manage uploaded images) |

---

> **Congratulations!** 🎉 If you've followed all the steps above, your entire Ceylon Boutique Marketplace is now live on the internet. The backend runs on Render, images are stored on Cloudinary, the admin panel runs on Vercel, and the mobile app is an installable APK. All three connect to your MongoDB Atlas database in the cloud.
