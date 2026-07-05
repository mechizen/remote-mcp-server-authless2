/**
 * Digest Generator
 * Claude APIを使って日本語ニュースダイジェストを生成
 */

import type { NewsByCategory } from "./news-fetcher";
import { formatNewsForAI } from "./news-fetcher";

export interface DigestResult {
  subject: string;
  htmlBody: string;
  plainText: string;
  date: string;
  articleCount: number;
}

/**
 * 日本語の日付文字列を生成（JST）
 */
function getJapaneseDate(): { dateStr: string; dayOfWeek: string; isoDate: string } {
  const now = new Date();
  // JST = UTC + 9
  const jstOffset = 9 * 60 * 60 * 1000;
  const jst = new Date(now.getTime() + jstOffset);

  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth() + 1;
  const day = jst.getUTCDate();

  const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
  const dayOfWeek = daysOfWeek[jst.getUTCDay()];

  const dateStr = `${year}年${month}月${day}日`;
  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { dateStr, dayOfWeek, isoDate };
}

/**
 * Claude APIを呼び出してニュースを日本語で要約
 */
async function generateJapaneseSummary(
  rawNews: string,
  apiKey: string,
): Promise<string> {
  const systemPrompt = `あなたは優秀な日本語ニュースキュレーターです。
英語のニュース記事を日本語で簡潔にまとめ、読者にとって価値のある情報を提供します。

各ニュース項目について：
- タイトルを自然な日本語に翻訳してください
- 内容を2〜3文の日本語で要約してください
- 重要なキーワード（製品名、企業名、技術名）は英語のままで構いません
- 読みやすく、興味を引く文章にしてください`;

  const userPrompt = `以下の英語ニュースを日本語でダイジェスト化してください。
カテゴリ別の構成を維持し、各記事について「日本語タイトル」「要約（2〜3文）」「元URL」の形式で出力してください。

${rawNews}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  return data.content[0]?.text || "";
}

/**
 * マークダウンをシンプルなHTMLに変換
 */
function markdownToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2 class="cat-title">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/(https?:\/\/[^\s\)]+)/g, '<a href="$1" style="color:#2563eb;">$1</a>')
    .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|l|p])(.+)$/gm, "<p>$1</p>");
}

/**
 * HTMLメールテンプレートを生成
 */
function buildEmailHtml(
  digestContent: string,
  date: string,
  dayOfWeek: string,
  articleCount: number,
): string {
  const contentHtml = markdownToHtml(digestContent);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>デイリーニュースダイジェスト - ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Meiryo', sans-serif;
      background: #f0f4f8;
      color: #1a202c;
      line-height: 1.7;
      font-size: 15px;
    }
    .wrapper { max-width: 680px; margin: 0 auto; padding: 20px 16px; }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      border-radius: 12px 12px 0 0;
      padding: 28px 32px;
      color: white;
    }
    .header-logo {
      font-size: 13px;
      opacity: 0.8;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .header-date {
      font-size: 14px;
      opacity: 0.85;
    }
    .header-stats {
      margin-top: 16px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .stat {
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 500;
    }
    .content {
      background: white;
      padding: 28px 32px;
    }
    .intro {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 28px;
      font-size: 14px;
      color: #374151;
    }
    h2.cat-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a5f;
      padding: 10px 16px;
      background: #eff6ff;
      border-radius: 8px;
      margin: 28px 0 14px;
      border-left: 4px solid #2563eb;
    }
    p { margin-bottom: 10px; line-height: 1.75; }
    li { margin-bottom: 6px; margin-left: 20px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    strong { color: #1e3a5f; }
    .footer {
      background: #f7fafc;
      border-radius: 0 0 12px 12px;
      padding: 20px 32px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #718096;
      text-align: center;
    }
    .footer-links { margin-top: 8px; }
    .footer-links a { color: #4a5568; margin: 0 8px; }
    @media (max-width: 480px) {
      .header, .content, .footer { padding: 20px 18px; }
      .header h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">🤖 Claude Daily News Digest</div>
      <h1>📰 デイリーニュースダイジェスト</h1>
      <div class="header-date">${date}（${dayOfWeek}曜日）</div>
      <div class="header-stats">
        <span class="stat">📊 ${articleCount}件のニュース</span>
        <span class="stat">🌏 グローバルソース</span>
        <span class="stat">🤖 AI要約済み</span>
      </div>
    </div>

    <div class="content">
      <div class="intro">
        おはようございます！本日のニュースダイジェストをお届けします。
        IT・AI・セキュリティ・経済・スポーツなど、あなたの興味分野の最新情報を厳選しました。
      </div>

      ${contentHtml}
    </div>

    <div class="footer">
      <p>このメールは <strong>Claude Daily News Digest</strong> により自動生成されました。</p>
      <p>配信: Cloudflare Workers + Claude AI | 毎朝 9:00 JST</p>
      <div class="footer-links">
        <a href="https://anthropic.com">Powered by Claude AI</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * メインのダイジェスト生成関数
 */
export async function generateDigest(
  newsByCategory: NewsByCategory[],
  anthropicApiKey: string,
): Promise<DigestResult> {
  const { dateStr, dayOfWeek, isoDate } = getJapaneseDate();

  const totalArticles = newsByCategory.reduce((sum, cat) => sum + cat.items.length, 0);

  if (totalArticles === 0) {
    throw new Error("No news articles fetched. All feeds may have failed.");
  }

  // ニュースをAI用テキストに変換
  const rawNewsText = formatNewsForAI(newsByCategory);

  // Claude APIで日本語ダイジェストを生成
  let digestContent: string;
  if (anthropicApiKey) {
    digestContent = await generateJapaneseSummary(rawNewsText, anthropicApiKey);
  } else {
    // APIキーがない場合はフォールバック（英語のまま）
    digestContent = rawNewsText;
  }

  const subject = `📰 デイリーニュースダイジェスト - ${dateStr}（${dayOfWeek}）| ${totalArticles}件`;
  const htmlBody = buildEmailHtml(digestContent, dateStr, dayOfWeek, totalArticles);

  return {
    subject,
    htmlBody,
    plainText: digestContent,
    date: isoDate,
    articleCount: totalArticles,
  };
}
