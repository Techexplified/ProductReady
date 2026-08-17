import prisma from "../db.server";
import { AnalysisJobStatus } from "@prisma/client";
import { analyzeProductWithGroq, extractShippingReturnWarrantyInfo, type ProductInput } from "./ai.service";
import { getShopifyProductWithPolicies } from "./shopify.service.server";

export function formatLastAnalyzed(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export interface AnalysisRecordDTO {
  id?: string;
  storeId?: string;
  productId: string; // "gid://shopify/Product/xxxx"
  status: "NOT_ANALYZED" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  score: number;
  confidence: string; // "High" | "Medium" | "Low" | "—"
  summary?: string | null;
  views: number;
  ctr: string;
  issuesCount: number;
  lastAnalyzed: string;
  whatsMissingData?: string | null;
}

async function ensureStore(shopName: string, storeName: string = "My Store") {
  return prisma.store.upsert({
    where: { shopName },
    update: { name: storeName },
    create: { name: storeName, shopName },
  });
}

export async function createAnalysisJob(shopName: string, productId: string, admin?: any) {
  const store = await ensureStore(shopName);
  const rawNumeric = productId.includes("/") ? productId.split("/").pop()! : productId;
  const shopifyGid = `gid://shopify/Product/${rawNumeric}`;

  const existing = await prisma.analysisJob.findFirst({
    where: {
      storeId: store.id,
      productId: shopifyGid,
    },
  });

  if (existing) {
    const updated = await prisma.analysisJob.update({
      where: { id: existing.id },
      data: {
        status: "QUEUED",
        progress: 0,
        currentStep: "In queue for AI analysis",
        updatedAt: new Date(),
      },
    });
    return { jobId: updated.id, status: "QUEUED" };
  }

  const job = await prisma.analysisJob.create({
    data: {
      storeId: store.id,
      productId: shopifyGid,
      status: "QUEUED",
      progress: 0,
      currentStep: "In queue for AI analysis",
    },
  });

  return { jobId: job.id, status: "QUEUED" };
}

export async function createBulkAnalysisJobs(shopName: string, productIds: string[], admin?: any) {
  const store = await ensureStore(shopName);
  let count = 0;
  for (const id of productIds) {
    await createAnalysisJob(shopName, id, admin);
    count++;
  }
  return { count };
}

/**
 * Fetch all Analysis records from PostgreSQL for a specific shop
 */
export async function getAnalysisRecordsForShop(
  shopName: string
): Promise<Record<string, AnalysisRecordDTO>> {
  try {
    const store = await prisma.store.findUnique({
      where: { shopName },
      include: { analyses: true, analysisJobs: true },
    });

    if (!store) return {};

    const recordMap: Record<string, AnalysisRecordDTO> = {};

    // 1. Process persisted Analysis records
    for (const record of store.analyses) {
      const rawNumeric = record.productId.includes("/") ? record.productId.split("/").pop()! : record.productId;
      const gidKey = `gid://shopify/Product/${rawNumeric}`;

      let parsedIssuesCount = record.issuesCount;
      if (record.whatsMissingData) {
        try {
          const parsed = JSON.parse(record.whatsMissingData);
          if (Array.isArray(parsed)) parsedIssuesCount = parsed.length;
        } catch (e) {}
      }

      const isCompleted = record.status === "COMPLETED" && Boolean(record.score && record.score > 0);

      const dto: AnalysisRecordDTO = {
        id: record.id,
        storeId: record.storeId,
        productId: record.productId,
        status: isCompleted ? "COMPLETED" : (record.status as any),
        score: isCompleted ? record.score : 0,
        confidence: isCompleted ? record.confidence : "—",
        summary: record.summary,
        views: record.views,
        ctr: record.ctr,
        issuesCount: isCompleted ? parsedIssuesCount : 0,
        lastAnalyzed: isCompleted ? (record.lastAnalyzed || "—") : "—",
        whatsMissingData: record.whatsMissingData,
      };

      recordMap[record.productId] = dto;
      recordMap[rawNumeric] = dto;
      recordMap[gidKey] = dto;
    }

    // 2. Overlay pending/running jobs from AnalysisJob table
    for (const job of store.analysisJobs) {
      const rawNumeric = job.productId.includes("/") ? job.productId.split("/").pop()! : job.productId;
      const gidKey = `gid://shopify/Product/${rawNumeric}`;
      const existing = recordMap[job.productId] || recordMap[rawNumeric] || recordMap[gidKey];

      if (!existing || (existing.status !== "COMPLETED" && (job.status === "QUEUED" || job.status === "RUNNING"))) {
        const dto: AnalysisRecordDTO = {
          id: existing?.id,
          storeId: store.id,
          productId: job.productId,
          status: job.status as any,
          score: existing?.score || 0,
          confidence: existing?.confidence || "—",
          summary: existing?.summary,
          views: existing?.views || 0,
          ctr: existing?.ctr || "0.0%",
          issuesCount: existing?.issuesCount || 0,
          lastAnalyzed: existing?.lastAnalyzed || "—",
          whatsMissingData: existing?.whatsMissingData,
        };
        recordMap[job.productId] = dto;
        recordMap[rawNumeric] = dto;
        recordMap[gidKey] = dto;
      }
    }

    return recordMap;
  } catch (error) {
    console.error("Failed to fetch analysis records from PostgreSQL:", error);
    return {};
  }
}

/**
 * Fetch single product Analysis record including detail tabs
 */
export async function getAnalysisRecordByProductId(
  shopName: string,
  productId: string
) {
  try {
    const rawNumeric = productId.includes("/") ? productId.split("/").pop()! : productId;
    const shopifyGid = `gid://shopify/Product/${rawNumeric}`;

    const store = await prisma.store.findUnique({
      where: { shopName },
      include: {
        analyses: {
          where: {
            OR: [
              { productId: shopifyGid },
              { productId: { contains: rawNumeric } },
              { productId },
            ],
          },
        },
      },
    });

    if (!store) return null;

    const analysis = store.analyses[0];
    if (!analysis) return null;

    return {
      id: analysis.id,
      storeId: store.id,
      productId: analysis.productId || shopifyGid,
      status: analysis.status as any,
      score: analysis.score ?? 0,
      confidence: analysis.confidence ?? "High",
      summary: analysis.summary,
      views: analysis.views ?? 140,
      ctr: analysis.ctr ?? "3.2%",
      issuesCount: analysis.issuesCount ?? 0,
      lastAnalyzed: analysis.lastAnalyzed || formatLastAnalyzed(),
      whatsMissingData: analysis.whatsMissingData,
      recommendationsData: analysis.recommendationsData,
      subScoresData: analysis.subScoresData,
      prosData: analysis.prosData,
      consData: analysis.consData,
    };
  } catch (error) {
    console.error("Failed to fetch single analysis record from PostgreSQL:", error);
    return null;
  }
}

/**
 * Execute automatic Groq AI analysis for a product and save results in PostgreSQL DB
 */
export async function runAutoAnalysisForProduct(
  admin: any,
  shopName: string,
  productId: string
) {
  try {
    const rawNumericId = productId.includes("/") ? productId.split("/").pop()! : productId;
    const shopifyGid = `gid://shopify/Product/${rawNumericId}`;

    const activeStore = await prisma.store.findUnique({
      where: { shopName },
    });

    if (!activeStore || !admin) return null;

    const { getShopifyCompleteProduct } = await import("./shopify.service.server");
    const completeProduct = await getShopifyCompleteProduct(admin, shopifyGid);

    if (!completeProduct) return null;

    let shippingPolicy: string | null = null;
    let refundPolicy: string | null = null;
    let privacyPolicy: string | null = null;

    try {
      const shopRes = await admin.graphql(
        `#graphql
          query GetShopPoliciesAutoAnalysis {
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
      sku: firstVariant?.sku || `SKU-${rawNumericId}`,
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

    const aiData = await analyzeProductWithGroq(normalizedAiInput);

    if (aiData) {
      const formattedNow = formatLastAnalyzed();
      await prisma.$transaction([
        prisma.analysis.deleteMany({
          where: {
            storeId: activeStore.id,
            OR: [
              { productId: shopifyGid },
              { productId: { contains: rawNumericId } },
            ],
          },
        }),
        prisma.analysis.create({
          data: {
            storeId: activeStore.id,
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
            lastAnalyzedAt: new Date(),
          },
        }),
      ]);
      return aiData;
    }
  } catch (err) {
    console.error(`runAutoAnalysisForProduct error for ${productId}:`, err);
  }
  return null;
}
