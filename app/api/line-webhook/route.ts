import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// LINE Webhook - 接收 OA 事件，記錄真實的 OA userId
export async function POST(req: NextRequest) {
  const body = await req.json();
  const events = body.events ?? [];

  for (const event of events) {
    const oaUserId = event.source?.userId;
    if (!oaUserId) continue;

    // follow 事件（加好友）或 message 事件
    if (event.type === "follow" || event.type === "message") {
      const text: string = event.message?.text?.trim() ?? "";

      // 如果用戶傳了手機號碼（09開頭），嘗試比對客戶並存 oa_user_id
      const phoneMatch = text.match(/^(09\d{8})$/);
      if (phoneMatch) {
        const phone = phoneMatch[1];
        const { data: customer } = await supabase
          .from("customers")
          .select("id, oa_user_id")
          .eq("phone", phone)
          .single();

        if (customer && !customer.oa_user_id) {
          await supabase
            .from("customers")
            .update({ oa_user_id: oaUserId })
            .eq("id", customer.id);

          // 回覆確認訊息
          if (event.replyToken) {
            await fetch("https://api.line.me/v2/bot/message/reply", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
              },
              body: JSON.stringify({
                replyToken: event.replyToken,
                messages: [{ type: "text", text: "✅ 預約通知已啟用！往後預約完成後您將收到 LINE 通知。" }],
              }),
            });
          }
        }
      }

      // follow 事件：歡迎訊息
      if (event.type === "follow" && event.replyToken) {
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [{
              type: "text",
              text: "歡迎加入 FASCIA 法夏！\n\n若您已完成線上預約，請傳送您的手機號碼（格式：09XXXXXXXX）以啟用預約通知功能。",
            }],
          }),
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// LINE webhook 驗證用
export async function GET() {
  return NextResponse.json({ ok: true });
}
