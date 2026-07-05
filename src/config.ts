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
  // ============================================================
  // 💻 IT・テクノロジー
  // ============================================================
  {
    type: "hackernews",
    category: "tech",
    categoryLabel: "IT・テクノロジー",
    categoryEmoji: "💻",
    maxItems: 8,
  },
  {
    type: "reddit",
    category: "tech",
    categoryLabel: "IT・テクノロジー",
    categoryEmoji: "💻",
    subreddit: "technology",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "tech",
    categoryLabel: "IT・テクノロジー",
    categoryEmoji: "💻",
    subreddit: "programming",
    maxItems: 3,
    timeFilter: "day",
  },

  // ============================================================
  // 🤖 AI・AIエージェント
  // ============================================================
  {
    type: "hackernews",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    maxItems: 6,
    keywords: [
      "AI", "LLM", "GPT", "Claude", "Gemini", "agent", "machine learning",
      "neural", "model", "OpenAI", "Anthropic", "artificial intelligence",
      "deep learning", "RAG", "fine-tuning", "transformer", "diffusion",
    ],
  },
  {
    type: "reddit",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    subreddit: "MachineLearning",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    subreddit: "artificial",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "ai",
    categoryLabel: "AI・AIエージェント",
    categoryEmoji: "🤖",
    subreddit: "LocalLLaMA",
    maxItems: 3,
    timeFilter: "day",
  },

  // ============================================================
  // 🔒 サイバーセキュリティ・CDN・WAF・ゼロトラスト
  // ============================================================
  {
    type: "rss",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    url: "https://feeds.feedburner.com/TheHackersNews",
    maxItems: 4,
  },
  {
    type: "rss",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    url: "https://krebsonsecurity.com/feed/",
    maxItems: 3,
  },
  {
    type: "reddit",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    subreddit: "cybersecurity",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "security",
    categoryLabel: "サイバーセキュリティ・ゼロトラスト",
    categoryEmoji: "🔒",
    subreddit: "netsec",
    maxItems: 3,
    timeFilter: "day",
  },

  // ============================================================
  // 🌐 SaaS・インターネット産業
  // ============================================================
  {
    type: "reddit",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    subreddit: "SaaS",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    subreddit: "startups",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    subreddit: "Entrepreneur",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "hackernews",
    category: "saas",
    categoryLabel: "SaaS・インターネット産業",
    categoryEmoji: "🌐",
    maxItems: 3,
    keywords: ["SaaS", "startup", "product", "launch", "B2B", "API", "platform"],
  },

  // ============================================================
  // 📈 株式・経済・マネー
  // ============================================================
  {
    type: "reddit",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    subreddit: "investing",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    subreddit: "stocks",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    subreddit: "economics",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "finance",
    categoryLabel: "株式・経済・マネー",
    categoryEmoji: "📈",
    subreddit: "wallstreetbets",
    maxItems: 2,
    timeFilter: "day",
  },

  // ============================================================
  // ⚽ スポーツ
  // ============================================================
  {
    type: "rss",
    category: "sports",
    categoryLabel: "スポーツ",
    categoryEmoji: "⚽",
    url: "https://feeds.bbci.co.uk/sport/rss.xml",
    maxItems: 4,
  },
  {
    type: "reddit",
    category: "sports",
    categoryLabel: "スポーツ",
    categoryEmoji: "⚽",
    subreddit: "sports",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "sports",
    categoryLabel: "スポーツ",
    categoryEmoji: "⚽",
    subreddit: "soccer",
    maxItems: 3,
    timeFilter: "day",
  },

  // ============================================================
  // ✈️ 旅行・観光
  // ============================================================
  {
    type: "reddit",
    category: "travel",
    categoryLabel: "旅行・観光",
    categoryEmoji: "✈️",
    subreddit: "travel",
    maxItems: 4,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "travel",
    categoryLabel: "旅行・観光",
    categoryEmoji: "✈️",
    subreddit: "solotravel",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "travel",
    categoryLabel: "旅行・観光",
    categoryEmoji: "✈️",
    subreddit: "JapanTravel",
    maxItems: 2,
    timeFilter: "week",
  },

  // ============================================================
  // 🎨 芸術・文化
  // ============================================================
  {
    type: "reddit",
    category: "arts",
    categoryLabel: "芸術・文化",
    categoryEmoji: "🎨",
    subreddit: "Art",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "arts",
    categoryLabel: "芸術・文化",
    categoryEmoji: "🎨",
    subreddit: "design",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "arts",
    categoryLabel: "芸術・文化",
    categoryEmoji: "🎨",
    subreddit: "movies",
    maxItems: 2,
    timeFilter: "day",
  },

  // ============================================================
  // 📚 英語学習
  // ============================================================
  {
    type: "rss",
    category: "english",
    categoryLabel: "英語学習",
    categoryEmoji: "📚",
    url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english.rss",
    maxItems: 3,
  },
  {
    type: "reddit",
    category: "english",
    categoryLabel: "英語学習",
    categoryEmoji: "📚",
    subreddit: "EnglishLearning",
    maxItems: 3,
    timeFilter: "day",
  },
  {
    type: "reddit",
    category: "english",
    categoryLabel: "英語学習",
    categoryEmoji: "📚",
    subreddit: "languagelearning",
    maxItems: 2,
    timeFilter: "day",
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
