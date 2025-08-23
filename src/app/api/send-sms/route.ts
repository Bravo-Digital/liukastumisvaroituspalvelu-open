// app/api/send-sms/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sender, message, msisdn } = await req.json();

    if (!sender || !message || !msisdn) {
      return NextResponse.json({ error: 'sender, message, and msisdn are required' }, { status: 400 });
    }

    const token = process.env.GATEWAYAPI_TOKEN;
    const base = process.env.GATEWAYAPI_BASE || 'https://gatewayapi.com';
    if (!token) {
      return NextResponse.json({ error: 'Server misconfigured: missing GATEWAYAPI_TOKEN' }, { status: 500 });
    }

    const url = `${base}/rest/mtsms`;

    // GatewayAPI expects JSON with message, sender, recipients[{ msisdn }]
    const payload = {
      sender,
      message,
      recipients: [{ msisdn }],
    };

    const gwRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Token as Basic Auth username, empty password
        Authorization: 'Basic ' + Buffer.from(`${token}:`).toString('base64'),
      },
      body: JSON.stringify(payload),
    });

    // GatewayAPI returns 200 with ids and usage on success; other status codes indicate errors[6][2].
    const text = await gwRes.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* keep raw text */ }

    if (!gwRes.ok) {
      return NextResponse.json(
        { error: 'GatewayAPI error', status: gwRes.status, details: json ?? text },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, gatewayapi: json });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected server error', details: err?.message }, { status: 500 });
  }
}
