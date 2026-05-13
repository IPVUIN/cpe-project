export async function POST(req) {
  const body = await req.json();

  for (const event of body.events) {
    if (event.type === "follow") {
      const userId = event.source.userId;

      console.log("NEW USER:", userId);

      // 👇 เก็บไว้ก่อน

      // ส่งลิงก์ให้ user ไปเชื่อมบัญชี
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: [
            {
              type: "text",
              text:
                "👋 ยินดีต้อนรับ!\nกดลิงก์เพื่อเชื่อมบัญชี 👇\n" +
                `https://ctpay-delta.vercel.app/link-line?lineId=${userId}`,
            },
          ],
        }),
      });
    }
  }

  return new Response("ok");
}
