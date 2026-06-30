import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { to, subject, html } = body;

  if (!to || !subject || !html) {
    return NextResponse.json({ error: "Missing to, subject, or html" }, { status: 400 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "FASCIA 法夏 <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("send-email error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
