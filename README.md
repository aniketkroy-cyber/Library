# Library & Student Management System (ReadBench)

Full-featured Library and Student Management Web Application with real-time Firebase sync, attendance, seat management, fee tracking, invoices, and payment integration.

## 🚀 GitHub Pages Deployment Guide

Project ko GitHub Pages par live karne ke liye 2 aasan tarike hain:

### Option 1: Automatic GitHub Actions (Recommended)
1. Repository me code push karein (`main` branch par).
2. GitHub repository me **Settings** > **Pages** par jayein.
3. **Build and deployment** section me **Source** ko **`GitHub Actions`** select karein.
4. Workflow automatic run hoga aur website live ho jayegi!

### Option 2: Deploy from `gh-pages` branch
Agar aap GitHub Actions source nahi use karna chahte:
1. Workflow `dist` folder ko automatic `gh-pages` branch par push kar dega.
2. GitHub repository me **Settings** > **Pages** me jayein.
3. **Source**: `Deploy from a branch` select karein.
4. **Branch**: `gh-pages` aur folder `/ (root)` select karke **Save** karein.

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```
