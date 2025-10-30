# CI/CD Setup for StockBrain

This document describes the continuous integration and deployment pipeline for the StockBrain application.

## Overview

StockBrain uses GitHub Actions for automated building, testing, and deployment to Cloudflare Workers.

## Workflows

### 1. Pull Request Checks (`pr-checks.yml`)

**Trigger:** Pull requests to `main` branch

**Purpose:** Validates that the application builds successfully before merging

**Steps:**
- Checkout code
- Setup Node.js 20
- Install dependencies with `npm ci`
- Build application with `npm run build`
- Validate build output (checks for `dist/index.html` and `dist/assets/`)
- Comment build status on PR

### 2. Deploy to Cloudflare Workers (`deploy.yml`)

**Trigger:** 
- Push to `main` branch
- Pull requests to `main` (build only, no deploy)
- Manual workflow dispatch

**Jobs:**

#### Build Job
- Checkout code
- Setup Node.js 20
- Install dependencies
- Build application
- Upload build artifacts

#### Deploy Job (main branch only)
- Download build artifacts
- Deploy to Cloudflare Workers using Wrangler
- Verify deployment
- Comment deployment status

#### Notify Job
- Checks overall status of build and deployment
- Provides status messages

## Required Secrets

To enable deployment, the following secrets must be configured in GitHub repository settings:

1. **CLOUDFLARE_API_TOKEN**
   - Cloudflare API token with Workers deployment permissions
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Required permissions: "Edit Cloudflare Workers"

2. **CLOUDFLARE_ACCOUNT_ID**
   - Your Cloudflare account ID
   - Found in: Cloudflare Dashboard → Workers & Pages → Overview

## Setup Instructions

### 1. Configure Cloudflare Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add both secrets mentioned above

### 2. Verify Deployment

After pushing to `main` or merging a PR:

1. Check the Actions tab in GitHub
2. Monitor the workflow run
3. Once complete, visit: https://stockbrain.averymiddlebrook2014.workers.dev/

## Local Development

The CI/CD pipeline mimics local development:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# The dist/ folder contains the built application
# This is what gets deployed to Cloudflare Workers
```

## Deployment Process

1. **On PR Creation:**
   - PR checks workflow runs
   - Validates build succeeds
   - Comments on PR with status

2. **On Merge to Main:**
   - Build job runs
   - Deploy job deploys to production
   - Deployment URL is verified
   - Status is reported

## Troubleshooting

### Build Fails
- Check Node.js version (should be 20)
- Verify all dependencies are in `package.json`
- Run `npm ci` and `npm run build` locally to reproduce

### Deployment Fails
- Verify Cloudflare secrets are correctly configured
- Check Cloudflare account has Workers enabled
- Verify `wrangler.toml` configuration is correct

### Deployment Verification
- Check workflow logs in GitHub Actions
- Visit the deployment URL
- Check Cloudflare Dashboard for deployment status

## Monitoring

- **GitHub Actions:** View all workflow runs in the Actions tab
- **Cloudflare Dashboard:** Monitor Workers metrics and logs
- **Application URL:** https://stockbrain.averymiddlebrook2014.workers.dev/

## Status Badges

Add these to your README.md:

```markdown
[![Deploy to Cloudflare Workers](https://github.com/amiddlebrook/StockBrain/actions/workflows/deploy.yml/badge.svg)](https://github.com/amiddlebrook/StockBrain/actions/workflows/deploy.yml)
[![CI - Pull Request Checks](https://github.com/amiddlebrook/StockBrain/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/amiddlebrook/StockBrain/actions/workflows/pr-checks.yml)
```
