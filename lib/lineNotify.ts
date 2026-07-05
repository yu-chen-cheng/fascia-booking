// 傳送 LINE 預約確認通知
export async function sendBookingConfirmation(params: {
  lineUserId: string;
  customerName: string;
  storeName: string;
  staffName: string;
  serviceName: string;
  duration?: number; // 服務總時長（分鐘）
  date: string;      // 'YYYY-MM-DD'
  timeSlot: string;  // 'HH:mm'
  totalPrice: number;
}) {
  const { lineUserId, customerName, storeName, staffName, serviceName, duration, date, timeSlot, totalPrice } = params;

  // Format date to Chinese
  const d = new Date(date + "T00:00:00");
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;

  const messages = [
    {
      type: "flex",
      altText: `✅ 預約確認 - ${dateStr} ${timeSlot}`,
      contents: {
        type: "bubble",
        styles: {
          header: { backgroundColor: "#8b6748" },
          body: { backgroundColor: "#faf7f2" },
          footer: { backgroundColor: "#faf7f2" },
        },
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "FASCIA 法夏・筋膜結構美學",
              color: "#d4b896",
              size: "xs",
              weight: "bold",
              align: "center",
            },
            {
              type: "text",
              text: "預約確認通知",
              color: "#ffffff",
              size: "lg",
              weight: "bold",
              align: "center",
              margin: "sm",
            },
          ],
          paddingAll: "lg",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          paddingAll: "lg",
          contents: [
            {
              type: "text",
              text: `${customerName} 您好，預約已確認！`,
              size: "sm",
              color: "#1c1c1c",
              weight: "bold",
            },
            { type: "separator", margin: "md", color: "#e8ddd2" },
            infoRow("📅", "日期時間", `${dateStr}  ${timeSlot}`),
            infoRow("📍", "門市", storeName),
            infoRow("👤", "技師", staffName),
            infoRow("✨", "服務", serviceName),
            ...(duration ? [infoRow("⏱", "服務時長", `${duration} 分鐘`)] : []),
            infoRow("💰", "費用", `NT$${totalPrice.toLocaleString()}`),
            { type: "separator", margin: "md", color: "#e8ddd2" },
            {
              type: "text",
              text: "如需更改或取消，請於調理前 24 小時聯繫我們。",
              size: "xs",
              color: "#8a7a6e",
              wrap: true,
              margin: "md",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          paddingAll: "md",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "查看我的預約",
                uri: `https://fascia-booking.vercel.app/booking/history`,
              },
              style: "primary",
              color: "#8b6748",
              height: "sm",
            },
          ],
        },
      },
    },
  ];

  try {
    await fetch("/api/line-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineUserId, messages }),
    });
  } catch (e) {
    console.error("sendBookingConfirmation error", e);
  }
}

function infoRow(icon: string, label: string, value: string) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    contents: [
      { type: "text", text: icon, size: "sm", flex: 0 },
      { type: "text", text: label, size: "sm", color: "#8a7a6e", flex: 2 },
      { type: "text", text: value, size: "sm", color: "#1c1c1c", weight: "bold", flex: 4, wrap: true },
    ],
  };
}
