import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAppSettingsForShop } from "../services/settings.server";
import { runAutoAnalysisForProduct } from "../services/analysis.service.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const settings = await getAppSettingsForShop(shop, "My Store");

    // Automatically re-analyze updated products when "Analyze updated products" setting is ON
    if (settings.allowAiSuggestions && payload?.id) {
      await runAutoAnalysisForProduct(admin, shop, String(payload.id));
      console.log(`Auto-analyzed updated product webhook (${payload.id}) for ${shop}`);
    }
  } catch (error) {
    console.error(`Error in products/update webhook handler:`, error);
  }

  return new Response();
};
