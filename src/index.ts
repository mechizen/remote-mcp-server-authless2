import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runDailyNewsDigest } from "./daily-news";

// =============================================
// MCP Agent with Daily News Digest Tools
// =============================================
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "Daily News Digest MCP",
    version: "2.0.0",
  });

  async init() {
    // ------------------------------------
    // 既存: Calculator tools
    // ------------------------------------
    this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
      content: [{ type: "text", text: String(a + b) }],
    }));

    this.server.tool(
      "calculate",
      {
        operation: z.enum(["add", "subtract", "multiply", "divide"]),
        a: z.number(),
        b: z.number(),
      },
      async ({ operation, a, b }) => {
        let result: number;
        switch (operation) {
          case "add":
            result = a + b;
            break;
          case "subtract":
            result = a - b;
            break;
          case "multiply":
            result = a * b;
            break;
          case "divide":
            if (b === 0)
              return {
                content: [{ type: "text", text: "Error: Cannot divide by zero" }],
              };
            result = a / b;
            break;
        }
        return { content: [{ type: "text", text: String(result) }] };
      },
    );

    // ------------------------------------
    // 新規: Daily News Digest tool
    // ------------------------------------
    /**
     * send_daily_news_digest
     * 日次ニュースダイジェストを生成してメール送信する。
     * Claude Routines や手動実行から呼び出せる。
     */
    this.server.tool(
      "send_daily_news_digest",
      {
        dry_run: z
          .boolean()
          .optional()
          .describe(
            "trueにするとメール送信をスキップしてダイジェスト内容だけを返す（テスト用）",
          ),
      },
      async ({ dry_run = false }) => {
        // @ts-ignore - McpAgent provides env access
        const env = this.env as {
          ANTHROPIC_API_KEY?: string;
          RESEND_API_KEY?: string;
          SENDER_EMAIL?: string;
          RECIPIENT_EMAIL?: string;
          RECIPIENT_NAME?: string;
        };

        if (!env.ANTHROPIC_API_KEY) {
          return {
            content: [
              {
                type: "text",
                text: "❌ エラー: ANTHROPIC_API_KEY が設定されていません。\n`wrangler secret put ANTHROPIC_API_KEY` で設定してください。",
              },
            ],
          };
        }

        if (!dry_run && !env.RESEND_API_KEY) {
          return {
            content: [
              {
                type: "text",
                text: "❌ エラー: RESEND_API_KEY が設定されていません。\n`wrangler secret put RESEND_API_KEY` で設定してください。",
              },
            ],
          };
        }

        if (!dry_run && !env.SENDER_EMAIL) {
          return {
            content: [
              {
                type: "text",
                text: "❌ エラー: SENDER_EMAIL が設定されていません。\n`wrangler secret put SENDER_EMAIL` で設定してください。",
              },
            ],
          };
        }

        if (!dry_run && !env.RECIPIENT_EMAIL) {
          return {
            content: [
              {
                type: "text",
                text: "❌ エラー: RECIPIENT_EMAIL が設定されていません。\n`wrangler secret put RECIPIENT_EMAIL` で設定してください。",
              },
            ],
          };
        }

        if (dry_run) {
          // ドライラン: ニュース取得と要約のみ（メール送信なし）
          const { fetchAllNews } = await import("./news-fetcher");
          const { generateDigest } = await import("./digest-generator");

          const newsByCategory = await fetchAllNews();
          const digest = await generateDigest(
            newsByCategory,
            env.ANTHROPIC_API_KEY!,
          );

          const categorySummary = newsByCategory
            .filter((c) => c.items.length > 0)
            .map((c) => `  ${c.categoryEmoji} ${c.categoryLabel}: ${c.items.length}件`)
            .join("\n");

          return {
            content: [
              {
                type: "text",
                text: `✅ ドライラン完了（メール未送信）\n\n📅 日付: ${digest.date}\n📊 取得記事数: ${digest.articleCount}件\n\n📰 カテゴリ別件数:\n${categorySummary}\n\n📧 件名: ${digest.subject}\n\n---\n📄 ダイジェスト内容（先頭2000文字）:\n\n${digest.plainText.slice(0, 2000)}${digest.plainText.length > 2000 ? "\n...(省略)" : ""}`,
              },
            ],
          };
        }

        // 本番実行
        const result = await runDailyNewsDigest({
          ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY!,
          RESEND_API_KEY: env.RESEND_API_KEY!,
          SENDER_EMAIL: env.SENDER_EMAIL!,
          RECIPIENT_EMAIL: env.RECIPIENT_EMAIL!,
          RECIPIENT_NAME: env.RECIPIENT_NAME,
        });

        if (result.success) {
          const categoriesStr = result.categoriesFound?.join(", ") || "なし";
          return {
            content: [
              {
                type: "text",
                text: `✅ ニュースダイジェスト送信完了！\n\n📅 日付: ${result.date}\n📊 記事数: ${result.articleCount}件\n📬 メールID: ${result.messageId || "不明"}\n⏱ 処理時間: ${result.details || "不明"}\n\n📰 配信カテゴリ:\n${result.categoriesFound?.map((c) => `  • ${c}`).join("\n") || "  なし"}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `❌ 送信失敗\n\nエラー: ${result.error}\n\n取得できたカテゴリ: ${result.categoriesFound?.join(", ") || "なし"}`,
            },
          ],
        };
      },
    );
  }
}

// =============================================
// Worker Entry Point
// =============================================
export default {
  /**
   * HTTP リクエストハンドラ（MCP エンドポイント）
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // ヘルスチェック / 手動トリガーエンドポイント
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "Daily News Digest MCP",
          version: "2.0.0",
          endpoints: ["/mcp", "/sse", "/health", "/trigger"],
          nextRun: "毎朝 09:00 JST (UTC 00:00)",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 手動トリガー（管理用）
    if (url.pathname === "/trigger" && request.method === "POST") {
      const envWithSecrets = env as Env & {
        ANTHROPIC_API_KEY?: string;
        RESEND_API_KEY?: string;
        SENDER_EMAIL?: string;
        RECIPIENT_EMAIL?: string;
        RECIPIENT_NAME?: string;
      };

      if (
        !envWithSecrets.ANTHROPIC_API_KEY ||
        !envWithSecrets.RESEND_API_KEY ||
        !envWithSecrets.SENDER_EMAIL ||
        !envWithSecrets.RECIPIENT_EMAIL
      ) {
        return new Response(
          JSON.stringify({ error: "Required secrets not configured (ANTHROPIC_API_KEY, RESEND_API_KEY, SENDER_EMAIL, RECIPIENT_EMAIL)" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      ctx.waitUntil(
        runDailyNewsDigest({
          ANTHROPIC_API_KEY: envWithSecrets.ANTHROPIC_API_KEY,
          RESEND_API_KEY: envWithSecrets.RESEND_API_KEY,
          SENDER_EMAIL: envWithSecrets.SENDER_EMAIL,
          RECIPIENT_EMAIL: envWithSecrets.RECIPIENT_EMAIL,
          RECIPIENT_NAME: envWithSecrets.RECIPIENT_NAME,
        }).then((result) => {
          console.log("[Trigger] Manual run result:", JSON.stringify(result));
        }),
      );

      return new Response(
        JSON.stringify({ message: "News digest triggered", status: "running" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response("Not found", { status: 404 });
  },

  /**
   * Cloudflare Cron Trigger ハンドラ
   * wrangler.jsonc の crons 設定: "0 0 * * *" (UTC 00:00 = JST 09:00)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`[Cron] Scheduled event triggered: ${new Date().toISOString()}`);

    const envWithSecrets = env as Env & {
      ANTHROPIC_API_KEY?: string;
      RESEND_API_KEY?: string;
      SENDER_EMAIL?: string;
      RECIPIENT_EMAIL?: string;
      RECIPIENT_NAME?: string;
    };

    if (
      !envWithSecrets.ANTHROPIC_API_KEY ||
      !envWithSecrets.RESEND_API_KEY ||
      !envWithSecrets.SENDER_EMAIL ||
      !envWithSecrets.RECIPIENT_EMAIL
    ) {
      console.error(
        "[Cron] Missing required secrets: ANTHROPIC_API_KEY, RESEND_API_KEY, SENDER_EMAIL, or RECIPIENT_EMAIL",
      );
      return;
    }

    ctx.waitUntil(
      runDailyNewsDigest({
        ANTHROPIC_API_KEY: envWithSecrets.ANTHROPIC_API_KEY,
        RESEND_API_KEY: envWithSecrets.RESEND_API_KEY,
        SENDER_EMAIL: envWithSecrets.SENDER_EMAIL,
        RECIPIENT_EMAIL: envWithSecrets.RECIPIENT_EMAIL,
        RECIPIENT_NAME: envWithSecrets.RECIPIENT_NAME,
      }).then((result) => {
        if (result.success) {
          console.log(
            `[Cron] ✅ Success: ${result.articleCount} articles sent to ${result.messageId}`,
          );
        } else {
          console.error(`[Cron] ❌ Failed: ${result.error}`);
        }
      }),
    );
  },
};
