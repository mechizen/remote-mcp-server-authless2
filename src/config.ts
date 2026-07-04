/**
 * Daily News Digest Configuration
 * ユーザー設定とニュースソース定義
 */

export const DIGEST_CONFIG = {
  senderName: "Claude Daily News Digest",
  language: "ja" as const,
  timezone: "Asia/Tokyo",
  cronSchedule: "0 0 * * *",
};

export type SourceType = "hackernews" | "reddit" | "rss";

export interface NewsSource {
  type: SourceType;
  category: string;
  categoryLabel: string;
  categoryEmoji: string;
  maxItems: number;
  // RSS
  url?: string;
  // Reddit
  subreddit?: string;
  timeFilter?: "day" | "week";
  // HN: キーワードフィルタ（省略時は上位記事をそのまま使用）
  keywords?: string[];
}

export const NEWS_SOURCES: NewsSource[] = [
  // IT・テクノロジー（Hacker News トップ）
  {
    type: "hackernews",
    category: "tech",
    categoryLabel: "IT・テクノロジー",
    categoryEmoji: "💻",
    maxItems: 5,
  },

  // AI・AIエージェント（HN フィルタ + Reddit）
  {
    type: "hackernews",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    maxItems: 4,
    keywords: ["AI", "LLM", "GPT", "Claude", "Gemini", "agent", "machine learning", "neural", "model", "OpenAI", "Anthropic", "artificial intelligence", "deep learning"],
  },
  {
    type: "reddit",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    subreddit: "MachineLearning",
    maxItems: 2,
    timeFilter: "day",
  },

  // サイバーセキュリティ（RSS は比較的通りやすいソース）
  {
    type: "rss",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    url: "https://feeds.feedburner.com/TheHackersNews",
    maxItems: 3,
  },
  {
    type: "rss",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    url: "https://krebsonsecurity.com/feed/",
    maxItems: 2,
  },

  // SaaS・インターネット産業（Reddit）
  {
    type: "reddit",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    subreddit: "SaaS",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    subreddit: "startups",
    maxItems: 2,
    timeFilter: "day",
  },

  // 株式・経済・マネー（Reddit）
  {
    type: "reddit",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    subreddit: "investing",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    subreddit: "stocks",
    maxItems: 2,
    timeFilter: "day",
  },

  // スポーツ（BBC RSS + Reddit）
  {
    type: "rss",
    category: "sports",
    categoryLabel: "スポーツ",
    categoryEmoji: "⚽",
    url: "https://feeds.bbci.co.uk/sport/rss.xml",
    maxItems: 3,
  },
  {
    type: "reddit",
    category: "sports",
    categoryLabel: "スポーツ",
    categoryEmoji: "⚽",
    subreddit: "sports",
    maxItems: 2,
    timeFilter: "day",
  },

  // 旅行・観光（Reddit）
  {
    type: "reddit",
    category: "travel",
    categoryLabel: "旅行・観光",
    categoryEmoji: "✈️",
    subreddit: "travel",
    maxItems: 3,
    timeFilter: "day",
  },

  // 芸術・文化（Reddit）
  {
    type: "reddit",
    category: "arts",
    categoryLabel: "芸術・文化",
    categoryEmoji: "🎨",
    subreddit: "Art",
    maxItems: 3,
    timeFilter: "day",
  },

  // 英語学習（BBC RSS）
  {
    type: "rss",
    category: "english",
    categoryLabel: "英語学習",
    categoryEmoji: "📚",
    url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english.rss",
    maxItems: 2,
  },
];

// カテゴリ表示順
export const CATEGORY_ORDER = [
  "tech",
  "ai",
  "security",
  "saas",
  "finance",
  "sports",
  "travel",
  "arts",
  "english",
];
