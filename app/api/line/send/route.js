export async function POST(req) {
  const { userId, message } = await req.json();

  console.log("LINE SEND", userId, message);

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
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
          text: message,
        },
      ],
    }),
  });

  const data = await res.text();
  console.log("LINE RESPONSE:", data);

  return Response.json({ ok: true, data });
}