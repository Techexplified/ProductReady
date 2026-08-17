import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAppSettingsForShop } from "../services/settings.server";
import { runAutoAnalysisForProduct } from "../services/analysis.service.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const settings = await getAppSettingsForShop(shop, "My Store");

    // Automatically analyze new products when "Auto-analyze new products" setting is ON
    if (settings.autoAnalyzeNew && payload?.id) {
      await runAutoAnalysisForProduct(admin, shop, String(payload.id));
      console.log(`Auto-analyzed new product webhook (${payload.id}) for ${shop}`);
    }
  } catch (error) {
    console.error(`Error in products/create webhook handler:`, error);
  }

  return new Response();
};
