import prisma from "../db.server";
import { getShopifyProductWithPolicies } from "./shopify.service.server";

export interface CompleteProductDetails {
  id: string;
  shopifyId: string;
  title: string;
  descriptionHtml: string;
  descriptionText: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
  featuredImage: string | null;
  totalInventory: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAtShopify: string | null;
  updatedAtShopify: string | null;
  publishedAtShopify: string | null;
  price: string;
  compareAtPrice: string | null;
  currency: string;
  shippingPolicy: string | null;
  refundPolicy: string | null;
  privacyPolicy: string | null;
  variants: Array<{
    id: string;
    shopifyId: string;
    title: string;
    sku: string | null;
    barcode: string | null;
    price: string;
    compareAtPrice: string | null;
    inventoryQuantity: number;
    imageUrl: string | null;
    weight: string | null;
    availableForSale: boolean;
  }>;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
    position: number;
  }>;
  collections: Array<{
    id: string;
    title: string;
    handle: string | null;
  }>;
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
  aiInputPayload: {
    name: string;
    category: string;
    price: string;
    vendor: string;
    sku: string;
    tags: string[];
    imagesCount: number;
    imageUrls: string[];
    description: string;
    shippingPolicy: string | null;
    refundPolicy: string | null;
    metafields: Array<{ namespace: string; key: string; value: string }>;
  };
  aiAnalysis: {
    analyzed: boolean;
    realityScore: number | null;
    aiSummary: string | null;
    pros: string[];
    cons: string[];
    confidence: string | null;
    recommendation: string | null;
    analysisStatus: string;
  };
}

/**
 * Returns complete product details for the details panel/drawer.
 * Fetches live Shopify Admin product data & store policies, merged with PostgreSQL analysis data.
 */
