import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRefresh() {
  const session = await prisma.session.findFirst({
    where: { shop: "abcd-qssk9ukc.myshopify.com", isOnline: false },
  });

  if (!session || !session.refreshToken) {
    console.log("No session or refreshToken found for abcd");
    return;
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  console.log(`ApiKey present: ${Boolean(apiKey)}, ApiSecret present: ${Boolean(apiSecret)}`);

  try {
    const res = await fetch(`https://${session.shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      }),
    });

    console.log(`Refresh response status: ${res.status}`);
    const json = await res.json();
    console.log(`Refresh response body:`, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Refresh fetch error:", err);
  }
}

testRefresh()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
