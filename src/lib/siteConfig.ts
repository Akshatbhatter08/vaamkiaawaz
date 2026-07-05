import fs from "fs/promises";
import path from "path";

export type SiteConfig = {
  featuredVicharPostIds: string[];
};

const DEFAULT_CONFIG: SiteConfig = {
  featuredVicharPostIds: [],
};

function getConfigPath(): string {
  return path.join(process.cwd(), "data", "site-config.json");
}

export async function readSiteConfig(): Promise<SiteConfig> {
  try {
    const raw = await fs.readFile(getConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    return {
      featuredVicharPostIds: Array.isArray(parsed.featuredVicharPostIds)
        ? parsed.featuredVicharPostIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeSiteConfig(config: SiteConfig): Promise<void> {
  const configPath = getConfigPath();
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}
