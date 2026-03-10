export interface Product {
  name: string;
  price: string | null;
  url: string;
  available: boolean;
  store: string;
  status: string;
}

export interface ScrapeResult {
  store: string;
  products: Product[];
  error?: string;
}

export interface StoreConfig {
  name: string;
  enabled: boolean;
  urls: string[];
}

export interface Config {
  discordWebhookUrl: string;
  pollIntervalSeconds: number;
  stores: StoreConfig[];
  searchTerms: string[];
}
