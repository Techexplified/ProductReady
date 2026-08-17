import type { ProductItem } from "../../context/ProductContext";
import type { ProductAnalysis } from "./types";
import { buildAnalysis } from "./builder";
import { analyzeProductWithGroq } from "../ai.service";

export * from "./types";

/**
 * Returns stored product analysis deterministically without executing unneeded Groq API calls on GET requests.
 */
export async function fetchProductAnalysis(baseProduct: ProductItem): Promise<ProductAnalysis> {
  return buildAnalysis(baseProduct, false);
}

/**
 * Re-runs the Groq AI analysis pipeline when explicitly requested by user clicking Re-analyze.
 */
export async function reanalyzeProduct(baseProduct: ProductItem): Promise<ProductAnalysis> {
  try {
    const rawAny = baseProduct as any;
    const aiResult = await analyzeProductWithGroq({
      id: baseProduct.id,
      name: baseProduct.name,
      category: baseProduct.category,
      price: baseProduct.price,
      sku: baseProduct.sku,
      description: rawAny.description || "",
      vendor: rawAny.vendor || "",
      images: Array.isArray(rawAny.images) && rawAny.images.length > 0
        ? rawAny.images
        : rawAny.imageUrl
        ? [rawAny.imageUrl]
        : [],
    });
    return buildAnalysis(baseProduct, true, aiResult);
  } catch (error) {
    console.error("reanalyzeProduct error:", error);
    return buildAnalysis(baseProduct, true);
  }
}