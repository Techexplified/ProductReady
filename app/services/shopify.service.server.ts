export interface ShopifyProductItem {
  id: string; // "gid://shopify/Product/123456"
  title: string;
  handle: string;
  vendor: string;
  productType?: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  featuredImage: {
    url: string;
    altText?: string;
  } | null;
  price: string;
  sku: string;
}

export interface ShopifyProductDetail extends ShopifyProductItem {
  description: string;
  tags: string[];
  productType: string;
  images: Array<{ url: string; altText?: string }>;
  collections: Array<{ title: string }>;
  variants: Array<{ id: string; title: string; price: string; sku: string }>;
}

export interface ShopifyPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

/**
 * Fetch list of products from Shopify Admin GraphQL API
 */
export async function getShopifyProducts(
  admin: any,
  first: number = 20,
  after?: string | null
): Promise<{ products: ShopifyProductItem[]; pageInfo: ShopifyPageInfo }> {
  try {
    const response = await admin.graphql(
      `#graphql
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              cursor
              node {
                id
                title
                handle
                vendor
                productType
                status
                updatedAt
                createdAt
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
            pageInfo {
              hasNextPage
              hasPreviousPage
              endCursor
              startCursor
            }
          }
        }
      `,
      {
        variables: {
          first,
          after: after || null,
        },
      }
    );

    const { data } = await response.json();
    const edges = data?.products?.edges || [];
    const pageInfo = data?.products?.pageInfo || {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    };

    const products: ShopifyProductItem[] = edges.map((edge: any) => {
      const node = edge.node;
      const firstVariant = node.variants?.nodes?.[0];
      return {
        id: node.id,
        title: node.title,
        handle: node.handle || "",
        vendor: node.vendor || "Default Vendor",
        productType: node.productType || "General",
        status: node.status || "ACTIVE",
        updatedAt: node.updatedAt || new Date().toISOString(),
        createdAt: node.createdAt || new Date().toISOString(),
        featuredImage: node.featuredImage
          ? { url: node.featuredImage.url, altText: node.featuredImage.altText || "" }
          : null,
        price: firstVariant?.price ? `$${parseFloat(firstVariant.price).toFixed(2)}` : "$0.00",
        sku: firstVariant?.sku || `SKU-${node.id.split("/").pop()}`,
      };
    });

    return { products, pageInfo };
  } catch (error) {
    console.error("Failed to fetch products from Shopify GraphQL:", error);
    return {
      products: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
  }
}

/**
 * Fetch full details of a single product from Shopify Admin GraphQL API
 */
export async function getShopifyProductById(
  admin: any,
  productId: string
): Promise<ShopifyProductDetail | null> {
  try {
    const formattedId = productId.startsWith("gid://shopify/Product/")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const response = await admin.graphql(
      `#graphql
        query getProductById($id: ID!) {
          product(id: $id) {
            id
            title
            handle
            description
            vendor
            productType
            status
            tags
            updatedAt
            createdAt
            featuredImage {
              url
              altText
            }
            images(first: 10) {
              nodes {
                url
                altText
              }
            }
            collections(first: 5) {
              nodes {
                title
              }
            }
            variants(first: 10) {
              nodes {
                id
                title
                price
                sku
              }
            }
          }
        }
      `,
      {
        variables: {
          id: formattedId,
        },
      }
    );

    const { data } = await response.json();
    const node = data?.product;

    if (!node) return null;

    const firstVariant = node.variants?.nodes?.[0];

    return {
      id: node.id,
      title: node.title,
      handle: node.handle || "",
      description: node.description || "",
      vendor: node.vendor || "",
      productType: node.productType || "",
      status: node.status || "ACTIVE",
      tags: node.tags || [],
      updatedAt: node.updatedAt,
      createdAt: node.createdAt,
      featuredImage: node.featuredImage
        ? { url: node.featuredImage.url, altText: node.featuredImage.altText || "" }
        : null,
      images: (node.images?.nodes || []).map((img: any) => ({
        url: img.url,
        altText: img.altText || "",
      })),
      collections: (node.collections?.nodes || []).map((col: any) => ({
        title: col.title,
      })),
      variants: (node.variants?.nodes || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        price: v.price,
        sku: v.sku || "",
      })),
      price: firstVariant?.price ? `$${parseFloat(firstVariant.price).toFixed(2)}` : "$0.00",
      sku: firstVariant?.sku || `SKU-${node.id.split("/").pop()}`,
    };
  } catch (error) {
    console.error(`Failed to fetch product ${productId} from Shopify GraphQL:`, error);
    return null;
  }
}

