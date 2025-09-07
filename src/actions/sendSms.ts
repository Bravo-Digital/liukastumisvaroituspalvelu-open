"use server";

export async function sendBulkSms({
  sender,
  message,
  recipients,
}: {
  sender: string;
  message: string;
  recipients: { msisdn: string }[];
}) {
  const token = process.env.GATEWAYAPI_API_KEY?.trim();
  const base = process.env.GATEWAYAPI_BASE || "https://gatewayapi.eu";

  if (!token) throw new Error("Missing GATEWAYAPI_API_KEY");
  if (recipients.length === 0) return [];

  const url = `${base}/rest/mtsms`;

  const payload = {
    sender,
    message,
    recipients,
    class: "standard",
    priority: "NORMAL",
    validity_period: 86400, // 24h
    encoding: "UTF8",
    destaddr: "MOBILE",
  };

  const gwRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await gwRes.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }

  if (!gwRes.ok) {
    throw new Error(
      `GatewayAPI error ${gwRes.status}: ${JSON.stringify(json ?? text)}`
    );
  }

  // Return messages array for per-recipient IDs
  return json?.messages ?? [];
}
