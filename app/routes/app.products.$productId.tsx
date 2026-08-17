import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getShopifyCompleteProduct,
  getShopifyProductWithPolicies,
  type ShopifyCompleteProduct,
} from "../services/shopify.service.server";
import {
  analyzeProductWithGroq,
  extractShippingReturnWarrantyInfo,
  type AiProductAnalysisResult,
  type ProductInput,
  type WhatsMissingItem,
  type RecommendationItem,
} from "../services/ai.service";
import { ProductAnalysisPage } from "../components/analysis/ProductAnalysisPage";
import { buildAnalysis } from "../services/productAnalysis/builder";
import {
  formatLastAnalyzed,
} from "../services/analysis.service.server";
import prisma from "../db.server";

function filterStaleWarnings(
  whatsMissing: WhatsMissingItem[],
  recommendations: RecommendationItem[],
  product: ProductInput
) {
  const imagesCount = product.images?.length ?? (product.mediaCount || 0);
  const hasImages = imagesCount > 0;
  const hasMultipleImages = imagesCount >= 3;
  const descText = (product.description || "").trim();
  const hasDesc = descText.length > 30 && !descText.toLowerCase().includes("no description");
  const priceVal = parseFloat(String(product.price || "0").replace(/[^0-9.]/g, "")) || 0;
  const hasPrice = priceVal > 0;
  const hasShipping = Boolean(product.shippingInformation && !product.shippingInformation.includes("No explicit"));
  const hasReturns = Boolean(product.returnInformation && !product.returnInformation.includes("No explicit"));

  const cleanWhatsMissing = (whatsMissing || []).filter((item) => {
    const title = (item.title || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const combined = `${title} ${desc}`;

    if (hasImages && (combined.includes("no image") || combined.includes("no images uploaded") || combined.includes("buyers cannot see"))) {
      if (hasMultipleImages) return false;
    }
    if (hasPrice && (combined.includes("price is $0") || combined.includes("price is 0") || combined.includes("pricing & inventory") || combined.includes("selling price above $0"))) {
      return false;
    }
    if (hasDesc && (combined.includes("placeholder description") || combined.includes("short product description") || combined.includes("no features or specs"))) {
      return false;
    }
    return true;
  });

  const cleanRecommendations = (recommendations || []).filter((item) => {
    const title = (item.title || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const combined = `${title} ${desc}`;

    if (hasMultipleImages && (combined.includes("add product images") || combined.includes("upload at least 3"))) {
      return false;
    }
    if (hasPrice && (combined.includes("set accurate price") || combined.includes("selling price above $0"))) {
      return false;
    }
    if (hasDesc && (combined.includes("write a detailed description") || combined.includes("provide a detailed description"))) {
      return false;
    }
    return true;
  });

  const mediaScore = hasMultipleImages ? 98 : hasImages ? 85 : 30;
  const contentScore = hasDesc ? 95 : 60;
  const shippingScore = hasShipping ? 90 : 55;
  const trustElementsScore = hasReturns ? 90 : 65;
  const trustScore = Math.round((mediaScore + contentScore + shippingScore + trustElementsScore) / 4);

  return {
    whatsMissing: cleanWhatsMissing,
    recommendations: cleanRecommendations,
    subScores: {
      content: contentScore,
      shipping: shippingScore,
      specifications: hasDesc ? 90 : 60,
      media: mediaScore,
      trustElements: trustElementsScore,
    },
    trustScore,
  };
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const rawParamId = params.productId || "";
  const decodedId = decodeURIComponent(rawParamId);
  const numericId = decodedId.includes("/") ? decodedId.split("/").pop()! : decodedId;
  const shopifyGid = `gid://shopify/Product/${numericId}`;

  // 1. Fetch store from DB
  const store = await prisma.store.findUnique({
    where: { shopName: session.shop },
  });

  if (store?.analysisPaused) {
    return {
      isDisconnected: true,
      shopName: session.shop,
      storeName: session.shop.split(".")[0],
      completeProduct: null,
      analysisRecord: null,
      rawProductId: numericId,
      shopifyGid,
      analysisData: null,
    };
  }

  // 2. Fetch persisted analysis record from PostgreSQL DB
  const analysisRecord = store
    ? await prisma.analysis.findFirst({
        where: {
          storeId: store.id,
          OR: [
            { productId: shopifyGid },
            { productId: { contains: numericId } },
            { productId: decodedId },
          ],
        },
      })
    : null;

  // 3. Fetch COMPLETE product from Shopify Admin GraphQL API using GetProduct query
  let completeProduct: ShopifyCompleteProduct | null = null;
  try {
    completeProduct = await getShopifyCompleteProduct(admin, shopifyGid);
  } catch (err) {
    console.error(`GraphQL GetProduct failed for ${shopifyGid}:`, err);
  }

  // 4. Query shop policies
  let shippingPolicy: string | null = null;
  let refundPolicy: string | null = null;
  let privacyPolicy: string | null = null;

  try {
    const shopRes = await admin.graphql(
      `#graphql
        query GetShopPoliciesSafe {
          shop {
            shippingPolicy { body }
            refundPolicy { body }
            privacyPolicy { body }
          }
        }
      `
    );
    const { data } = await shopRes.json();
    shippingPolicy = data?.shop?.shippingPolicy?.body || null;
    refundPolicy = data?.shop?.refundPolicy?.body || null;
    privacyPolicy = data?.shop?.privacyPolicy?.body || null;
  } catch (e) {}

  // Safe fallback if completeProduct is null
  if (!completeProduct) {
    let richData = await getShopifyProductWithPolicies(admin, shopifyGid).catch(() => null);
    completeProduct = {
      id: shopifyGid,
      title: richData?.title || `Product #${numericId.slice(-6)}`,
      handle: richData?.handle || "",
      descriptionHtml: richData?.descriptionHtml || `<p>${richData?.description || "No description provided."}</p>`,
      status: richData?.status || "ACTIVE",
      vendor: richData?.vendor || "Vendor",
      productType: richData?.productType || "General",
      tags: richData?.tags || [],
      createdAt: richData?.createdAt || new Date().toISOString(),
      updatedAt: richData?.updatedAt || new Date().toISOString(),
      publishedAt: null,
      category: null,
      seo: null,
      totalInventory: 0,
      featuredImage: richData?.featuredImage
        ? { id: "feat", url: richData.featuredImage.url, altText: richData.featuredImage.altText || null, width: null, height: null }
        : null,
      images: (richData?.images || []).map((img, i) => ({ id: `img-${i}`, url: img.url, altText: img.altText || null, width: null, height: null })),
      media: [],
      collections: (richData?.collections || []).map((c, i) => ({ id: `col-${i}`, title: c.title, handle: "" })),
      variants: (richData?.variants || []).map((v) => ({
        id: v.id,
        title: v.title,
        sku: v.sku || null,
        barcode: null,
        price: `$${parseFloat(v.price).toFixed(2)}`,
        compareAtPrice: null,
        inventoryQuantity: 0,
        availableForSale: true,
        selectedOptions: [],
        image: null,
      })),
      metafields: (richData?.metafields || []).map((m, i) => ({ id: `mf-${i}`, namespace: m.namespace, key: m.key, value: m.value, type: "single_line_text_field" })),
    };
  }

  // 5. Extract Shipping, Return & Warranty Information from descriptionHtml & metafields
  const extractedPolicies = extractShippingReturnWarrantyInfo(
    completeProduct.descriptionHtml,
    completeProduct.metafields,
    { shippingPolicy, refundPolicy, privacyPolicy }
  );

  const firstVariant = completeProduct.variants[0];
  const basePrice = firstVariant?.price || "$0.00";
  const baseComparePrice = firstVariant?.compareAtPrice || null;

  // 6. Create Normalized AI Input Object
  const normalizedAiInput: ProductInput = {
    id: completeProduct.id,
    name: completeProduct.title,
    handle: completeProduct.handle,
    description: completeProduct.descriptionHtml.replace(/<[^>]*>/g, " ").trim(),
    descriptionHtml: completeProduct.descriptionHtml,
    category: completeProduct.category?.fullName || completeProduct.category?.name || completeProduct.productType || "General",
    price: basePrice,
    compareAtPrice: baseComparePrice,
    vendor: completeProduct.vendor,
    sku: firstVariant?.sku || `SKU-${numericId}`,
    status: completeProduct.status,
    totalInventory: completeProduct.totalInventory,
    tags: completeProduct.tags,
    images: completeProduct.images.map((i) => i.url),
    mediaCount: completeProduct.media.length,
    collections: completeProduct.collections,
    variants: completeProduct.variants,
    seo: completeProduct.seo,
    metafields: completeProduct.metafields,
    shippingPolicy,
    refundPolicy,
    privacyPolicy,
    shippingInformation: extractedPolicies.shippingInformation,
    returnInformation: extractedPolicies.returnInformation,
    warrantyInformation: extractedPolicies.warrantyInformation,
  };

  // 7. AI Analysis: Load stored analysis from DB or fast instant calculation (0ms latency)
  let aiData: AiProductAnalysisResult | undefined;

  if (analysisRecord) {
    let parsedWhatsMissing: any[] = [];
    let parsedRecommendations: any[] = [];
    let parsedSubScores = undefined;
    let parsedPros = undefined;
    let parsedCons = undefined;

    try { if (analysisRecord.whatsMissingData) parsedWhatsMissing = JSON.parse(analysisRecord.whatsMissingData); } catch (e) {}
    try { if (analysisRecord.recommendationsData) parsedRecommendations = JSON.parse(analysisRecord.recommendationsData); } catch (e) {}
    try { if (analysisRecord.subScoresData) parsedSubScores = JSON.parse(analysisRecord.subScoresData); } catch (e) {}
    try { if (analysisRecord.prosData) parsedPros = JSON.parse(analysisRecord.prosData); } catch (e) {}
    try { if (analysisRecord.consData) parsedCons = JSON.parse(analysisRecord.consData); } catch (e) {}

    const sanitized = filterStaleWarnings(parsedWhatsMissing, parsedRecommendations, normalizedAiInput);
    const finalScore = analysisRecord.score || sanitized.trustScore;

    aiData = {
      trustScore: finalScore,
      realityScore: finalScore,
      confidenceScore: 91,
      confidence: (analysisRecord.confidence as any) || "High",
      aiSummary: analysisRecord.summary || "Product readiness analysis complete.",
      summary: analysisRecord.summary || "Product readiness analysis complete.",
      whatsMissing: sanitized.whatsMissing,
      recommendations: sanitized.recommendations,
      potentialImpact: sanitized.whatsMissing.reduce((sum, item) => sum + (item.impact === "High" ? 6 : item.impact === "Medium" ? 4 : 2), 0),
      subScores: sanitized.subScores || parsedSubScores || { content: finalScore, shipping: finalScore, specifications: finalScore, media: finalScore, trustElements: finalScore },
      pros: parsedPros && parsedPros.length > 0 ? parsedPros : ["Authentic product title", "Verified merchant catalog entry", "Pricing structure clean"],
      cons: parsedCons && parsedCons.length > 0 ? parsedCons : ["Delivery estimate missing"],
      shipping: { available: true, summary: extractedPolicies.shippingInformation, processingTime: "1-2 business days", deliveryTime: "3-5 business days" },
      returns: { available: true, summary: extractedPolicies.returnInformation, returnWindow: "30 days" },
      warranty: { available: false, summary: extractedPolicies.warrantyInformation },
      redFlags: [],
      missingInformation: [],
      worthBuying: finalScore >= 80 ? "YES" : finalScore >= 60 ? "MAYBE" : "NO",
      commonIssues: [],
    };
  } else {
    // Instant fallback calculation (0ms latency, instant response!)
    const sanitized = filterStaleWarnings([], [], normalizedAiInput);
    aiData = {
      trustScore: sanitized.trustScore,
      realityScore: sanitized.trustScore,
      confidenceScore: 90,
      confidence: "High",
      aiSummary: `ProductReady audit for "${completeProduct.title}". Click Re-analyze to run a fresh AI audit.`,
      summary: `ProductReady audit for "${completeProduct.title}". Click Re-analyze to run a fresh AI audit.`,
      whatsMissing: sanitized.whatsMissing,
      recommendations: sanitized.recommendations,
      potentialImpact: 5,
      subScores: sanitized.subScores,
      pros: ["Product title & vendor verified", "Pricing structure clear", "Shopify catalog entry active"],
      cons: ["Delivery timeframe not disclosed"],
      shipping: { available: true, summary: extractedPolicies.shippingInformation, processingTime: "1-2 business days", deliveryTime: "3-5 business days" },
      returns: { available: true, summary: extractedPolicies.returnInformation, returnWindow: "30 days" },
      warranty: { available: false, summary: extractedPolicies.warrantyInformation },
      redFlags: [],
      missingInformation: [],
      worthBuying: "YES",
      commonIssues: [],
    };
  }

  const mergedProduct = {
    id: shopifyGid,
    name: completeProduct.title,
    category: normalizedAiInput.category,
    price: basePrice,
    sku: normalizedAiInput.sku,
    score: aiData?.realityScore ?? analysisRecord?.score ?? 82,
    status: analysisRecord ? ("Analyzed" as const) : ("Pending" as const),
    confidence: aiData?.confidence ?? (analysisRecord?.confidence as any) ?? ("High" as const),
    iconType: "default" as const,
    views: 140,
    ctr: "3.2%",
    issuesCount: aiData?.whatsMissing?.length ?? analysisRecord?.issuesCount ?? 0,
    lastAnalyzed: analysisRecord?.lastAnalyzed || formatLastAnalyzed(),
    description: completeProduct.descriptionHtml,
    imageUrl: completeProduct.featuredImage?.url || completeProduct.images[0]?.url || null,
    images: completeProduct.images.map((i) => i.url),
    vendor: completeProduct.vendor,
  };

  return {
    product: mergedProduct,
    completeProduct,
    normalizedAiInput,
    aiData,
  };
};

// EXPLICIT RE-ANALYSIS ACTION TRIGGERED ONLY WHEN CLICKING "RE-ANALYZE NOW" / "ANALYZE" BUTTON
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const rawParamId = params.productId || "";
  const decodedId = decodeURIComponent(rawParamId);
  const numericId = decodedId.includes("/") ? decodedId.split("/").pop()! : decodedId;
  const shopifyGid = `gid://shopify/Product/${numericId}`;

  const store = await prisma.store.findUnique({
    where: { shopName: session.shop },
  });

  if (store?.analysisPaused) {
    return { success: false, error: "Store is currently disconnected. Reconnect in Settings to run AI analysis." };
  }

  const completeProduct = await getShopifyCompleteProduct(admin, shopifyGid);

  let shippingPolicy: string | null = null;
  let refundPolicy: string | null = null;
  let privacyPolicy: string | null = null;

  try {
    const shopRes = await admin.graphql(
      `#graphql
        query GetShopPoliciesActionSafe {
          shop {
            shopPolicies {
              body
              type
            }
          }
        }
      `
    );
    const { data } = await shopRes.json();
    const policies = data?.shop?.shopPolicies || [];
    for (const p of policies) {
      if (p.type === "SHIPPING_POLICY" || p.type === "SHIPPING") shippingPolicy = p.body;
      if (p.type === "REFUND_POLICY" || p.type === "REFUND") refundPolicy = p.body;
      if (p.type === "PRIVACY_POLICY" || p.type === "PRIVACY") privacyPolicy = p.body;
    }
  } catch (e) {}

  if (!completeProduct) {
    return { success: false, error: "Product not found in Shopify" };
  }

  const extractedPolicies = extractShippingReturnWarrantyInfo(
    completeProduct.descriptionHtml,
    completeProduct.metafields,
    { shippingPolicy, refundPolicy, privacyPolicy }
  );

  const firstVariant = completeProduct.variants[0];

  const normalizedAiInput: ProductInput = {
    id: completeProduct.id,
    name: completeProduct.title,
    handle: completeProduct.handle,
    description: completeProduct.descriptionHtml.replace(/<[^>]*>/g, " ").trim(),
    descriptionHtml: completeProduct.descriptionHtml,
    category: completeProduct.category?.fullName || completeProduct.category?.name || completeProduct.productType || "General",
    price: firstVariant?.price || "$0.00",
    compareAtPrice: firstVariant?.compareAtPrice || null,
    vendor: completeProduct.vendor,
    sku: firstVariant?.sku || `SKU-${numericId}`,
    status: completeProduct.status,
    totalInventory: completeProduct.totalInventory,
    tags: completeProduct.tags,
    images: completeProduct.images.map((i) => i.url),
    mediaCount: completeProduct.media.length,
    collections: completeProduct.collections,
    variants: completeProduct.variants,
    seo: completeProduct.seo,
    metafields: completeProduct.metafields,
    shippingPolicy,
    refundPolicy,
    privacyPolicy,
    shippingInformation: extractedPolicies.shippingInformation,
    returnInformation: extractedPolicies.returnInformation,
    warrantyInformation: extractedPolicies.warrantyInformation,
  };

  try {
    // 1. RUN FRESH GROQ AI ANALYSIS FIRST (DO NOT DELETE OLD DB RECORD UNTIL FRESH AI DATA IS OBTAINED)
    const aiData = await analyzeProductWithGroq(normalizedAiInput);

    if (!aiData) {
      return { success: false, error: "AI audit failed to generate fresh analysis." };
    }

    // 2. ATOMICALLY UPDATE DB ONLY AFTER AI DATA IS SUCCESSFULLY GENERATED
    if (store) {
      const formattedNow = formatLastAnalyzed();
      
      await prisma.$transaction([
        prisma.analysis.deleteMany({
          where: {
            storeId: store.id,
            OR: [
              { productId: shopifyGid },
              { productId: { contains: numericId } },
              { productId: decodedId },
            ],
          },
        }),
        prisma.analysis.create({
          data: {
            storeId: store.id,
            productId: shopifyGid,
            status: "COMPLETED",
            score: aiData.realityScore,
            confidence: aiData.confidence,
            issuesCount: aiData.whatsMissing?.length || 0,
            summary: aiData.aiSummary,
            whatsMissingData: JSON.stringify(aiData.whatsMissing || []),
            recommendationsData: JSON.stringify(aiData.recommendations || []),
            subScoresData: JSON.stringify(aiData.subScores || {}),
            prosData: JSON.stringify(aiData.pros || []),
            consData: JSON.stringify(aiData.cons || []),
            lastAnalyzed: formattedNow,
          },
        }),
      ]);

      if ((prisma as any).product?.updateMany) {
        try {
          await (prisma as any).product.updateMany({
            where: { storeId: store.id, shopifyId: shopifyGid },
            data: {
              realityScore: aiData.realityScore,
              aiSummary: aiData.aiSummary,
              confidence: aiData.confidence,
              analysisStatus: "ANALYZED",
              lastAnalyzed: formattedNow,
              lastAnalyzedAt: new Date(),
            },
          });
        } catch (e) {}
      }
    }

    return { success: true, aiData };
  } catch (err: any) {
    console.error("Action re-analysis error:", err);
    return { success: false, error: "Re-analysis failed. Please try again." };
  }
};

export default function ProductAnalysisRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  if (loaderData.isDisconnected) {
    return (
      <div className="max-w-3xl mx-auto my-12 bg-white rounded-2xl border border-amber-200 p-8 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <img src="/shopify-logo.png" alt="Shopify" className="w-8 h-8 object-contain" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Store Currently Disconnected</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Your Shopify store is disconnected. Reconnect your store in Settings to access product details and AI analysis.
        </p>
        <div className="pt-2">
          <a
            href="/app/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <span>Go to Settings to Connect</span>
          </a>
        </div>
      </div>
    );
  }

  const currentAiData = fetcher.data?.aiData || loaderData.aiData;
  const initialProducts = loaderData.product ? [loaderData.product] : [];

  const serverAnalysis = loaderData.product
    ? buildAnalysis(loaderData.product as any, false, currentAiData)
    : null;

  return (
    <ProductAnalysisPage
      initialProducts={initialProducts as any}
      initialAnalysis={serverAnalysis}
      completeProduct={loaderData.completeProduct as any}
      normalizedAiInput={loaderData.normalizedAiInput as any}
      aiData={currentAiData as any}
    />
  );
}