export interface ShopifyProductWithPolicies extends ShopifyProductDetail {
  descriptionHtml: string;
  metafields: Array<{ namespace: string; key: string; value: string }>;
  shopPolicies: {
    name: string;
    shippingPolicy: string | null;
    refundPolicy: string | null;
    privacyPolicy: string | null;
  };
}

export function resolveMetafieldDisplayValue(mf: any): string {
  if (!mf) return "";

  if (mf.references?.nodes && mf.references.nodes.length > 0) {
    const labels = mf.references.nodes.map((node: any) => {
      const labelField = node.fields?.find((f: any) => f.key === "label" || f.key === "name" || f.key === "title");
      if (labelField?.value) return labelField.value;
      if (node.handle) {
        return node.handle
          .split("-")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
      return node.id;
    });
    return labels.join(", ");
  }

  if (mf.reference) {
    const labelField = mf.reference.fields?.find((f: any) => f.key === "label" || f.key === "name" || f.key === "title");
    if (labelField?.value) return labelField.value;
    if (mf.reference.handle) {
      return mf.reference.handle
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  const rawValue = mf.value != null ? String(mf.value) : "";
  if (rawValue.startsWith("[\"gid://") || rawValue.startsWith("gid://")) {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.map((gid: string) => gid.split("/").pop()).join(", ");
      }
    } catch (e) {}
  }
  return rawValue;
}

/**
 * Fetch full details of a single product AND store policies (shipping, refund, privacy) from Shopify Admin GraphQL API
 */
export async function getShopifyProductWithPolicies(
  admin: any,
  productId: string
): Promise<ShopifyProductWithPolicies | null> {
  try {
    const formattedId = productId.startsWith("gid://shopify/Product/")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const response = await admin.graphql(
      `#graphql
        query getProductWithPolicies($id: ID!) {
          product(id: $id) {
            id
            title
            handle
            description
            descriptionHtml
            vendor
            productType
            status
            tags
            updatedAt
            createdAt
            featuredImage {
              url
              altText
            }
            images(first: 25) {
              nodes {
                url
                altText
              }
            }
            collections(first: 10) {
              nodes {
                title
              }
            }
            variants(first: 25) {
              nodes {
                id
                title
                price
                sku
              }
            }
            metafields(first: 50) {
              nodes {
                id
                namespace
                key
                value
                type
                reference {
                  ... on Metaobject {
                    id
                    type
                    handle
                    fields {
                      key
                      value
                    }
                  }
                }
                references(first: 10) {
                  nodes {
                    ... on Metaobject {
                      id
                      type
                      handle
                      fields {
                        key
                        value
                      }
                    }
                  }
                }
              }
            }
          }
          shop {
            name
          }
        }
      `,
      {
        variables: {
          id: formattedId,
        },
      }
    );

    const { data } = await response.json();
    const node = data?.product;
    const shopName = data?.shop?.name || "My Store";

    if (!node) return null;

    // Safely query shop policies in a separate request so permission errors never crash product loading
    let shippingPolicy: string | null = null;
    let refundPolicy: string | null = null;
    let privacyPolicy: string | null = null;

    try {
      const policyRes = await admin.graphql(
        `#graphql
          query GetShopPoliciesSafe {
            shop {
              shopPolicies {
                body
                type
              }
            }
          }
        `
      );
      const policyJson = await policyRes.json();
      const policies = policyJson?.data?.shop?.shopPolicies || [];
      for (const p of policies) {
        if (p.type === "SHIPPING_POLICY" || p.type === "SHIPPING") shippingPolicy = p.body;
        if (p.type === "REFUND_POLICY" || p.type === "REFUND") refundPolicy = p.body;
        if (p.type === "PRIVACY_POLICY" || p.type === "PRIVACY") privacyPolicy = p.body;
      }
    } catch (policyErr) {
      // Policies optional
    }

    const firstVariant = node.variants?.nodes?.[0];

    return {
      id: node.id,
      title: node.title,
      handle: node.handle || "",
      description: node.description || "",
      descriptionHtml: node.descriptionHtml || "",
      vendor: node.vendor || "",
      productType: node.productType || "",
      status: node.status || "ACTIVE",
      tags: node.tags || [],
      updatedAt: node.updatedAt,
      createdAt: node.createdAt,
      featuredImage: node.featuredImage
        ? { url: node.featuredImage.url, altText: node.featuredImage.altText || "" }
        : null,
      images: (node.images?.nodes || []).map((img: any) => ({
        url: img.url,
        altText: img.altText || "",
      })),
      collections: (node.collections?.nodes || []).map((col: any) => ({
        title: col.title,
      })),
      variants: (node.variants?.nodes || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        price: v.price,
        sku: v.sku || "",
      })),
      metafields: (node.metafields?.nodes || []).map((m: any) => ({
        namespace: m.namespace,
        key: m.key,
        value: resolveMetafieldDisplayValue(m),
      })),
      shopPolicies: {
        name: shopName,
        shippingPolicy,
        refundPolicy,
        privacyPolicy,
      },
      price: firstVariant?.price ? `$${parseFloat(firstVariant.price).toFixed(2)}` : "$0.00",
      sku: firstVariant?.sku || `SKU-${node.id.split("/").pop()}`,
    };
  } catch (error) {
    console.error(`Failed to fetch product & policies for ${productId} from Shopify GraphQL:`, error);
    return null;
  }
}

