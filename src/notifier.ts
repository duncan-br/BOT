import type { Product } from "./types.js";

export async function sendDiscordNotification(
  webhookUrl: string,
  products: Product[]
): Promise<void> {
  if (!products.length) return;

  const embeds = products.map((p) => ({
    title: `🟢 ${p.name}`,
    url: p.url,
    color: p.status === "Pre-order" ? 0xffa500 : 0x00ff00,
    fields: [
      { name: "Store", value: p.store, inline: true },
      { name: "Status", value: p.status, inline: true },
      ...(p.price ? [{ name: "Price", value: p.price, inline: true }] : []),
      { name: "Link", value: `[Buy now](${p.url})` },
    ],
    timestamp: new Date().toISOString(),
  }));

  const batchSize = 10;
  for (let i = 0; i < embeds.length; i += batchSize) {
    const batch = embeds.slice(i, i + batchSize);
    const body = {
      username: "Pokémon Stock Monitor",
      content:
        i === 0
          ? "**🚨 Stock Alert — Ascended Heroes ETB detected!**"
          : undefined,
      embeds: batch,
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Discord webhook failed (${res.status}): ${text}`);
    }

    if (i + batchSize < embeds.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export async function sendDiscordError(
  webhookUrl: string,
  message: string
): Promise<void> {
  const body = {
    username: "Pokémon Stock Monitor",
    embeds: [
      {
        title: "⚠️ Monitor Error",
        description: message,
        color: 0xff0000,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    console.error("Failed to send error notification to Discord");
  }
}
