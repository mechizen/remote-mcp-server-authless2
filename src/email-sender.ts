/**
 * Email Sender
 * Resend APIを使ってHTMLメールを送信
 */

export interface EmailPayload {
  to: string;
  toName?: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Resend APIでメールを送信
 * @see https://resend.com/docs/api-reference/emails/send-email
 */
export async function sendEmailViaResend(
  payload: EmailPayload,
  resendApiKey: string,
): Promise<SendResult> {
  try {
    // 表示名付き "Name <email>" 形式は Resend のテストモード検証で
    // アドレス照合が失敗するため、素のメールアドレスのみで送信する
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        ...(payload.text ? { text: payload.text } : {}),
      }),
    });

    const data = (await response.json()) as {
      id?: string;
      name?: string;
      message?: string;
      statusCode?: number;
    };

    if (!response.ok) {
      const errorMsg = data.message || `HTTP ${response.status}`;
      console.error("Resend API error:", errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Email send failed:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
