import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useLocation } from "react-router";
import {
  ArrowLeft,
  Package,
  FileText,
  Truck,
  RotateCcw,
  Shield,
  Layers,
  Globe,
  Box,
  Info,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import {
  getShopifyCompleteProduct,
  getShopifyProductWithPolicies,
  type ShopifyCompleteProduct,
} from "../services/shopify.service.server";
import { extractShippingReturnWarrantyInfo } from "../services/ai.service";
import prisma from "../db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const rawParamId = params.productId || "";
  const decodedId = decodeURIComponent(rawParamId);
  const numericId = decodedId.includes("/") ? decodedId.split("/").pop()! : decodedId;
  const shopifyGid = `gid://shopify/Product/${numericId}`;

  const store = await prisma.store.findUnique({
    where: { shopName: session.shop },
  });

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

  let completeProduct: ShopifyCompleteProduct | null = null;
  try {
    completeProduct = await getShopifyCompleteProduct(admin, shopifyGid);
  } catch (err) {
    console.error(`GraphQL GetProduct failed for ${shopifyGid}:`, err);
  }

  let shippingPolicy: string | null = null;
  let refundPolicy: string | null = null;
  let privacyPolicy: string | null = null;

  try {
    const shopRes = await admin.graphql(
      `#graphql
        query GetShopPoliciesDetailsSafe {
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
      images: (richData?.images || []).map((img: any, i: number) => ({ id: `img-${i}`, url: img.url, altText: img.altText || null, width: null, height: null })),
      media: [],
      collections: (richData?.collections || []).map((c: any, i: number) => ({ id: `col-${i}`, title: c.title, handle: "" })),
      variants: (richData?.variants || []).map((v: any) => ({
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
      metafields: (richData?.metafields || []).map((m: any, i: number) => ({ id: `mf-${i}`, namespace: m.namespace, key: m.key, value: m.value, type: "single_line_text_field" })),
    };
  }

  const extractedPolicies = extractShippingReturnWarrantyInfo(
    completeProduct.descriptionHtml,
    completeProduct.metafields,
    { shippingPolicy, refundPolicy, privacyPolicy }
  );

  return {
    completeProduct,
    extractedPolicies,
    analysisScore: analysisRecord?.score ?? 82,
  };
};

function formatMetafieldKey(namespace: string, key: string): string {
  let k = key;
  if (k.startsWith("shopify.")) k = k.replace("shopify.", "");
  k = k.replace(/^shopify-/, "");
  k = k.replace(/[-_]/g, " ");
  return k
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ProductDetailsRoute() {
  const { completeProduct, extractedPolicies } = useLoaderData<typeof loader>();
  const location = useLocation();
  const backToProductsPath = `/app/products${location.search}`;

  const [selectedImgUrl, setSelectedImgUrl] = useState<string | null>(
    completeProduct?.featuredImage?.url || completeProduct?.images[0]?.url || null
  );

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 relative pb-24 font-sans text-gray-900">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to={backToProductsPath}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] bg-indigo-50/80 px-3.5 py-2 rounded-xl border border-indigo-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>
      </div>

      {/* Main Product Details Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">PRODUCT DETAILS</h2>
          </div>
        </div>

        {/* Media & Core Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left: Gallery */}
          <div className="space-y-3">
            <div className="aspect-square w-full rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden shadow-2xs flex items-center justify-center">
              {selectedImgUrl ? (
                <img src={selectedImgUrl} alt={completeProduct?.title || "Product"} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-12 h-12 text-gray-300" />
              )}
            </div>

            {/* Thumbnail Carousel */}
            {completeProduct?.images && completeProduct.images.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {completeProduct.images.map((img: any) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImgUrl(img.url)}
                    className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-gray-50 shrink-0 transition-all cursor-pointer ${
                      selectedImgUrl === img.url ? "border-[#4F46E5] ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={img.url} alt={img.altText || "Thumbnail"} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Middle & Right: Basic Info Grid */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-indigo-50 text-indigo-700 font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  {completeProduct?.category?.fullName || completeProduct?.productType || "General"}
                </span>
                <span className="bg-gray-100 text-gray-700 font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-gray-200">
                  Vendor: {completeProduct?.vendor || "N/A"}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    completeProduct?.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  Status: {completeProduct?.status || "ACTIVE"}
                </span>
              </div>

              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-snug pt-1">
                {completeProduct?.title}
              </h1>
              <p className="text-xs text-gray-500 font-mono">Handle: /{completeProduct?.handle || "product"}</p>
            </div>

            {/* Price & Inventory Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Price</span>
                <span className="text-lg font-extrabold text-gray-900">
                  {completeProduct?.variants[0]?.price || "$0.00"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Compare-At</span>
                <span className="text-sm font-bold text-gray-400 line-through">
                  {completeProduct?.variants[0]?.compareAtPrice || "—"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Stock</span>
                <span className={`text-sm font-bold ${(completeProduct?.totalInventory ?? 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {completeProduct?.totalInventory ?? 0} units
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Available for Sale</span>
                <span className="text-sm font-bold text-emerald-600">
                  {completeProduct?.variants[0]?.availableForSale ? "YES" : "NO"}
                </span>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white border border-gray-200 p-2.5 rounded-xl">
                <span className="text-[10px] text-gray-400 font-semibold block">Created At</span>
                <span className="font-bold text-gray-800">
                  {completeProduct?.createdAt ? new Date(completeProduct.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>

              <div className="bg-white border border-gray-200 p-2.5 rounded-xl">
                <span className="text-[10px] text-gray-400 font-semibold block">Updated At</span>
                <span className="font-bold text-gray-800">
                  {completeProduct?.updatedAt ? new Date(completeProduct.updatedAt).toLocaleDateString() : "—"}
                </span>
              </div>

              <div className="bg-white border border-gray-200 p-2.5 rounded-xl">
                <span className="text-[10px] text-gray-400 font-semibold block">Published At</span>
                <span className="font-bold text-gray-800">
                  {completeProduct?.publishedAt ? new Date(completeProduct.publishedAt).toLocaleDateString() : "Live"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description HTML Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Product Description</span>
          </h3>
          <div
            className="text-xs text-gray-700 leading-relaxed max-h-64 overflow-y-auto pr-2 border-t border-gray-100 pt-3 prose prose-xs"
            dangerouslySetInnerHTML={{ __html: completeProduct?.descriptionHtml || "<p>No description provided.</p>" }}
          />
        </div>

        {/* Extracted Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-gray-50/80 border border-gray-200 p-4 rounded-2xl space-y-1.5">
            <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Shipping Information</span>
            </h4>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              {extractedPolicies.shippingInformation}
            </p>
          </div>

          <div className="bg-gray-50/80 border border-gray-200 p-4 rounded-2xl space-y-1.5">
            <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>Return Information</span>
            </h4>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              {extractedPolicies.returnInformation}
            </p>
          </div>

          <div className="bg-gray-50/80 border border-gray-200 p-4 rounded-2xl space-y-1.5">
            <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Warranty Information</span>
            </h4>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              {extractedPolicies.warrantyInformation}
            </p>
          </div>
        </div>

        {/* Variants Table */}
        {completeProduct?.variants && completeProduct.variants.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs space-y-2">
            <div className="p-4 bg-gray-50/60 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-xs">Product Variants ({completeProduct.variants.length})</h3>
              <span className="text-[11px] text-gray-400">Inventory breakdown per variant</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/30 text-gray-500 font-semibold text-[10px] uppercase">
                    <th className="py-2.5 pl-4 pr-2">Variant Title</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Barcode</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Compare At</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 pr-4 text-right">Sale Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completeProduct.variants.map((v: any) => (
                    <tr key={v.id} className="hover:bg-gray-50/50">
                      <td className="py-3 pl-4 pr-2 font-bold text-gray-900">{v.title}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-600">{v.sku || "—"}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-400">{v.barcode || "—"}</td>
                      <td className="py-3 px-3 font-bold text-gray-900">{v.price}</td>
                      <td className="py-3 px-3 text-gray-400">{v.compareAtPrice || "—"}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">{v.inventoryQuantity} units</td>
                      <td className="py-3 pr-4 text-right">
                        {v.availableForSale ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">In Stock</span>
                        ) : (
                          <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">Out of Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Collections, SEO & Metafields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Collections ({completeProduct?.collections.length ?? 0})</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {completeProduct?.collections && completeProduct.collections.length > 0 ? (
                completeProduct.collections.map((col: any) => (
                  <span key={col.id} className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-100 text-[11px]">
                    {col.title} ({col.handle})
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No collections assigned</span>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>SEO Information</span>
            </h4>
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
              <span className="font-bold text-indigo-700 block truncate">{completeProduct?.seo?.title || completeProduct?.title}</span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {completeProduct?.seo?.description || "No search engine meta description specified."}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            {(() => {
              const allMf = completeProduct?.metafields || [];
              const productMf = allMf.filter((m: any) => m.key !== "unavailable_reason" && !m.key.includes("unavailable"));

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                      <Box className="w-4 h-4 text-indigo-600" />
                      <span>Product & Category Metafields ({productMf.length})</span>
                    </h4>
                    {productMf.length > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        {productMf.length} Active
                      </span>
                    )}
                  </div>

                  {/* Product & Category Metafields */}
                  {productMf.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                      {productMf.map((m: any, idx: number) => (
                        <div key={m.id || `pmf-${idx}`} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#4F46E5] font-extrabold text-[11px] font-sans">
                              {formatMetafieldKey(m.namespace, m.key)}
                            </span>
                            <span className="text-[9px] text-gray-400 font-sans bg-white px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                              {m.namespace === "shopify" ? "Category Metafield" : "Custom Metafield"}
                            </span>
                          </div>
                          <p className="text-gray-900 font-semibold text-[11px] font-sans break-words">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-dashed border-gray-200 text-center space-y-0.5">
                      <p className="text-gray-500 font-medium text-[11px]">No product or category metafields attached.</p>
                      <p className="text-gray-400 text-[10px]">
                        Metafields saved in Shopify Admin will automatically appear here.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
