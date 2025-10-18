# Deploying CardiologySuiteApp vNext to Cloudflare Pages

Complete guide for deploying your Cardiology Suite to Cloudflare Pages with custom domain configuration.

---

## 🌐 Why Cloudflare Pages?

- **Free Tier**: Unlimited bandwidth and requests
- **Global CDN**: Lightning-fast delivery worldwide
- **Automatic HTTPS**: Free SSL certificates
- **GitHub Integration**: Auto-deploy on push
- **Web Analytics**: Privacy-first analytics included
- **DDoS Protection**: Enterprise-grade security
- **Custom Domains**: Easy domain management

---

## 📋 Prerequisites

- [x] GitHub account with CardiologySuiteApp_vNext repository
- [x] Cloudflare account (free tier is fine)
- [ ] Domain name (optional, but needed for custom domain)

---

## 🚀 Part 1: Deploy to Cloudflare Pages

### Step 1: Sign Up / Log In to Cloudflare

1. Go to https://dash.cloudflare.com/sign-up
2. Create account or log in
3. Navigate to **Pages** in the left sidebar

### Step 2: Connect GitHub Repository

1. Click **"Create a project"**
2. Click **"Connect to Git"**
3. Choose **GitHub**
4. **Authorize Cloudflare Pages** to access your GitHub account
5. Select **CardiologySuiteApp_vNext** repository

### Step 3: Configure Build Settings

```
Project name: cardiology-suite-vnext
Production branch: main

Build settings:
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: (leave blank)

Environment variables:
VITE_API_BASE_URL: https://your-ai-service.azurewebsites.net
NODE_VERSION: 16
```

**Important Build Commands:**

If your build needs CSS first:
```bash
Build command: npm run build:css && npm run build
```

### Step 4: Deploy

1. Click **"Save and Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Your site will be live at: `https://cardiology-suite-vnext.pages.dev`

---

## 🌍 Part 2: Add Custom Domain

### Option A: Domain Already on Cloudflare

If your domain DNS is already managed by Cloudflare:

1. **In Cloudflare Pages:**
   - Go to your project
   - Click **"Custom domains"** tab
   - Click **"Set up a custom domain"**
   - Enter your domain: `cardiology-app.com` or `app.yourdomain.com`
   - Click **"Continue"**

2. **Cloudflare automatically creates DNS records** (CNAME)
   - No manual DNS configuration needed!
   - SSL certificate is auto-provisioned

3. **Activate domain:**
   - Click **"Activate domain"**
   - Wait 5-10 minutes for DNS propagation
   - Your site is live at your custom domain! 🎉

### Option B: Domain NOT on Cloudflare

If your domain is registered elsewhere (GoDaddy, Namecheap, etc.):

#### Method 1: Transfer DNS to Cloudflare (Recommended)

1. **Add site to Cloudflare:**
   - Dashboard → **"Add site"**
   - Enter your domain
   - Choose **Free plan**
   - Cloudflare scans your DNS records

2. **Update nameservers at your registrar:**
   - Cloudflare provides nameservers like:
     ```
     tim.ns.cloudflare.com
     uma.ns.cloudflare.com
     ```
   - Log in to your domain registrar
   - Update nameservers to Cloudflare's
   - Save changes (propagation: 24-48 hours)

3. **Add custom domain in Pages:**
   - Once nameservers are active
   - Follow "Option A" steps above

#### Method 2: CNAME Only (Subdomain)

For subdomain only (e.g., `app.yourdomain.com`):

1. **In Cloudflare Pages:**
   - Get your Pages URL: `cardiology-suite-vnext.pages.dev`

2. **At your domain registrar:**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: app
     Target: cardiology-suite-vnext.pages.dev
     TTL: Auto or 3600
     ```

3. **Back in Cloudflare Pages:**
   - Add custom domain: `app.yourdomain.com`
   - Verify DNS
   - Activate

---

## 🔧 Part 3: Configuration & Optimization

### Environment Variables

Add environment variables in Cloudflare Pages:

1. **Go to:** Project → Settings → Environment variables
2. **Add variables:**

```bash
# Production
VITE_API_BASE_URL = https://your-ai-service.azurewebsites.net
VITE_ENVIRONMENT = production
NODE_VERSION = 16

# Preview (optional - for PR previews)
VITE_API_BASE_URL = https://your-ai-service-staging.azurewebsites.net
VITE_ENVIRONMENT = preview
```

### Build Configuration

Create `cloudflare-pages-build.sh` in your repo:

```bash
#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci

echo "Building CSS..."
npm run build:css

echo "Building application..."
npm run build

