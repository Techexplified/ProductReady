import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  runAutoAnalysisForProduct,
  fetchFreshMergedProducts,
} from "../services/analysis.service.server";
import { getStoreConnectionStatus } from "../services/settings.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const { isDisconnected } = await getStoreConnectionStatus(shopName);
  if (isDisconnected) {
    return Response.json(
      {
        success: false,
        message: "Store is currently disconnected. Reconnect store in Settings to run AI audits.",
      },
      { status: 400 }
    );
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
      const freshProducts = await fetchFreshMergedProducts(admin, shopName);

      if (aiData) {
        return Response.json({
          success: true,
          aiData,
          productId,
          products: freshProducts,
        });
      }

      return Response.json(
        {
          success: false,
          error: "AI analysis failed to produce results.",
          productId,
          products: freshProducts,
        },
        { status: 500 }
      );
    } catch (err: any) {
      console.error(`API error in run-analysis for ${productId}:`, err);
      return Response.json(
        {
          success: false,
          error: err?.message || "Failed to analyze product",
          productId,
        },
        { status: 500 }
      );
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
      const freshProducts = await fetchFreshMergedProducts(admin, shopName);
      return Response.json({
        success: true,
        count: productIds.length,
        products: freshProducts,
        message: `Bulk AI Analysis completed for ${productIds.length} products!`,
      });
    } catch (err: any) {
      console.error("API error in run-bulk-analysis:", err);
      return Response.json(
        {
          success: false,
          error: err?.message || "Bulk analysis failed",
        },
        { status: 500 }
      );
    }
  }

  return Response.json({ success: false, error: `Unknown intent: ${intent}` }, { status: 400 });
};

export const loader = async () => {
  return Response.json({ message: "Use POST on /api/analyze-product to run analysis." });
};
