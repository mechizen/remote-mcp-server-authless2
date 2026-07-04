/**
 * News Fetcher
 * Hacker News API / Reddit JSON / RSS からニュースを取得
 */

import { NEWS_SOURCES, CATEGORY_ORDER, type NewsSource } from "./config";

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryEmoji: string;
  source: string;
}

export interface NewsByCategory {
  category: string;
  categoryLabel: string;
  categoryEmoji: string;
  items: NewsItem[];
}

const FETCH_TIMEOUT_MS = 10000;
const USER_AGENT =
  "DailyNewsDigest/1.0 (Cloudflare Worker; https://github.com/mechizen/daily-news-digest)";

async function safeFetch(url: string, headers?: Record<string, string>): Promise<string | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, ...headers },
    });
    clearTimeout(id);
    if (!res.ok) {
      console.warn(`[Fetch] ${res.status} ${url}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    console.warn(`[Fetch] Error ${url}: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// ============================================================
// Hacker News API
// ============================================================
interface HNItem {
  id: number;
  title?: string;
  url?: string;
  score?: number;
  by?: string;
  descendants?: number;
}

async function fetchHackerNews(source: NewsSource): Promise<NewsItem[]> {
  const idsText = await safeFetch("https://hacker-news.firebaseio.com/v0/topstories.json");
  if (!idsText) return [];

  const allIds: number[] = JSON.parse(idsText);
  // キーワードフィルタがある場合は多めに取得してフィルタリング
  const fetchCount = source.keywords ? 60 : source.maxItems * 2;
  const ids = allIds.slice(0, fetchCount);

  const items = await Promise.all(
    ids.map((id) =>
      safeFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((text) =>
        text ? (JSON.parse(text) as HNItem) : null,
      ),
    ),
  );

  let valid = items.filter((i): i is HNItem => !!i && !!i.title && !!i.url);

  // キーワードフィルタ
  if (source.keywords && source.keywords.length > 0) {
    const kws = source.keywords.map((k) => k.toLowerCase());
    valid = valid.filter((i) => kws.some((kw) => i.title!.toLowerCase().includes(kw)));
  }

  return valid.slice(0, source.maxItems).map((i) => ({
    title: i.title!,
    link: i.url!,
    description: `スコア: ${i.score ?? 0} | コメント: ${i.descendants ?? 0}`,
    category: source.category,
    categoryLabel: source.categoryLabel,
    categoryEmoji: source.categoryEmoji,
    source: "Hacker News",
  }));
}

// ============================================================
// Reddit JSON API
// ============================================================
interface RedditPost {
  data: {
    title: string;
    url: string;
    selftext: string;
    score: number;
    permalink: string;
    is_self: boolean;
  };
}

interface RedditResponse {
  data: { children: RedditPost[] };
}

async function fetchReddit(source: NewsSource): Promise<NewsItem[]> {
  if (!source.subreddit) return [];

  const tf = source.timeFilter ?? "day";
  const url = `https://www.reddit.com/r/${source.subreddit}/top.json?limit=25&t=${tf}`;
  const text = await safeFetch(url, {
    Accept: "application/json",
  });
  if (!text) return [];

  let parsed: RedditResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }

  const posts = parsed?.data?.children ?? [];

  return posts
    .filter((p) => p.data.title && p.data.url)
    .slice(0, source.maxItems)
    .map((p) => {
      const d = p.data;
      const link = d.is_self
        ? `https://www.reddit.com${d.permalink}`
        : d.url;
      const desc = d.selftext
        ? d.selftext.slice(0, 150) + (d.selftext.length > 150 ? "..." : "")
        : `スコア: ${d.score}`;
      return {
        title: d.title,
        link,
        description: desc,
        category: source.category,
        categoryLabel: source.categoryLabel,
        categoryEmoji: source.categoryEmoji,
        source: `r/${source.subreddit}`,
      };
    });
}

// ============================================================
// RSS フィード
// ============================================================
function extractXmlTag(xml: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i").exec(xml);
  if (cdata) return cdata[1].trim();
  const normal = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml);
  if (normal) return normal[1].trim();
  return "";
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

async function fetchRSS(source: NewsSource): Promise<NewsItem[]> {
  if (!source.url) return [];
  const text = await safeFetch(source.url, {
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  });
  if (!text) return [];

  const items: NewsItem[] = [];
  const itemRe = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(text)) !== null && items.length < source.maxItems) {
    const block = m[1];
    const title = cleanHtml(extractXmlTag(block, "title"));
    let link = extractXmlTag(block, "link");
    if (!link) {
      const href = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      if (href) link = href[1];
    }
    if (!title || !link) continue;

    const rawDesc =
      extractXmlTag(block, "description") ||
      extractXmlTag(block, "summary") ||
      extractXmlTag(block, "content");
    const desc = cleanHtml(rawDesc).slice(0, 180);

    items.push({
      title,
      link,
      description: desc,
      category: source.category,
      categoryLabel: source.categoryLabel,
      categoryEmoji: source.categoryEmoji,
      source: domainOf(source.url),
    });
  }
  return items;
}

// ============================================================
// 統合フェッチ
// ============================================================
async function fetchSource(source: NewsSource): Promise<NewsItem[]> {
  switch (source.type) {
    case "hackernews": return fetchHackerNews(source);
    case "reddit":     return fetchReddit(source);
    case "rss":        return fetchRSS(source);
  }
}

export async function fetchAllNews(): Promise<NewsByCategory[]> {
  const results = await Promise.allSettled(NEWS_SOURCES.map(fetchSource));

  const categoryMap = new Map<string, NewsByCategory>();

  results.forEach((result, i) => {
    if (result.status !== "fulfilled" || result.value.length === 0) return;
    const src = NEWS_SOURCES[i];
    const key = src.category;

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: key,
        categoryLabel: src.categoryLabel,
        categoryEmoji: src.categoryEmoji,
        items: [],
      });
    }

    const cat = categoryMap.get(key)!;
    for (const item of result.value) {
      const dup = cat.items.some(
        (x) => x.title.toLowerCase() === item.title.toLowerCase(),
      );
      if (!dup) cat.items.push(item);
    }
  });

  const sorted: NewsByCategory[] = [];
  for (const key of CATEGORY_ORDER) {
    if (categoryMap.has(key)) sorted.push(categoryMap.get(key)!);
  }
  for (const [key, val] of categoryMap) {
    if (!CATEGORY_ORDER.includes(key)) sorted.push(val);
  }

  return sorted;
}

export function formatNewsForAI(newsByCategory: NewsByCategory[]): string {
  const lines: string[] = [];
  for (const cat of newsByCategory) {
    if (!cat.items.length) continue;
    lines.push(`\n## ${cat.categoryEmoji} ${cat.categoryLabel}`);
    cat.items.forEach((item, i) => {
      lines.push(`\n${i + 1}. **${item.title}**`);
      lines.push(`   出典: ${item.source}`);
      if (item.description) lines.push(`   概要: ${item.description}`);
      lines.push(`   URL: ${item.link}`);
    });
  }
  return lines.join("\n");
}
