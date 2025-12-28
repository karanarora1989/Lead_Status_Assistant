# Sales Central for RMs

AI-Powered Lead Management Assistant for Relationship Managers in the Lending Industry.

## Quick Deploy to Vercel

### Method 1: Using Vercel Dashboard (Easiest)

1. **Zip this folder** (sales-central-deploy)
2. Go to [vercel.com](https://vercel.com)
3. Sign up / Log in (use GitHub, GitLab, or email)
4. Click **"Add New..." → "Project"**
5. Click **"Import Git Repository"** or drag & drop your zip file
6. Vercel will auto-detect Vite React app
7. **IMPORTANT: Add Environment Variable**
   - Click "Environment Variables"
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (from https://console.anthropic.com/settings/keys)
8. Click **Deploy**
9. Wait 2-3 minutes
10. Get your URL: `https://your-app-name.vercel.app`

### Method 2: Using Vercel CLI (Advanced)

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to this folder
cd sales-central-deploy

# Install dependencies
npm install

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? sales-central (or your choice)
# - Directory? ./
# - Override settings? No

# Add your API key
vercel env add VITE_ANTHROPIC_API_KEY

# Paste your Anthropic API key when prompted
# Select: Production, Preview, Development (all 3)

# Deploy to production
vercel --prod
```

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your API key to .env
# VITE_ANTHROPIC_API_KEY=sk-ant-...

# Start dev server
npm run dev

# Open http://localhost:5173
```

## Features

- 📊 Lead Pipeline Management
- 🔍 Smart Lead Search with # trigger
- 🤖 AI-Powered Assistant (Claude Sonnet 4)
- 🔔 Reminder System for Follow-ups
- 📱 Mobile Responsive
- 💾 localStorage for Reminders

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide Icons
- Anthropic Claude API

## Environment Variables

- `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key (required)

## Support

For issues or questions, contact the development team.
