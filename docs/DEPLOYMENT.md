# OpenIPTV Deployment Guide

Complete guide for deploying OpenIPTV to production.

---

## 🚀 Quick Deploy Options

| Platform | Free Tier | Ease | Docker | Best For |
|----------|-----------|------|--------|----------|
| **Vercel** | ✅ Generous | ⭐⭐⭐⭐⭐ | ❌ | Next.js apps |
| **Railway** | ✅ $5/mo | ⭐⭐⭐⭐⭐ | ✅ | Easy Docker |
| **Render** | ✅ Limited | ⭐⭐⭐⭐ | ✅ | Simple deploys |
| **Fly.io** | ✅ Limited | ⭐⭐⭐⭐ | ✅ | Edge deployment |
| **Netlify** | ✅ Generous | ⭐⭐⭐⭐ | ❌ | Static + Functions |
| **Cloudflare** | ✅ Unlimited | ⭐⭐⭐⭐ | ❌ | Global CDN |
| **DigitalOcean** | ❌ | ⭐⭐⭐ | ✅ | VPS control |
| **AWS/GCP/Azure** | ✅ Credits | ⭐⭐ | ✅ | Enterprise |

---

## 🐳 Docker Deployment

### Quick Start

```bash
# Build and run with Docker Compose (recommended)
docker-compose up -d

# Or build manually
docker build -t openiptv .
docker run -d -p 3000:3000 --name openiptv openiptv
```

### Docker Commands

```bash
# Build image
docker build -t openiptv:latest .

# Run container
docker run -d \
  --name openiptv \
  -p 3000:3000 \
  --restart unless-stopped \
  openiptv:latest

# View logs
docker logs -f openiptv

# Stop/Remove
docker stop openiptv && docker rm openiptv

# Rebuild and restart
docker-compose down && docker-compose up -d --build
```

---

## ☁️ Platform-Specific Guides

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

Or via dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Click "Deploy" - no configuration needed

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render

Uses the included `render.yaml`:

```yaml
services:
  - type: web
    name: openiptv
    env: docker
    dockerfilePath: ./Dockerfile
```

### Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
fly deploy
```

Uses the included `fly.toml`.

### Netlify

1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`

### Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Build output: `.next`

---

## 🖥️ Self-Hosted (VPS)

### With Docker

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and start
git clone https://github.com/chikosan/openiptv.git
cd openiptv
docker-compose up -d
```

### Without Docker

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build
git clone https://github.com/chikosan/openiptv.git
cd openiptv
npm install
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name "openiptv" -- start
pm2 save && pm2 startup
```

### Nginx Reverse Proxy + SSL

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Setup SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `NEXT_TELEMETRY_DISABLED` | Disable telemetry | `1` |

Optional:
```bash
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## 🔒 Security Checklist

- [ ] HTTPS enabled (automatic on Vercel/Netlify/Railway)
- [ ] Security headers configured in `next.config.js`
- [ ] Rate limiting (if adding API routes)
- [ ] CORS properly configured

---

## 🔄 CI/CD with GitHub Actions

The project includes `.github/workflows/docker-publish.yml` for automatic Docker image publishing.

For custom deployments:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
```

---

## ✅ Pre-Launch Checklist

- [ ] Test with real playlist URL
- [ ] Verify on multiple browsers
- [ ] Test on mobile devices
- [ ] Check Lighthouse score (>90)
- [ ] Setup error monitoring
- [ ] Configure analytics
- [ ] Add custom domain
- [ ] Verify HTTPS works

---

## 🚨 Rollback

**Vercel/Netlify:** Go to Deployments → Previous deployment → Promote to Production

**Manual:**
```bash
git log
git revert <commit-hash>
git push
```

---

**Need help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open an issue.
