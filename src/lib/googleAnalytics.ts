import { BetaAnalyticsDataClient } from "@google-analytics/data";

const CACHE_TTL_MS = 10 * 60 * 1000;

export type AnalyticsTotals = {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
};

export type AnalyticsDailyRow = {
  date: string;
  activeUsers: number;
  screenPageViews: number;
};

export type AnalyticsPageRow = {
  path: string;
  views: number;
  users: number;
  postId: string | null;
};

export type AnalyticsReport = {
  range: { days: number };
  cachedAt: string;
  totals: AnalyticsTotals;
  daily: AnalyticsDailyRow[];
  topPages: AnalyticsPageRow[];
  topPosts: AnalyticsPageRow[];
};

type CacheEntry = {
  expiresAt: number;
  data: AnalyticsReport;
};

const cache = new Map<string, CacheEntry>();

let client: BetaAnalyticsDataClient | null = null;

export const parseAnalyticsDays = (value: string | null | undefined): number => {
  const parsed = Number(value ?? "30");
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(90, Math.max(1, Math.round(parsed)));
};

const getPropertyId = (): string => {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!propertyId) {
    throw new Error("GA4_PROPERTY_ID is not configured.");
  }
  return propertyId;
};

const getAnalyticsClient = (): BetaAnalyticsDataClient => {
  if (client) return client;

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (credentialsJson) {
    const parsed = JSON.parse(credentialsJson) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is invalid.");
    }
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, "\n"),
      },
    });
    return client;
  }

  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Google Analytics credentials are not configured.");
  }

  client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
  return client;
};

const toNumber = (value: string | null | undefined): number => {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

export const extractPostIdFromPath = (path: string): string | null => {
  const match = path.match(/^\/post\/([^/?#]+)/);
  return match?.[1] ?? null;
};

const formatGaDate = (raw: string): string => {
  if (raw.length !== 8) return raw;
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return `${day}/${month}/${year}`;
};

export const fetchAnalyticsReport = async (days: number): Promise<AnalyticsReport> => {
  const cacheKey = `analytics:${days}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const propertyId = getPropertyId();
  const analyticsClient = getAnalyticsClient();
  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" as const }];

  const [totalsResponse, dailyResponse, pagesResponse] = await Promise.all([
    analyticsClient.runReport({
      property,
      dateRanges,
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    }),
    analyticsClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    analyticsClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 100,
    }),
  ]);

  const totalsRow = totalsResponse[0]?.rows?.[0]?.metricValues ?? [];
  const totals: AnalyticsTotals = {
    activeUsers: toNumber(totalsRow[0]?.value),
    sessions: toNumber(totalsRow[1]?.value),
    screenPageViews: toNumber(totalsRow[2]?.value),
  };

  const daily: AnalyticsDailyRow[] =
    dailyResponse[0]?.rows?.map((row) => ({
      date: formatGaDate(row.dimensionValues?.[0]?.value ?? ""),
      activeUsers: toNumber(row.metricValues?.[0]?.value),
      screenPageViews: toNumber(row.metricValues?.[1]?.value),
    })) ?? [];

  const topPages: AnalyticsPageRow[] =
    pagesResponse[0]?.rows?.map((row) => {
      const path = row.dimensionValues?.[0]?.value ?? "";
      return {
        path,
        views: toNumber(row.metricValues?.[0]?.value),
        users: toNumber(row.metricValues?.[1]?.value),
        postId: extractPostIdFromPath(path),
      };
    }) ?? [];

  const topPosts = topPages.filter((page) => page.postId).slice(0, 50);

  const report: AnalyticsReport = {
    range: { days },
    cachedAt: new Date().toISOString(),
    totals,
    daily,
    topPages: topPages.slice(0, 20),
    topPosts,
  };

  cache.set(cacheKey, {
    data: report,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return report;
};
