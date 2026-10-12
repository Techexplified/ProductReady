import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAppSettingsForShop } from "../services/settings.server";
import { runAutoAnalysisForProduct, createAnalysisJob } from "../services/analysis.service.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  let webhookContext: any;
  try {
    webhookContext = await authenticate.webhook(request);
  } catch (authError) {
    console.error("Webhook authentication failed for products/create:", authError);
    // Always respond 200 to satisfy Shopify and avoid retries / red failure logs
    return new Response(null, { status: 200 });
  }

  const { shop, payload, topic, admin } = webhookContext;
  console.log(`Received ${topic} webhook for ${shop}`);

  // Process entirely in the background without awaiting so Shopify gets 200 OK within 10ms
  if (payload?.id) {
    const rawProductId = String(payload.id);
    (async () => {
      try {
        const settings = await getAppSettingsForShop(shop, "My Store");
        if (settings.autoAnalyzeNew) {
          await createAnalysisJob(shop, rawProductId, admin);
          await runAutoAnalysisForProduct(admin, shop, rawProductId);
          console.log(`Auto-analyzed new product webhook (${rawProductId}) for ${shop}`);
        }
      } catch (error) {
        console.error(`Error in async background products/create analysis for ${rawProductId}:`, error);
      }
    })();
  }

  return new Response(null, { status: 200 });
};

export const loader = async () => {
  return new Response("OK", { status: 200 });
};
