# Pokémon Ascended Heroes Stock Monitor

Monitors **Intertoys** and **Dreamland** for the Pokémon Mega Evolution — Ascended Heroes Elite Trainer Box and sends Discord notifications when stock is detected.

## Setup

### 1. Create a Discord webhook

1. Open your Discord server, go to **Server Settings → Integrations → Webhooks**
2. Click **New Webhook**, pick a channel, and copy the webhook URL

### 2. Deploy to GitHub (free, automated)

1. Create a new **private** repository on GitHub
2. Push this code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to your repo on GitHub → **Settings → Secrets and variables → Actions**
4. Click **New repository secret**:
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: your Discord webhook URL from step 1
5. Go to **Actions** tab and enable workflows if prompted

The monitor will now run every 5 minutes automatically. You can also trigger it manually from the **Actions** tab → **Pokémon Stock Monitor** → **Run workflow**.

### 3. Run locally (optional)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your DISCORD_WEBHOOK_URL

# Single check
npm start

# Continuous polling (every 60s)
npm run start:loop
```

## How it works

Every 5 minutes, the bot:

1. Searches both Intertoys and Dreamland for "ascended heroes elite trainer box"
2. Also checks known direct product page URLs on Dreamland
3. Filters results for the ETB specifically
4. If a product is **in stock** or available for **pre-order**, sends a Discord alert
5. Tracks what has already been alerted to avoid duplicate notifications

## Configuration

Edit `src/config.ts` to change:

- **Store URLs** — add direct product page URLs to monitor
- **Search terms** — modify what search queries are used
- **Poll interval** — change the local polling interval (GitHub Actions is fixed at 5 min)

## Project structure

```
src/
├── index.ts              # Main entry point
├── config.ts             # Configuration
├── state.ts              # State persistence (tracks alerts)
├── notifier.ts           # Discord webhook
├── types.ts              # Shared types
└── scrapers/
    ├── dreamland.ts      # Dreamland.be scraper
    └── intertoys.ts      # Intertoys.nl scraper
.github/
└── workflows/
    └── stock-monitor.yml # GitHub Actions cron job
```
