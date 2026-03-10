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
          "https://www.dreamland.be/nl/producten/pokemon-mega-evolution-ascended-heroes-elite-trainer-box-uk/02344072",
          "https://www.dreamland.be/fr/produits/pokemon-heros-transcendants-elite-trainer-box-fr/02344072",
        ],
      },
      {
        name: "Intertoys",
        enabled: true,
        urls: [],
      },
    ],
    searchTerms: [
      "ascended heroes elite trainer box",
      "ascended heroes etb",
    ],
  };
}
