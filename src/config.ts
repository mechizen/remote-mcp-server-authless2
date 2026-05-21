/**
 * Daily News Digest Configuration
 * ユーザー設定とニュースソース定義
 */

export const DIGEST_CONFIG = {
  recipientEmail: "masayuki.echizen@gmail.com",
  recipientName: "越前 昌之",
  senderName: "Claude Daily News Digest",
  language: "ja" as const,
  timezone: "Asia/Tokyo",
  // UTC 00:00 = JST 09:00
  cronSchedule: "0 0 * * *",
};

export interface FeedSource {
  url: string;
  category: string;
  categoryLabel: string;
  categoryEmoji: string;
  maxItems: number;
}

export const FEED_SOURCES: FeedSource[] = [
  // IT・テクノロジー
  {
    url: "https://techcrunch.com/feed/",
    category: "tech",
    categoryLabel: "IT・テクノロジー",
    categoryEmoji: "💻",
    maxItems: 3,
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    category: "tech",
    categoryLabel: "IT・テクノロジー",
    categoryEmoji: "💻",
    maxItems: 2,
  },
  {
    url: "https://feeds.arstechnica.com/arstechnica/index",
    category: "tech",
    categoryLabel: "IT・テクノロジー",
    categoryEmoji: "💻",
    maxItems: 2,
  },

  // AI・AIエージェント
  {
    url: "https://venturebeat.com/category/ai/feed/",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    maxItems: 4,
  },
  {
    url: "https://www.marktechpost.com/feed/",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    maxItems: 2,
  },

  // サイバーセキュリティ・CDN・WAF・ゼロトラスト
  {
    url: "https://krebsonsecurity.com/feed/",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    maxItems: 2,
  },
  {
    url: "https://feeds.feedburner.com/TheHackersNews",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    maxItems: 3,
  },
  {
    url: "https://www.darkreading.com/rss/all.xml",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    maxItems: 2,
  },

  // インターネット産業・SaaS
  {
    url: "https://techcrunch.com/category/enterprise/feed/",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    maxItems: 3,
  },
  {
    url: "https://www.zdnet.com/topic/cloud/rss.xml",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    maxItems: 2,
  },

  // スポーツ
  {
    url: "https://feeds.bbci.co.uk/sport/rss.xml",
    category: "sports",
    categoryLabel: "スポーツ",
    categoryEmoji: "⚽",
    maxItems: 3,
  },
  {
    url: "https://www.espn.com/espn/rss/news",
    category: "sports",
    categoryLabel: "スポーツ",
    categoryEmoji: "⚽",
    maxItems: 2,
  },

  // 株式・経済・マネー
  {
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    maxItems: 3,
  },
  {
    url: "https://www.investing.com/rss/news_25.rss",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    maxItems: 2,
  },

  // 旅行・観光
  {
    url: "https://www.lonelyplanet.com/blog/feed",
    category: "travel",
    categoryLabel: "旅行・観光",
    categoryEmoji: "✈️",
    maxItems: 2,
  },
  {
    url: "https://www.travelandleisure.com/rss",
    category: "travel",
    categoryLabel: "旅行・観光",
    categoryEmoji: "✈️",
    maxItems: 2,
  },

  // 芸術・文化
  {
    url: "https://hyperallergic.com/feed/",
    category: "arts",
    categoryLabel: "芸術・文化",
    categoryEmoji: "🎨",
    maxItems: 2,
  },

  // 英語学習
  {
    url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english.rss",
    category: "english",
    categoryLabel: "英語学習",
    categoryEmoji: "📚",
    maxItems: 2,
  },
  {
    url: "https://feeds.bbci.co.uk/learningenglish/rss.xml",
    category: "english",
    categoryLabel: "英語学習",
    categoryEmoji: "📚",
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