echo "Build complete!"
ls -la dist/
```

Then update build command in Cloudflare:
```bash
chmod +x cloudflare-pages-build.sh && ./cloudflare-pages-build.sh
```

### Custom Headers & Redirects

Create `public/_headers` file:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/
  Cache-Control: no-cache, no-store, must-revalidate
```

Create `public/_redirects` file for SPA routing:

```
# SPA routing - send all requests to index.html
/*    /index.html   200
```

---

## 🔐 Part 4: SSL & Security

### SSL Certificate (Automatic)

Cloudflare automatically provisions SSL certificates:

1. **Universal SSL** is enabled by default
2. Certificate auto-renews
3. Supports both root domain and www subdomain
4. HTTPS-only redirect available in settings

### Enable HTTPS Redirect

1. Go to **SSL/TLS** → **Edge Certificates**
2. Enable **"Always Use HTTPS"**
3. Set **Minimum TLS Version** to 1.2 or higher

### Security Headers

Already configured in `_headers` file above. Additional options:

1. **Cloudflare Dashboard** → **Security** → **Settings**
2. Enable:
   - **Security Level:** Medium or High
   - **Challenge Passage:** 30 minutes
   - **Browser Integrity Check:** On

---

## 📊 Part 5: Analytics & Monitoring

### Enable Web Analytics

1. **Cloudflare Pages** → Your project → **Analytics**
2. Click **"Enable Web Analytics"**
3. Privacy-first, no cookies required
4. View:
   - Page views
   - Unique visitors
   - Top pages
   - Referrers
   - Countries

### Performance Monitoring

Built-in metrics available:
- Build time
- Deploy time
- Request counts
- Bandwidth usage
- Error rates

---

## 🔄 Part 6: CI/CD & Automatic Deployments

### Automatic Deployments

Cloudflare automatically deploys on:
- **Push to `main`** → Production deployment
- **Pull requests** → Preview deployments (unique URL per PR)

### Preview Deployments

Every PR gets a unique URL:
```
https://abc123.cardiology-suite-vnext.pages.dev
```

Great for testing before merging!

### Deploy Hooks

Create manual deploy hooks:

1. **Settings** → **Builds & deployments**
2. Click **"Add deploy hook"**
3. Name: "Manual Deploy"
4. Branch: main
5. **Copy webhook URL**

Trigger deploy via curl:
```bash
curl -X POST https://api.cloudflare.com/client/v4/pages/webhooks/deploy/YOUR_HOOK_ID
```

---

## 🚀 Part 7: Advanced Configuration

### Custom Build Cache

Speed up builds by caching dependencies:

```yaml
# In your build settings
Cache Key: ${{ hashFiles('package-lock.json') }}
```

### Functions (Serverless)

Cloudflare Pages supports serverless functions:

Create `functions/api/hello.js`:
```javascript
export async function onRequest(context) {
  return new Response('Hello from Cloudflare!', {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

Access at: `https://yourdomain.com/api/hello`

### Access Control

Protect staging/preview environments:

1. **Access** → **Applications**
2. Create application
3. Add authentication rules
4. Apply to preview URLs

---

## 📱 Part 8: Domain Migration (Old → New)

### Step 1: Set Up New Site First

Deploy to Cloudflare Pages with **temporary domain**:
- `cardiology-suite-vnext.pages.dev`

### Step 2: Test Everything

Thoroughly test the new deployment:
- All routes work (`#/notes`, `#/trees/acs`, etc.)
- AI features function properly
- Performance is acceptable
- Mobile responsive
- No console errors

### Step 3: DNS Migration

For **root domain** (e.g., `cardiology-app.com`):

1. **Add custom domain** in Cloudflare Pages
2. Cloudflare provides DNS records:
   ```
   Type: CNAME
   Name: @
   Target: cardiology-suite-vnext.pages.dev
   ```
   OR
   ```
   Type: A
   Name: @
   Target: [Cloudflare IP addresses]
   ```

3. **Update DNS** at your current provider
4. **Wait for propagation** (5 minutes - 48 hours)

### Step 4: Redirect Old Site (Optional)

Add redirect in old repository:

Create `public/_redirects`:
```
/* https://new-domain.com/:splat 301!
```

Or update old site's `index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=https://new-domain.com">
  <title>Redirecting...</title>
</head>
<body>
  <p>Site has moved to <a href="https://new-domain.com">https://new-domain.com</a></p>
  <script>window.location.href = 'https://new-domain.com';</script>
</body>
</html>
```

---

## 🧪 Part 9: Testing Your Deployment

### Pre-Launch Checklist

```bash
# 1. Test the Pages URL
curl -I https://cardiology-suite-vnext.pages.dev

