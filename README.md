# My First Web - Deployment Guide

This project is built with Node.js, Express, HTML/JS, Supabase, and Resend.

## 1. Prerequisites (For Linux VPS)
- Node.js (v18+)
- npm
- PM2 (Install globally: `npm install -g pm2`)
- Nginx (Optional, for reverse proxy)

## 2. Setup
1. Clone the repository.
2. Run `npm install` to install all dependencies.
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your real API keys and credentials.

## 3. Run Locally
```bash
npm run dev
```

## 4. Run on Production
To start the application in the background using PM2:
```bash
pm2 start ecosystem.config.js --env production
```
To ensure PM2 starts on server reboot:
```bash
pm2 startup
pm2 save
```

## 5. Security Notes
- **Never commit `.env` to Git.**
- All sensitive information (Resend API Key, Admin Password) has been moved to environment variables. Ensure these are securely configured in your `.env` file on the VPS.
