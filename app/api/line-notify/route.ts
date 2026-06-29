import { NextRequest, NextResponse } from "next/server";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

export async function POST(req: NextRequest) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    return NextResponse.json({ error: "LINE token not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { lineUserId, messages } = body;

  if (!lineUserId || !messages) {
    return NextResponse.json({ error: "Missing lineUserId or messages" }, { status: 400 });
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: lineUserId, messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("LINE push error", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
