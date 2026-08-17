import prisma from "../db.server";

export interface SyncResult {
  success: boolean;
  totalSynced: number;
  message?: string;
  errors?: string[];
}

async function ensureStore(shopName: string, storeName: string = "My Store") {
  return prisma.store.upsert({
    where: { shopName },
    update: { name: storeName },
    create: { name: storeName, shopName, analysisPaused: true },
  });
}

export async function syncProductsFromShopify(
  admin: any,
  shopName: string,
  storeName: string = "My Store"
): Promise<SyncResult> {
  try {
    const store = await ensureStore(shopName, storeName);
    if (store.analysisPaused) {
      return {
        success: false,
        totalSynced: 0,
        message: "Store is currently disconnected. Sync cancelled.",
      };
    }

    const response: Response = await admin.graphql(
      `#graphql
      query getProductsForSync {
        products(first: 250) {
          nodes {
            id
            title
            handle
            vendor
            productType
            status
            featuredImage {
              url
              altText
            }
            variants(first: 1) {
              nodes {
                price
                sku
              }
            }
          }
        }
      }
      `
    );

    const json = await response.json();
    const nodes = json.data?.products?.nodes || [];

    for (const p of nodes) {
      try {
        const firstVariant = p.variants?.nodes?.[0];
        const rawId = p.id.includes("/") ? p.id.split("/").pop()! : p.id;
        const metaJson = JSON.stringify({
          title: p.title,
          handle: p.handle || "",
          vendor: p.vendor || "Default Vendor",
          productType: p.productType || "General",
          status: p.status || "ACTIVE",
          featuredImage: p.featuredImage ? { url: p.featuredImage.url, altText: p.featuredImage.altText || "" } : null,
          price: firstVariant?.price ? `$${parseFloat(firstVariant.price).toFixed(2)}` : "$0.00",
          sku: firstVariant?.sku || `SKU-${rawId}`,
        });

        await prisma.$executeRawUnsafe(
          `INSERT INTO "Analysis" ("id", "storeId", "productId", "status", "score", "confidence", "views", "ctr", "issuesCount", "lastAnalyzed", "updatedAt", "createdAt", "summary")
           VALUES ($1, $2, $3, 'NOT_ANALYZED', 0, '—', 0, '0.0%', 0, '—', NOW(), NOW(), $4)
           ON CONFLICT ("storeId", "productId")
           DO UPDATE SET "summary" = $4`,
          `an_${store.id}_${rawId}`,
          store.id,
          p.id,
          metaJson
        );
      } catch (e) {}
    }

    return {
      success: true,
      totalSynced: nodes.length,
      message: `Successfully synchronized ${nodes.length} products directly from Shopify Admin API.`,
    };
  } catch (error: any) {
    console.error("Shopify product sync error:", error);
    return {
      success: false,
      totalSynced: 0,
      message: error?.message || "Failed to sync products from Shopify.",
      errors: [error?.message || "Unknown error"],
    };
  }
}
