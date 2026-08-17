/**
 * Legacy Store Products Adapter
 * Wraps shopify.service.server and analysis.service.server for components referencing store-products.
 */

import { getShopifyProducts, createShopifyProduct } from "./shopify.service.server";
import { getAnalysisRecordsForShop, createAnalysisJob, createBulkAnalysisJobs } from "./analysis.service.server";

export interface StoreProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  sku: string;
  score: number;
  status: "Analyzed" | "Queued" | "Running" | "Pending" | "FAILED";
  confidence: string;
  iconType: string;
  views: number;
  ctr: string;
  issuesCount: number;
  lastAnalyzed: string;
  imageUrl?: string | null;
  vendor?: string;
}

export async function getStoreProducts(shopName: string, storeName?: string): Promise<StoreProductItem[]> {
  // In real runtime with admin object, products are loaded via loader using shopify.service.server.
  return [];
}

export async function addStoreProduct(shopName: string, data: any) {
  return null;
}

export async function deleteStoreProduct(shopName: string, productId: string) {
  return null;
}

export async function runAnalysisOnStoreProduct(shopName: string, productId: string) {
  return createAnalysisJob(shopName, productId);
}

export async function runBulkAnalysisOnStoreProducts(shopName: string, productIds: string[]) {
  return createBulkAnalysisJobs(shopName, productIds);
}
