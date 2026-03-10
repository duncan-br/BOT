import { loadConfig } from "./config.js";
import {
  scrapeDreamlandSearch,
  scrapeDreamlandProduct,
} from "./scrapers/dreamland.js";
import { sendDiscordNotification, sendDiscordError } from "./notifier.js";
import { loadState, saveState } from "./state.js";
import type { Product, ScrapeResult } from "./types.js";

const config = loadConfig();

function productKey(p: Product): string {
  return `${p.store}:${p.url}`;
}

function isRelevant(product: Product): boolean {
  const name = product.name.toLowerCase();
  return (
    name.includes("ascended heroes") &&
    (name.includes("elite trainer") || name.includes("etb"))
  );
}

function timestamp(): string {
  return new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });
}

async function runCheck(): Promise<void> {
  console.log(`[${timestamp()}] Running stock check...`);

  const state = loadState();
  const results: ScrapeResult[] = [];
  const tasks: Promise<ScrapeResult>[] = [];

  for (const term of config.searchTerms) {
    tasks.push(scrapeDreamlandSearch(term));
  }

  for (const store of config.stores) {
    for (const url of store.urls) {
      tasks.push(scrapeDreamlandProduct(url));
    }
  }

  const settled = await Promise.allSettled(tasks);
  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      console.error("  Task rejected:", result.reason);
    }
  }

  const errors: string[] = [];
  const newlyAvailable: Product[] = [];
  let totalProducts = 0;

  for (const result of results) {
    if (result.error) {
      console.warn(`  ⚠ ${result.store}: ${result.error}`);
      errors.push(`${result.store}: ${result.error}`);
    }

    for (const product of result.products) {
      totalProducts++;
      const relevant = isRelevant(product);
      const key = productKey(product);

      if (relevant) {
        console.log(
          `  📦 [${product.store}] ${product.name} — ${product.status}${product.price ? ` (${product.price})` : ""}`
        );
      }

      if (relevant && product.available && !state.alerted.includes(key)) {
        newlyAvailable.push(product);
        state.alerted.push(key);
      }

      if (relevant && !product.available) {
        state.alerted = state.alerted.filter((k: string) => k !== key);
      }
    }
  }

  console.log(
    `  Found ${totalProducts} products across ${results.length} sources`
  );

  if (newlyAvailable.length > 0) {
    console.log(
      `  🚨 ${newlyAvailable.length} NEW product(s) available! Sending Discord alert...`
    );
    await sendDiscordNotification(config.discordWebhookUrl, newlyAvailable);
    state.consecutiveErrors = 0;
  } else {
    console.log("  No new stock found.");
  }

  if (errors.length > 0) {
    state.consecutiveErrors++;
    if (state.consecutiveErrors >= 5) {
      await sendDiscordError(
        config.discordWebhookUrl,
        `Monitor has encountered ${state.consecutiveErrors} consecutive errors:\n${errors.join("\n")}`
      );
      state.consecutiveErrors = 0;
    }
  } else {
    state.consecutiveErrors = 0;
  }

  state.lastRun = new Date().toISOString();
  saveState(state);
}

async function main(): Promise<void> {
  const mode = process.argv.includes("--loop") ? "loop" : "single";

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Pokémon Ascended Heroes Stock Monitor  ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`Mode: ${mode === "loop" ? "continuous polling" : "single run"}`);
  console.log(`Monitoring: Dreamland.nl`);
  console.log(`Search terms: ${config.searchTerms.join(", ")}`);
  console.log(
    `Direct URLs: ${config.stores.reduce((n, s) => n + s.urls.length, 0)}`
  );
  console.log(`Discord webhook: ...${config.discordWebhookUrl.slice(-20)}`);
  console.log();

  await runCheck();

  if (mode === "loop") {
    console.log(
      `\nPolling every ${config.pollIntervalSeconds}s (Ctrl+C to stop)`
    );
    setInterval(runCheck, config.pollIntervalSeconds * 1000);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
