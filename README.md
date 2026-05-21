# Daily News Digest MCP Server

Cloudflare Workers + Claude AI による **日次ニュースダイジェスト自動配信サービス**。

毎朝 9:00 JST に、設定した興味分野のニュースを RSS から収集し、Claude AI が日本語でまとめてメールで配信します。
MCP ツールとしても公開しており、**Claude Routines** から手動・定期実行も可能です。

---

## 🗂 機能概要

| 機能 | 詳細 |
|------|------|
| 📰 ニュース収集 | 15+ の RSS フィードから最新ニュースを自動取得 |
| 🤖 AI 要約 | Claude Haiku が英語記事を日本語でわかりやすく要約 |
| 📧 メール配信 | Resend API 経由でリッチ HTML メールを送信 |
| ⏰ 自動実行 | Cloudflare Cron Trigger で毎朝 9:00 JST に自動実行 |
| 🛠 MCP ツール | Claude Routines / Claude Code から手動実行可能 |

---

## 📰 配信カテゴリ（興味分野）

- 💻 IT・テクノロジー（TechCrunch, The Verge, Ars Technica）
- 🤖 AI・AIエージェント（VentureBeat AI, MarkTechPost）
- 🔒 サイバーセキュリティ・CDN・WAF・ゼロトラスト（Krebs on Security, The Hacker News, Dark Reading）
- 🌐 SaaS・インターネット産業（TechCrunch Enterprise, ZDNet）
- ⚽ スポーツ（BBC Sport, ESPN）
- 📈 株式・経済・マネー（MarketWatch, Investing.com）
- ✈️ 旅行・観光（Lonely Planet, Travel+Leisure）
- 🎨 芸術・文化（Hyperallergic）
- 📚 英語学習（BBC Learning English）

---

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Cloudflare Workers シークレットの設定

以下の3つのシークレットを設定してください：

```bash
# Anthropic API キー（Claude AI 要約に使用）
# 取得: https://console.anthropic.com/
wrangler secret put ANTHROPIC_API_KEY

# Resend API キー（メール送信に使用）
# 取得: https://resend.com/api-keys
wrangler secret put RESEND_API_KEY

# 送信元メールアドレス（Resend で検証済みドメインのアドレス）
# 例: digest@yourdomain.com または onboarding@resend.dev（テスト用）
wrangler secret put SENDER_EMAIL
```

> **Resend のドメイン設定**: Resend にログインし、送信元ドメインを DNS 検証してください。
> 無料プランでは `@resend.dev` のアドレスを使用できます。

### 3. デプロイ

```bash
npm run deploy
```

デプロイ後、Cloudflare Dashboard の Workers & Pages → 対象 Worker → Triggers タブで
Cron Trigger（`0 0 * * *`）が有効になっていることを確認してください。

---

## 🛠 MCP ツール

### `send_daily_news_digest`

Claude Routines や Claude Code から日次ダイジェストを手動送信・テストするツール。

**パラメータ:**
| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `dry_run` | boolean | `false` | `true` にするとメール送信せずダイジェスト内容を表示（テスト用） |

---

## 📅 Claude Routines での設定方法

Claude Code の Routines 機能を使って、毎朝 MCP ツールを呼び出す設定:

```
毎朝9時にMCPツール send_daily_news_digest を呼び出して
masayuki.echizen@gmail.com にニュースダイジェストを送信してください。
```

> **注**: Cloudflare Cron Trigger（`0 0 * * *` UTC = 09:00 JST）でも同じ自動実行が可能です。

---

## 📡 Claude Desktop / Claude Code への接続方法

`claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "daily-news-digest": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://remote-mcp-server-authless2.<your-account>.workers.dev/sse"
      ]
    }
  }
}
```

---

## 🔧 ローカル開発

```bash
# 開発サーバー起動
npm run dev

# ヘルスチェック
curl http://localhost:8787/health

# 手動トリガー（ローカルでテスト）
curl -X POST http://localhost:8787/trigger
```

---

## 📡 API エンドポイント

| パス | メソッド | 説明 |
|------|---------|------|
| `/mcp` | GET/POST | MCP プロトコルエンドポイント |
| `/sse` | GET | Server-Sent Events エンドポイント |
| `/health` | GET | ヘルスチェック |
| `/trigger` | POST | 手動でダイジェスト送信をトリガー |

---

## 📦 技術スタック

- **Runtime**: Cloudflare Workers (Durable Objects)
- **Framework**: [agents SDK](https://github.com/cloudflare/agents) + MCP SDK
- **AI**: Anthropic Claude Haiku (`claude-haiku-4-5`)
- **Email**: [Resend](https://resend.com)
- **Scheduling**: Cloudflare Cron Triggers
- **Language**: TypeScript

---

## 🔑 必要な API キー

| サービス | 用途 | 取得先 |
|---------|------|--------|
| Anthropic API | Claude AI による日本語要約 | https://console.anthropic.com/ |
| Resend API | メール送信 | https://resend.com |

---

## ⚙️ カスタマイズ

`src/config.ts` を編集して：
- 配信先メールアドレスの変更
- RSS フィードの追加・削除
- カテゴリ構成の変更
- 1カテゴリあたりの記事数調整

が可能です。
