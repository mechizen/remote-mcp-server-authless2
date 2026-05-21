/**
 * News Fetcher
 * RSSフィードからニュースを取得するモジュール
 */

import { FEED_SOURCES, CATEGORY_ORDER, type FeedSource } from "./config";

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
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

/**
 * XMLタグの内容を抽出（CDATA対応）
 */
function extractTag(xml: string, tag: string): string {
  // CDATA形式を優先して試みる
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i",
  );
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  // 通常のXMLタグ
  const normalRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const normalMatch = normalRegex.exec(xml);
  if (normalMatch) return normalMatch[1].trim();

  return "";
}

/**
 * HTMLタグとエンティティを除去してプレーンテキスト化
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * URLからドメイン名（ソース名）を抽出
 */
function extractSourceName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "").replace(/\.(com|org|net|io|co\.jp)$/, "");
  } catch {
    return url;
  }
}

/**
 * RSSフィードをフェッチしてパース
 */
async function fetchFeed(source: FeedSource): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DailyNewsDigest/1.0; +https://github.com/mechizen/remote-mcp-server-authless2)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Feed fetch failed: ${source.url} (${response.status})`);
      return [];
    }

    const xml = await response.text();
    const sourceName = extractSourceName(source.url);
    const items: NewsItem[] = [];

    // <item> または <entry> タグを抽出（RSS 2.0 と Atom 対応）
    const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < source.maxItems) {
      const itemXml = match[1];

      const title = cleanText(extractTag(itemXml, "title"));
      // Atom の <link href="..."/> に対応
      let link = extractTag(itemXml, "link");
      if (!link) {
        const hrefMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
        if (hrefMatch) link = hrefMatch[1];
      }
      const description = cleanText(
        extractTag(itemXml, "description") ||
          extractTag(itemXml, "summary") ||
          extractTag(itemXml, "content"),
      );
      const pubDate =
        extractTag(itemXml, "pubDate") ||
        extractTag(itemXml, "published") ||
        extractTag(itemXml, "updated") ||
        "";

      if (title && link) {
        // 説明文は最大200文字に制限
        const shortDesc = description.length > 200 ? description.slice(0, 200) + "..." : description;

        items.push({
          title,
          link,
          description: shortDesc,
          pubDate,
          category: source.category,
          categoryLabel: source.categoryLabel,
          categoryEmoji: source.categoryEmoji,
          source: sourceName,
        });
        count++;
      }
    }

    return items;
  } catch (error) {
    console.warn(
      `Error fetching feed ${source.url}:`,
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

/**
 * 全フィードからニュースを取得してカテゴリ別に整理
 */
export async function fetchAllNews(): Promise<NewsByCategory[]> {
  // 並列でフィードを取得
  const results = await Promise.allSettled(FEED_SOURCES.map((source) => fetchFeed(source)));

  // カテゴリ別にまとめる
  const categoryMap = new Map<string, NewsByCategory>();

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      const source = FEED_SOURCES[index];
      const key = source.category;

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category: key,
          categoryLabel: source.categoryLabel,
          categoryEmoji: source.categoryEmoji,
          items: [],
        });
      }

      const existing = categoryMap.get(key)!;
      // 重複タイトルを除外して追加
      for (const item of result.value) {
        const isDuplicate = existing.items.some(
          (i) => i.title.toLowerCase() === item.title.toLowerCase(),
        );
        if (!isDuplicate) {
          existing.items.push(item);
        }
      }
    }
  });

  // カテゴリ順にソートして返す
  const sorted: NewsByCategory[] = [];
  for (const cat of CATEGORY_ORDER) {
    if (categoryMap.has(cat)) {
      sorted.push(categoryMap.get(cat)!);
    }
  }

  // CATEGORY_ORDER に含まれないカテゴリも追加
  for (const [key, value] of categoryMap.entries()) {
    if (!CATEGORY_ORDER.includes(key)) {
      sorted.push(value);
    }
  }

  return sorted;
}

/**
 * ニュースデータをAI要約用のプレーンテキストに変換
 */
export function formatNewsForAI(newsByCategory: NewsByCategory[]): string {
  const lines: string[] = [];

  for (const category of newsByCategory) {
    if (category.items.length === 0) continue;

    lines.push(`\n## ${category.categoryEmoji} ${category.categoryLabel}`);
    for (let i = 0; i < category.items.length; i++) {
      const item = category.items[i];
      lines.push(`\n${i + 1}. **${item.title}**`);
      lines.push(`   出典: ${item.source}`);
      if (item.description) {
        lines.push(`   概要: ${item.description}`);
      }
      lines.push(`   URL: ${item.link}`);
    }
  }

  return lines.join("\n");
}