# 2. Test custom domain
curl -I https://your-domain.com

# 3. Test HTTPS redirect
curl -I http://your-domain.com

# 4. Test routes
curl https://your-domain.com/#/notes
curl https://your-domain.com/#/trees/acs

# 5. Test assets
curl -I https://your-domain.com/assets/index.js
```

### Browser Tests

- [ ] Homepage loads
- [ ] All routes navigate correctly
- [ ] Note parser works
- [ ] Decision trees function
- [ ] Search works
- [ ] AI features work (if configured)
- [ ] PWA installs properly
- [ ] Mobile responsive
- [ ] No console errors

### Performance Tests

```bash
# Lighthouse audit
npx lighthouse https://your-domain.com --view

# PageSpeed Insights
https://pagespeed.web.dev/
```

---

## 🔍 Part 10: Troubleshooting

### Build Fails

**Check build logs:**
1. Cloudflare Pages → Your project → Deployments
2. Click failed deployment
3. View logs

**Common issues:**
```bash
# Missing dependencies
Solution: npm ci instead of npm install

# Build command incorrect
Solution: npm run build:css && npm run build

# Node version mismatch
Solution: Add NODE_VERSION=16 to environment variables

# Out of memory
Solution: Add NODE_OPTIONS=--max_old_space_size=4096
```

### Custom Domain Not Working

**Check DNS:**
```bash
# Check DNS propagation
dig your-domain.com

# Check nameservers
dig NS your-domain.com
```

**Common issues:**
- DNS not propagated (wait 24-48 hours)
- CNAME flattening not enabled
- Conflicting A records
- SSL certificate pending

### 404 Errors on Routes

**Issue:** Routes like `/#/notes` return 404

**Solution:** Add `_redirects` file:
```
/*    /index.html   200
```

### CORS Errors

**Issue:** AI service requests blocked

**Solution:** Configure CORS in your AI service:
```javascript
// In services/ai-search/server.js
app.use(cors({
  origin: [
    'https://cardiology-suite-vnext.pages.dev',
    'https://your-domain.com'
  ]
}));
```

---

## 📋 Quick Reference

### Cloudflare Pages URLs

```
Production: https://cardiology-suite-vnext.pages.dev
Preview PR: https://abc123.cardiology-suite-vnext.pages.dev
Custom: https://your-domain.com
```

### Common Commands

```bash
# Local development
npm run dev

# Build for production
npm run build:css && npm run build

# Preview build locally
npm run preview

# Test production build
npx serve dist
```

### Important Links

- **Dashboard:** https://dash.cloudflare.com/
- **Pages Docs:** https://developers.cloudflare.com/pages/
- **Community:** https://community.cloudflare.com/
- **Status:** https://www.cloudflarestatus.com/

---

## 💡 Pro Tips

### 1. Use Preview Deployments
Every PR automatically gets a preview URL. Share with team for review.

### 2. Branch Deployments
Deploy specific branches:
```
main → Production
staging → Staging environment
dev → Development preview
```

### 3. Rollback Instantly
Cloudflare keeps deployment history:
1. Go to Deployments
2. Find previous working version
3. Click **"Rollback to this deployment"**

### 4. Monitor Performance
Enable Web Analytics for real-time insights without sacrificing privacy.

### 5. Use Workers for API
Deploy your AI search service as Cloudflare Workers instead of Azure:
```javascript
// workers/ai-search.js
export default {
  async fetch(request) {
    // Handle /api/search
  }
}
```

### 6. Optimize Images
Use Cloudflare Image Optimization (paid) or compress before deploying.

### 7. Set Up Alerts
Cloudflare can alert you on:
- Deployment failures
- Traffic spikes
- Security threats

---

## 🎯 Summary: Quick Deploy Steps

```bash
# 1. Build locally to verify
npm run build:css && npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "feat: optimize for Cloudflare Pages"
git push origin main

# 3. In Cloudflare Pages:
# - Connect GitHub repo
# - Configure build: npm run build
# - Set output dir: dist
# - Deploy

# 4. Add custom domain:
# - Custom domains → Add domain
# - Update DNS (if needed)
# - Activate

# 5. Test
curl -I https://your-domain.com
```

---

## 📞 Need Help?

- **Cloudflare Docs:** https://developers.cloudflare.com/pages/
- **Community Forum:** https://community.cloudflare.com/
- **Support:** https://dash.cloudflare.com/?to=/:account/support

---

**Last Updated:** October 18, 2025  
**Status:** Production Ready  
**Deployment Time:** ~5-10 minutes  
**Cost:** FREE (generous free tier)

🎊 **Happy Deploying!** 🚀
