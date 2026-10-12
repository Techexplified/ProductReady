import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  let webhookContext;
  try {
    webhookContext = await authenticate.webhook(request);
  } catch (error) {
    console.error("Webhook authentication failed for compliance:", error);
    return new Response(JSON.stringify({ message: "Invalid webhook request" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { topic, shop, payload } = webhookContext;
  console.log(`Received compliance webhook: ${topic} for shop: ${shop}`);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
    case "customers/data_request": {
      // ProductReady does not store any customer/buyer personal data.
      return new Response(JSON.stringify({ message: "No customer data stored." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    case "CUSTOMERS_REDACT":
    case "customers/redact": {
      // ProductReady does not store any customer/buyer personal data.
      return new Response(JSON.stringify({ message: "No customer data to redact." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    case "SHOP_REDACT":
    case "shop/redact": {
      // 48 hours after uninstall, delete all stored data for this shop
      try {
        const shopDomain = (payload as { shop_domain?: string })?.shop_domain || shop;
        if (shopDomain) {
          await db.session.deleteMany({ where: { shop: shopDomain } });
          await db.store.deleteMany({ where: { shopName: shopDomain } });
        }
      } catch (error) {
        console.error("Error processing shop/redact webhook:", error);
      }
      return new Response(JSON.stringify({ message: "Shop data redacted successfully." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    default:
      return new Response(JSON.stringify({ message: "Unhandled compliance webhook" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
  }
};

export const loader = async () => {
  return new Response("OK", { status: 200 });
};
