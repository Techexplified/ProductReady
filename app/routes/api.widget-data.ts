import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getWidgetForStorefront } from "../services/widget-renderer.server";
import { recordWidgetEvent } from "../services/widget-analytics.service.server";

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const url = new URL(request.url);
  const shopName = url.searchParams.get("shop") || url.searchParams.get("shopName") || "";
  const productId = url.searchParams.get("productId") || undefined;
  const pageType = url.searchParams.get("pageType") || "Product Page";
  const vendor = url.searchParams.get("vendor") || undefined;
  const productType = url.searchParams.get("productType") || undefined;
  const price = url.searchParams.get("price") ? parseFloat(url.searchParams.get("price")!) : undefined;

  if (!shopName) {
    return jsonResponse({ error: "Missing required query parameter 'shop'" }, 400);
  }

  const result = await getWidgetForStorefront({
    shopName,
    productId,
    pageType,
    ruleContext: {
      vendor,
      productType,
      price,
    },
  });

  return jsonResponse(result);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  try {
    const body = await request.json();
    const { widgetId, eventType, productId } = body;

    if (!widgetId || !eventType) {
      return jsonResponse({ error: "Missing widgetId or eventType" }, 400);
    }

    await recordWidgetEvent(widgetId, eventType as "impression" | "click", productId);

    return jsonResponse({ success: true });
  } catch (error: any) {
    return jsonResponse({ error: error.message || "Failed to record event" }, 500);
  }
};