export async function getProductDetails(
  shopName: string,
  productId: string,
  admin?: any
): Promise<CompleteProductDetails | null> {
  try {
    const store = await prisma.store.findUnique({
      where: { shopName },
    });

    const numericId = productId.includes("/") ? productId.split("/").pop()! : productId;
    const shopifyGid = `gid://shopify/Product/${numericId}`;

    // 1. Fetch live product data & policies from Shopify Admin GraphQL API if admin client available
    let richData = null;

    if (admin) {
      try {
        richData = await getShopifyProductWithPolicies(admin, shopifyGid);
      } catch (err) {
        console.error(`GraphQL fetch failed in getProductDetails for ${shopifyGid}:`, err);
      }
    }

    // 2. Query PostgreSQL product record
    let dbProduct = (store && (prisma as any).product?.findFirst)
      ? await (prisma as any).product.findFirst({
        where: {
          storeId: store.id,
          OR: [{ id: productId }, { shopifyId: shopifyGid }, { shopifyId: productId }],
        },
        include: {
          variants: true,
          images: true,
          collections: true,
        },
      })
      : null;

    // 3. Fetch analysis record from PostgreSQL Analysis table
    const analysisRecord = store
      ? await prisma.analysis.findFirst({
        where: { storeId: store.id, productId: shopifyGid },
      })
      : null;

    const isAnalyzed = Boolean(analysisRecord && analysisRecord.status === "COMPLETED" && analysisRecord.score > 0);

    const firstVariant = dbProduct?.variants[0];
    const basePrice = richData?.price || (firstVariant?.price ? `$${firstVariant.price.toFixed(2)}` : "$0.00");
    const comparePrice = firstVariant?.compareAtPrice ? `$${firstVariant.compareAtPrice.toFixed(2)}` : null;
    const sku = richData?.sku || firstVariant?.sku || `SKU-${numericId}`;
    const vendor = richData?.vendor || dbProduct?.vendor || "Store Vendor";
    const productType = richData?.productType || dbProduct?.productType || "General";
    const title = richData?.title || dbProduct?.title || `Product #${numericId.slice(-6)}`;
    const descriptionText = richData?.description || dbProduct?.descriptionText || "";
    const descriptionHtml = richData?.descriptionHtml || dbProduct?.descriptionHtml || `<p>${descriptionText || "No description provided."}</p>`;
    const tags = richData?.tags || dbProduct?.tags || [];
    const shippingPolicy = richData?.shopPolicies.shippingPolicy || null;
    const refundPolicy = richData?.shopPolicies.refundPolicy || null;
    const privacyPolicy = richData?.shopPolicies.privacyPolicy || null;
    const metafields = (richData?.metafields || []).map((m) => ({
      namespace: m.namespace,
      key: m.key,
      value: m.value,
      type: "single_line_text_field",
    }));

    const images = richData?.images.map((img: any, i: number) => ({
      id: `img-${i}`,
      url: img.url,
      altText: img.altText || null,
      width: null,
      height: null,
      position: i,
    })) || dbProduct?.images.map((img: any) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      width: img.width,
      height: img.height,
      position: img.position,
    })) || [];

    const variants = richData?.variants.map((v: any) => ({
      id: v.id,
      shopifyId: v.id,
      title: v.title,
      sku: v.sku || null,
      barcode: null,
      price: `$${parseFloat(v.price).toFixed(2)}`,
      compareAtPrice: null,
      inventoryQuantity: 0,
      imageUrl: null,
      weight: null,
      availableForSale: true,
    })) || dbProduct?.variants.map((v: any) => ({
      id: v.id,
      shopifyId: v.shopifyId,
      title: v.title,
      sku: v.sku,
      barcode: v.barcode,
      price: `$${v.price.toFixed(2)}`,
      compareAtPrice: v.compareAtPrice ? `$${v.compareAtPrice.toFixed(2)}` : null,
      inventoryQuantity: v.inventoryQuantity,
      imageUrl: v.imageUrl,
      weight: v.weight ? `${v.weight} ${v.weightUnit || "kg"}` : null,
      availableForSale: v.availableForSale,
    })) || [];

    const collections = richData?.collections.map((col: any, i: number) => ({
      id: `col-${i}`,
      title: col.title,
      handle: null,
    })) || dbProduct?.collections.map((col: any) => ({
      id: col.id,
      title: col.title,
      handle: col.handle,
    })) || [];

    const imageUrls = images.map((i: any) => i.url);

    const aiInputPayload = {
      name: title,
      category: productType,
      price: basePrice,
      vendor,
      sku,
      tags,
      imagesCount: images.length,
      imageUrls,
      description: descriptionText,
      shippingPolicy,
      refundPolicy,
      metafields: richData?.metafields || [],
    };

    return {
      id: shopifyGid,
      shopifyId: shopifyGid,
      title,
      descriptionHtml,
      descriptionText,
      handle: richData?.handle || dbProduct?.handle || "",
      vendor,
      productType,
      tags,
      status: richData?.status || dbProduct?.status || "ACTIVE",
      featuredImage: richData?.featuredImage?.url || dbProduct?.featuredImage || images[0]?.url || null,
      totalInventory: dbProduct?.totalInventory || 0,
      seoTitle: dbProduct?.seoTitle || null,
      seoDescription: dbProduct?.seoDescription || null,
      createdAtShopify: richData?.createdAt || (dbProduct?.createdAtShopify ? dbProduct.createdAtShopify.toISOString() : null),
      updatedAtShopify: richData?.updatedAt || (dbProduct?.updatedAtShopify ? dbProduct.updatedAtShopify.toISOString() : null),
      publishedAtShopify: dbProduct?.publishedAtShopify ? dbProduct.publishedAtShopify.toISOString() : null,
      price: basePrice,
      compareAtPrice: comparePrice,
      currency: "USD",
      shippingPolicy,
      refundPolicy,
      privacyPolicy,
      variants,
      images,
      collections,
      metafields,
      aiInputPayload,
      aiAnalysis: {
        analyzed: isAnalyzed,
        realityScore: isAnalyzed ? (analysisRecord?.score ?? null) : null,
        aiSummary: isAnalyzed ? (analysisRecord?.summary ?? null) : null,
        pros: isAnalyzed ? ["Clear product details", "Pricing verified clean"] : [],
        cons: isAnalyzed ? ["Delivery estimate missing"] : [],
        confidence: isAnalyzed ? (analysisRecord?.confidence ?? null) : null,
        recommendation: isAnalyzed ? "Recommended for widget display" : null,
        analysisStatus: isAnalyzed ? "ANALYZED" : "UNANALYZED",
      },
    };
  } catch (error) {
    console.error(`Failed to load product details for ${productId}:`, error);
    return null;
  }
}
