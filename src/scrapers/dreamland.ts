import * as cheerio from "cheerio";
import type { Product, ScrapeResult } from "../types.js";

const BASE_URL = "https://www.dreamland.nl";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
};

function parseAvailability(text: string): {
  available: boolean;
  status: string;
} {
  const lower = text.toLowerCase();
  if (lower.includes("uitverkocht")) {
    return { available: false, status: "Out of stock" };
  }
  if (lower.includes("pre-order")) {
    return { available: true, status: "Pre-order" };
  }
  if (lower.includes("levertijd")) {
    return { available: true, status: "In stock" };
  }
  return { available: false, status: "Unknown" };
}

export async function scrapeDreamlandSearch(
  query: string
): Promise<ScrapeResult> {
  const url = `${BASE_URL}/zoeken/producten?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      return {
        store: "Dreamland",
        products: [],
        error: `Search returned HTTP ${res.status}`,
      };
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $("article, .product-card, [data-testid='product-card'], li").each(
      (_, elem) => {
        const $el = $(elem);
        const name = $el
          .find("h2, h3, .product-card__title, .product-title")
          .first()
          .text()
          .trim();
        const link = $el.find("a[href*='/producten/']").first().attr("href");
        const priceText = $el.text().match(/€\s*[\d,.]+/);
        const price = priceText ? priceText[0] : null;
        const statusText = $el.text();
        const { available, status } = parseAvailability(statusText);

        if (name && link) {
          const fullUrl = link.startsWith("http")
            ? link
            : `${BASE_URL}${link}`;
          products.push({
            name,
            price,
            url: fullUrl,
            available,
            store: "Dreamland",
            status,
          });
        }
      }
    );

    return { store: "Dreamland", products };
  } catch (err) {
    return {
      store: "Dreamland",
      products: [],
      error: `Search failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function scrapeDreamlandProduct(
  productUrl: string
): Promise<ScrapeResult> {
  try {
    const res = await fetch(productUrl, { headers: HEADERS });
    if (!res.ok) {
      return {
        store: "Dreamland",
        products: [],
        error: `Product page returned HTTP ${res.status}`,
      };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const name = $("h1").first().text().trim();
    const priceText = $("body").text().match(/€\s*[\d,.]+/);
    const price = priceText ? priceText[0] : null;
    const bodyText = $("body").text();
    const { available, status } = parseAvailability(bodyText);

    if (name) {
      return {
        store: "Dreamland",
        products: [
          {
            name,
            price,
            url: productUrl,
            available,
            store: "Dreamland",
            status,
          },
        ],
      };
    }

    return {
      store: "Dreamland",
      products: [],
      error: "Could not parse product page",
    };
  } catch (err) {
    return {
      store: "Dreamland",
      products: [],
      error: `Product fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
