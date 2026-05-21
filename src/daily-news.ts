/**
 * Daily News Digest Pipeline
 * ニュース取得 → AI要約 → メール送信 のパイプライン
 */

import { fetchAllNews } from "./news-fetcher";
import { generateDigest } from "./digest-generator";
import { sendEmailViaResend } from "./email-sender";
import { DIGEST_CONFIG } from "./config";

export interface DigestEnv {
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  SENDER_EMAIL: string;
  RECIPIENT_EMAIL: string;
  RECIPIENT_NAME?: string;
}

export interface RunResult {
  success: boolean;
  date?: string;
  articleCount?: number;
  messageId?: string;
  categoriesFound?: string[];
  error?: string;
  details?: string;
}

/**
 * ニュースダイジェストパイプラインを実行
 */
export async function runDailyNewsDigest(env: DigestEnv): Promise<RunResult> {
  const startTime = Date.now();
  console.log("[DailyNews] Starting daily news digest pipeline...");

  // 1. ニュース取得
  console.log("[DailyNews] Fetching news from RSS feeds...");
  const newsByCategory = await fetchAllNews();

  const categoriesFound = newsByCategory
    .filter((c) => c.items.length > 0)
    .map((c) => `${c.categoryEmoji} ${c.categoryLabel}(${c.items.length}件)`);

  console.log(`[DailyNews] Fetched ${categoriesFound.length} categories: ${categoriesFound.join(", ")}`);

  if (newsByCategory.length === 0 || categoriesFound.length === 0) {
    return {
      success: false,
      error: "No news articles could be fetched from RSS feeds.",
      categoriesFound: [],
    };
  }

  // 2. AI要約・ダイジェスト生成
  console.log("[DailyNews] Generating Japanese digest with Claude AI...");
  let digest;
  try {
    digest = await generateDigest(newsByCategory, env.ANTHROPIC_API_KEY);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[DailyNews] Digest generation failed:", errorMsg);
    return {
      success: false,
      error: `Digest generation failed: ${errorMsg}`,
      categoriesFound,
    };
  }

  console.log(`[DailyNews] Digest generated: ${digest.articleCount} articles, subject: ${digest.subject}`);

  // 3. メール送信
  console.log(`[DailyNews] Sending email to ${env.RECIPIENT_EMAIL}...`);
  const sendResult = await sendEmailViaResend(
    {
      to: env.RECIPIENT_EMAIL,
      toName: env.RECIPIENT_NAME,
      from: env.SENDER_EMAIL,
      fromName: DIGEST_CONFIG.senderName,
      subject: digest.subject,
      html: digest.htmlBody,
      text: digest.plainText,
    },
    env.RESEND_API_KEY,
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[DailyNews] Pipeline completed in ${elapsed}s. Success: ${sendResult.success}`);

  if (!sendResult.success) {
    return {
      success: false,
      date: digest.date,
      articleCount: digest.articleCount,
      categoriesFound,
      error: `Email send failed: ${sendResult.error}`,
    };
  }

  return {
    success: true,
    date: digest.date,
    articleCount: digest.articleCount,
    messageId: sendResult.messageId,
    categoriesFound,
    details: `${elapsed}秒で完了`,
  };
}
