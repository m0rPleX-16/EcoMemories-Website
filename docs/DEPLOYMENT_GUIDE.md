# EcoMemories — Cloud Deployment & Hosting Guide

> **Step-by-step instructions for temporary demo tunnels and permanent 24/7 cloud deployments.**

---

## 🚀 Option A: 24/7 Permanent Cloud Deployment (Recommended)

To keep your website online 24/7 accessible from any mobile phone even when your laptop is turned off:

### Step 1: Create a Free Managed Cloud PostgreSQL Database
1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. Under **Project Settings -> Database -> Connection string (URI)**, copy your PostgreSQL connection details.
   * `DB_CONNECTION=pgsql`
   * `DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com`
   * `DB_PORT=5432`
   * `DB_DATABASE=postgres`
   * `DB_USERNAME=postgres.YOUR_PROJECT_REF`
   * `DB_PASSWORD=YOUR_STRONG_PASSWORD`

---

### Step 2: Deploy to Railway.app or Render.com
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete EcoMemories MVP with privacy, security & docs"
   git push origin main
   ```
2. Create a new Web Service on **Railway.app** or **Render.com** and select your GitHub repository.
3. Add Environment Variables in the service settings:
   ```env
   APP_NAME=EcoMemories
   APP_ENV=production
   APP_KEY=base64:YOUR_APP_KEY_FROM_LOCAL_ENV
   APP_DEBUG=false
   APP_URL=https://your-app-name.up.railway.app
   
   DB_CONNECTION=pgsql
   DB_HOST=YOUR_SUPABASE_HOST
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=YOUR_SUPABASE_USER
   DB_PASSWORD=YOUR_SUPABASE_PASSWORD
   
   FILESYSTEM_DISK=public
   DEVICE_SECRET=YOUR_HARDWARE_SECRET_KEY
   ```
4. Configure the Build & Start Commands:
   * **Build Command**: `composer install --no-dev --optimize-autoloader && npm install && npm run build`
   * **Start Command**: `php artisan migrate --force && php artisan storage:link && php artisan serve --host=0.0.0.0 --port=$PORT`

---

## ⚡ Option B: Temporary Local Testing with Cloudflare Tunnel

For quick local demos directly from your laptop:

1. **Start Backend & Frontend Servers**:
   ```bash
   composer dev
   ```
2. **Start Cloudflare Tunnel**:
   ```bash
   .\cloudflared.exe tunnel --url http://127.0.0.1:8000
   ```
3. Copy the generated `https://xxxx.trycloudflare.com` URL and open it on your mobile phone or share it with testers.
4. *Note*: The link remains active as long as your laptop is awake and the terminal processes are running.