/**
 * Execute productCreate mutation directly in Shopify Admin GraphQL API
 */
export async function createShopifyProduct(
  admin: any,
  input: {
    title: string;
    vendor?: string;
    productType?: string;
    price?: string;
    sku?: string;
    status?: string;
  }
): Promise<{ success: boolean; product?: ShopifyProductItem; errors?: string[] }> {
  try {
    const rawPrice = (input.price || "0.00").replace(/[^0-9.]/g, "");
    const formattedPrice = isNaN(parseFloat(rawPrice)) ? "0.00" : parseFloat(rawPrice).toFixed(2);

    const response = await admin.graphql(
      `#graphql
        mutation createProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              handle
              vendor
              status
              updatedAt
              createdAt
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
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: {
            title: input.title,
            vendor: input.vendor || "Store Vendor",
            productType: input.productType || "General",
            status: input.status ? input.status.toUpperCase() : "ACTIVE",
            variants: [
              {
                price: formattedPrice,
                sku: input.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              },
            ],
          },
        },
      }
    );

    const { data } = await response.json();
    const result = data?.productCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      return {
        success: false,
        errors: result.userErrors.map((err: any) => `${err.field}: ${err.message}`),
      };
    }

    const node = result?.product;
    if (!node) {
      return { success: false, errors: ["Failed to create product in Shopify."] };
    }

    const firstVariant = node.variants?.nodes?.[0];

    const createdProduct: ShopifyProductItem = {
      id: node.id,
      title: node.title,
      handle: node.handle || "",
      vendor: node.vendor || "Store Vendor",
      status: node.status || "ACTIVE",
      updatedAt: node.updatedAt || new Date().toISOString(),
      createdAt: node.createdAt || new Date().toISOString(),
      featuredImage: node.featuredImage
        ? { url: node.featuredImage.url, altText: node.featuredImage.altText || "" }
        : null,
      price: firstVariant?.price ? `$${parseFloat(firstVariant.price).toFixed(2)}` : "$0.00",
      sku: firstVariant?.sku || `SKU-${node.id.split("/").pop()}`,
    };

    return { success: true, product: createdProduct };
  } catch (error: any) {
    console.error("Failed to execute productCreate mutation in Shopify:", error);
    return { success: false, errors: [error?.message || "Failed to create product in Shopify."] };
  }
}

export interface ShopifyCompleteProduct {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  category: {
    id: string;
    name: string;
    fullName: string;
  } | null;
  seo: {
    title: string | null;
    description: string | null;
  } | null;
  totalInventory: number;
  featuredImage: {
    id: string;
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  }>;
  media: Array<{
    mediaContentType: string;
    alt: string | null;
    id?: string;
    image?: {
      url: string;
      altText: string | null;
      width: number | null;
      height: number | null;
    };
  }>;
  collections: Array<{
    id: string;
    title: string;
    handle: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    sku: string | null;
    barcode: string | null;
    price: string;
    compareAtPrice: string | null;
    inventoryQuantity: number;
    availableForSale: boolean;
    selectedOptions: Array<{ name: string; value: string }>;
    image: { id: string; url: string; altText: string | null } | null;
  }>;
  metafields: Array<{
    id: string;
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
}

/**
 * Fetch complete product with all fields, media, variants, category, SEO and metafields
 * using Shopify Admin GraphQL API.
 */
export async function getShopifyCompleteProduct(
  admin: any,
  productId: string
): Promise<ShopifyCompleteProduct | null> {
  try {
    const formattedId = productId.startsWith("gid://shopify/Product/")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const response = await admin.graphql(
      `#graphql
        query GetProduct($id: ID!) {
          product(id: $id) {
            id
            title
            handle
            descriptionHtml
            status
            vendor
            productType
            tags
            createdAt
            updatedAt
            publishedAt

            category {
              id
              name
              fullName
            }

            seo {
              title
              description
            }

            totalInventory

            featuredImage {
              id
              url
              altText
              width
              height
            }

            images(first: 50) {
              nodes {
                id
                url
                altText
                width
                height
              }
            }

            media(first: 50) {
              nodes {
                mediaContentType
                alt

                ... on MediaImage {
                  id
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }

            collections(first: 50) {
              nodes {
                id
                title
                handle
              }
            }

            variants(first: 100) {
              nodes {
                id
                title
                sku
                barcode
                price
                compareAtPrice
                inventoryQuantity
                availableForSale

                selectedOptions {
                  name
                  value
                }

                image {
                  id
                  url
                  altText
                }
              }
            }

            metafields(first: 50) {
              nodes {
                id
                namespace
                key
                value
                type
                reference {
                  ... on Metaobject {
                    id
                    type
                    handle
                    fields {
                      key
                      value
                    }
                  }
                }
                references(first: 10) {
                  nodes {
                    ... on Metaobject {
                      id
                      type
                      handle
                      fields {
                        key
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          id: formattedId,
        },
      }
    );

    const { data } = await response.json();
    const product = data?.product;
    if (!product) return null;

    return {
      id: product.id,
      title: product.title || "",
      handle: product.handle || "",
      descriptionHtml: product.descriptionHtml || "",
      status: product.status || "ACTIVE",
      vendor: product.vendor || "N/A",
      productType: product.productType || "General",
      tags: product.tags || [],
      createdAt: product.createdAt || "",
      updatedAt: product.updatedAt || "",
      publishedAt: product.publishedAt || null,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            fullName: product.category.fullName,
          }
        : null,
      seo: product.seo
        ? {
            title: product.seo.title || null,
            description: product.seo.description || null,
          }
        : null,
      totalInventory: product.totalInventory ?? 0,
      featuredImage: product.featuredImage
        ? {
            id: product.featuredImage.id,
            url: product.featuredImage.url,
            altText: product.featuredImage.altText || null,
            width: product.featuredImage.width || null,
            height: product.featuredImage.height || null,
          }
        : null,
      images: (product.images?.nodes || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || null,
        width: img.width || null,
        height: img.height || null,
      })),
      media: (product.media?.nodes || []).map((m: any) => ({
        mediaContentType: m.mediaContentType || "IMAGE",
        alt: m.alt || null,
        id: m.id || undefined,
        image: m.image
          ? {
              url: m.image.url,
              altText: m.image.altText || null,
              width: m.image.width || null,
              height: m.image.height || null,
            }
          : undefined,
      })),
      collections: (product.collections?.nodes || []).map((col: any) => ({
        id: col.id,
        title: col.title,
        handle: col.handle || "",
      })),
      variants: (product.variants?.nodes || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku || null,
        barcode: v.barcode || null,
        price: v.price ? `$${parseFloat(v.price).toFixed(2)}` : "$0.00",
        compareAtPrice: v.compareAtPrice ? `$${parseFloat(v.compareAtPrice).toFixed(2)}` : null,
        inventoryQuantity: v.inventoryQuantity ?? 0,
        availableForSale: Boolean(v.availableForSale),
        selectedOptions: (v.selectedOptions || []).map((opt: any) => ({
          name: opt.name,
          value: opt.value,
        })),
        image: v.image
          ? {
              id: v.image.id,
              url: v.image.url,
              altText: v.image.altText || null,
            }
          : null,
      })),
      metafields: (product.metafields?.nodes || []).map((mf: any) => ({
        id: mf.id,
        namespace: mf.namespace,
        key: mf.key,
        value: resolveMetafieldDisplayValue(mf),
        type: mf.type || "single_line_text_field",
      })),
    };
  } catch (error) {
    console.error(`Failed to fetch complete product for ${productId} from Shopify GraphQL:`, error);
    return null;
  }
}

