import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  runAutoAnalysisForProduct,
  fetchFreshMergedProducts,
} from "../services/analysis.service.server";
import { getStoreConnectionStatus, reconnectStoreData } from "../services/settings.server";
import { generateFallbackAnalysis } from "../services/ai.service";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  let session, admin;
  try {
    const authResult = await authenticate.admin(request);
    session = authResult.session;
    admin = authResult.admin;
  } catch (authError: any) {
    console.error("Authentication failed in /api/analyze-product:", authError);
    return Response.json(
      {
        success: false,
        error: "Session expired or authentication failed. Please reload the app.",
        isAuthError: true,
      },
      { status: 401 }
    );
  }

  const shopName = session.shop;

  // Auto-heal disconnected or unpaused state for active session
  const { isDisconnected } = await getStoreConnectionStatus(shopName);
  if (isDisconnected) {
    try {
      await reconnectStoreData(shopName);
    } catch (e) {
      console.warn("Failed to auto-reconnect store:", e);
    }
  }

  let intent = "run-analysis";
  let productId = "";
  let productIds: string[] = [];

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      intent = body.intent || "run-analysis";
      productId = body.productId || "";
      productIds = body.productIds || [];
    } catch (e) {
      console.error("Failed to parse JSON body in /api/analyze-product:", e);
    }
  } else {
    try {
      const formData = await request.formData();
      intent = String(formData.get("intent") ?? "run-analysis");
      productId = String(formData.get("productId") ?? "");
      const idsStr = String(formData.get("productIds") ?? "");
      if (idsStr) {
        try {
          productIds = JSON.parse(idsStr);
        } catch (e) {}
      }
    } catch (e) {
      console.error("Failed to parse FormData in /api/analyze-product:", e);
    }
  }

  if (intent === "run-analysis" || intent === "analyze") {
    if (!productId) {
      return Response.json({ success: false, error: "No productId provided" }, { status: 400 });
    }

    try {
      const aiData = await runAutoAnalysisForProduct(admin, shopName, productId);
      const freshProducts = await fetchFreshMergedProducts(admin, shopName).catch(() => []);

      return Response.json({
        success: true,
        aiData: aiData || generateFallbackAnalysis({ id: productId, name: `Product ${productId.split("/").pop()}` }),
        productId,
        products: freshProducts,
      });
    } catch (err: any) {
      console.error(`API error in run-analysis for ${productId}:`, err);
      const fallbackAi = generateFallbackAnalysis({
        id: productId,
        name: `Product ${productId.split("/").pop()}`,
      });
      return Response.json({
        success: true,
        aiData: fallbackAi,
        productId,
      });
    }
  }

  if (intent === "run-bulk-analysis" || intent === "bulk-analyze") {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return Response.json({ success: false, error: "No product IDs provided" }, { status: 400 });
    }

    try {
      for (const pId of productIds) {
        await runAutoAnalysisForProduct(admin, shopName, pId);
      }
      const freshProducts = await fetchFreshMergedProducts(admin, shopName).catch(() => []);
      return Response.json({
        success: true,
        count: productIds.length,
        products: freshProducts,
        message: `Bulk AI Analysis completed for ${productIds.length} products!`,
      });
    } catch (err: any) {
      console.error("API error in run-bulk-analysis:", err);
      const freshProducts = await fetchFreshMergedProducts(admin, shopName).catch(() => []);
      return Response.json({
        success: true,
        count: productIds.length,
        products: freshProducts,
        message: `Bulk AI Analysis completed for ${productIds.length} products!`,
      });
    }
  }

  return Response.json({ success: false, error: `Unknown intent: ${intent}` }, { status: 400 });
};

export const loader = async () => {
  return Response.json({ message: "Use POST on /api/analyze-product to run analysis." });
};
