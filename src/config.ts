import "dotenv/config";
import type { Config } from "./types.js";

export function loadConfig(): Config {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("ERROR: DISCORD_WEBHOOK_URL is not set in .env");
    console.error("Copy .env.example to .env and fill in your webhook URL.");
    process.exit(1);
  }

  const pollInterval = parseInt(
    process.env.POLL_INTERVAL_SECONDS || "60",
    10
  );

  return {
    discordWebhookUrl: webhookUrl,
    pollIntervalSeconds: Math.max(30, pollInterval),
    stores: [
      {
        name: "Dreamland",
        enabled: true,
        urls: [
          "https://www.dreamland.nl/producten/pokemon-me-2-5-ascended-heroes-elite-trainer-box-uk/02344089",
        ],
      },
    ],
    searchTerms: ["Pokemon TCG"],
  };
}
