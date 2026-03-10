import * as cheerio from "cheerio";
import type { Product, ScrapeResult } from "../types.js";

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
  if (
    lower.includes("uitverkocht") ||
    lower.includes("niet leverbaar") ||
    lower.includes("niet beschikbaar")
  ) {
    return { available: false, status: "Out of stock" };
  }
  if (lower.includes("pre-order")) {
    return { available: true, status: "Pre-order" };
  }
  if (
    lower.includes("in winkelwagen") ||
    lower.includes("bestel") ||
    lower.includes("levertijd") ||
    lower.includes("leverbaar")
  ) {
    return { available: true, status: "In stock" };
  }
  return { available: false, status: "Unknown" };
}

export async function scrapeIntertoysSearch(
  query: string
): Promise<ScrapeResult> {
  const url = `https://www.intertoys.nl/zoeken?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return {
        store: "Intertoys",
        products: [],
        error: `Search returned HTTP ${res.status}`,
      };
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $(
      "article, .product-card, [data-testid='product-card'], .product-tile"
    ).each((_, elem) => {
      const $el = $(elem);
      const name =
        $el.find("h2, h3, .product-card__title, .product-title").first().text().trim();
      const link = $el.find("a[href]").first().attr("href");
      const price =
        $el.find(".price, .product-card__price, [data-testid='price']").first().text().trim() ||
        null;
      const statusText = $el.text();
      const { available, status } = parseAvailability(statusText);

      if (name && link) {
        const fullUrl = link.startsWith("http")
          ? link
          : `https://www.intertoys.nl${link}`;
        products.push({
          name,
          price,
          url: fullUrl,
          available,
          store: "Intertoys",
          status,
        });
      }
    });

    return { store: "Intertoys", products };
  } catch (err) {
    return {
      store: "Intertoys",
      products: [],
      error: `Search failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function scrapeIntertoysProduct(
  productUrl: string
): Promise<ScrapeResult> {
  try {
    const res = await fetch(productUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return {
        store: "Intertoys",
        products: [],
        error: `Product page returned HTTP ${res.status}`,
      };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const name = $("h1").first().text().trim();
    const price =
      $(".product-detail__price, .price").first().text().trim() || null;
    const bodyText = $("body").text();
    const { available, status } = parseAvailability(bodyText);

    if (name) {
      return {
        store: "Intertoys",
        products: [
          {
            name,
            price,
            url: productUrl,
            available,
            store: "Intertoys",
            status,
          },
        ],
      };
    }

    return {
      store: "Intertoys",
      products: [],
      error: "Could not parse product page",
    };
  } catch (err) {
    return {
      store: "Intertoys",
      products: [],
      error: `Product fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
