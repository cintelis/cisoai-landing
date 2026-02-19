export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiUrl = String(env.EMAIL_API_URL || "https://365soft-email-worker.nick-598.workers.dev/api/send").trim();
  const clientId = String(env.CF_ACCESS_CLIENT_ID || "").trim();
  const clientSecret = String(env.CF_ACCESS_CLIENT_SECRET || "").trim();

  if (!apiUrl) {
    return new Response("Email API URL is not configured.", { status: 500 });
  }

  if (!clientId || !clientSecret) {
    return new Response("Cloudflare Access service token is not configured.", { status: 500 });
  }

  const body = await request.text();

  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Access-Client-Id": clientId,
      "CF-Access-Client-Secret": clientSecret
    },
    body
  });

  const respText = await upstream.text();
  const contentType = upstream.headers.get("content-type") || "application/json";

  return new Response(respText, {
    status: upstream.status,
    headers: { "Content-Type": contentType }
  });
}
