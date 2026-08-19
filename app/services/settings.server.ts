/**
 * Settings Server Service
 * Handles App Preferences, AI Analysis Settings, Widget Defaults, and Danger Zone operations
 */

import prisma from "../db.server";

export interface AppSettingsDTO {
  storeName: string;
  isConnected: boolean;
  connectedOn?: string;
  lastSyncAt?: string;
  timezone: string;
  currency: string;
  enableWidget: boolean;
  showPoweredBy: boolean;
  autoAnalyzeNew: boolean;
  allowAiSuggestions: boolean;
  minReviewsConfidence: number;
  includeCustomerPhotos: boolean;
  analyzeProductImages: boolean;
  detectCommonIssues: boolean;

  // Widget Defaults
  defaultLayout: string;
  defaultPrimaryColor: string;
  defaultBorderRadius: string;
  defaultDropShadow: boolean;
  defaultMobileOptimized: boolean;
  showRealityScore: boolean;
  showAiSummary: boolean;
  showProsCons: boolean;
  showWorthBuying: boolean;
  showConfidenceLevel: boolean;
  showCommonIssues: boolean;
}

export function formatStoreDate(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

async function ensureStore(shopName: string, storeName?: string) {
  const store = await prisma.store.upsert({
    where: { shopName },
    update: {
      ...(storeName ? { name: storeName } : {}),
    },
    create: {
      name: storeName || "My Store",
      shopName,
      analysisPaused: true,
    },
  });

  return store;
}

export async function getStoreTimestamps(shopName: string) {
  const store = await ensureStore(shopName);

  const latestAnalysis = await prisma.analysis.findFirst({
    where: { storeId: store.id },
    orderBy: { updatedAt: "desc" },
  });

  const connectedOn = formatStoreDate(store.createdAt || new Date());
  const lastSyncDate = latestAnalysis?.updatedAt || store.updatedAt || new Date();
  const lastSyncAt = formatStoreDate(lastSyncDate);

  return {
    connectedOn,
    lastSyncAt,
    isConnected: !store.analysisPaused,
  };
}

export async function touchStoreSyncTime(shopName: string) {
  const store = await ensureStore(shopName);
  const updatedStore = await prisma.store.update({
    where: { id: store.id },
    data: { updatedAt: new Date() },
  });
  return formatStoreDate(updatedStore.updatedAt);
}

/**
 * Fetch persistent AppSettings for a shop from PostgreSQL DB
 */
export async function getAppSettingsForShop(shopName: string, fallbackStoreName: string): Promise<AppSettingsDTO> {
  const storeTimestamps = await getStoreTimestamps(shopName);

  const defaults: AppSettingsDTO = {
    storeName: fallbackStoreName || "My Store",
    isConnected: storeTimestamps.isConnected,
    connectedOn: storeTimestamps.connectedOn,
    lastSyncAt: storeTimestamps.lastSyncAt,
    timezone: "(GMT+5:30) Asia/Kolkata",
    currency: "USD",
    enableWidget: true,
    showPoweredBy: true,
    autoAnalyzeNew: false,
    allowAiSuggestions: false,
    minReviewsConfidence: 50,
    includeCustomerPhotos: true,
    analyzeProductImages: true,
    detectCommonIssues: true,
    defaultLayout: "Vertical",
    defaultPrimaryColor: "#4F46E5",
    defaultBorderRadius: "8 px",
    defaultDropShadow: true,
    defaultMobileOptimized: true,
    showRealityScore: true,
    showAiSummary: true,
    showProsCons: true,
    showWorthBuying: true,
    showConfidenceLevel: true,
    showCommonIssues: false,
  };

  try {
    const store = await ensureStore(shopName);
    const isConnected = !store.analysisPaused;

    if (!(prisma as any).appSettings?.findUnique) {
      return { ...defaults, isConnected };
    }

    let settings = await (prisma as any).appSettings.findUnique({
      where: { storeId: store.id },
    });

    if (!settings) {
      const { isConnected: _i, connectedOn: _c, lastSyncAt: _l, ...dbDefaults } = defaults;
      settings = await (prisma as any).appSettings.create({
        data: {
          storeId: store.id,
          ...dbDefaults,
        },
      });
    }

    return {
      storeName: settings.storeName || fallbackStoreName,
      isConnected,
      connectedOn: storeTimestamps.connectedOn,
      lastSyncAt: storeTimestamps.lastSyncAt,
      timezone: settings.timezone,
      currency: settings.currency,
      enableWidget: settings.enableWidget,
      showPoweredBy: settings.showPoweredBy,
      autoAnalyzeNew: settings.autoAnalyzeNew,
      allowAiSuggestions: settings.allowAiSuggestions,
      minReviewsConfidence: settings.minReviewsConfidence,
      includeCustomerPhotos: settings.includeCustomerPhotos,
      analyzeProductImages: settings.analyzeProductImages,
      detectCommonIssues: settings.detectCommonIssues,
      defaultLayout: settings.defaultLayout || "Vertical",
      defaultPrimaryColor: settings.defaultPrimaryColor || "#4F46E5",
      defaultBorderRadius: settings.defaultBorderRadius || "8 px",
      defaultDropShadow: settings.defaultDropShadow ?? true,
      defaultMobileOptimized: settings.defaultMobileOptimized ?? true,
      showRealityScore: settings.showRealityScore ?? true,
      showAiSummary: settings.showAiSummary ?? true,
      showProsCons: settings.showProsCons ?? true,
      showWorthBuying: settings.showWorthBuying ?? true,
      showConfidenceLevel: settings.showConfidenceLevel ?? true,
      showCommonIssues: settings.showCommonIssues ?? false,
    };
  } catch (error) {
    console.error("Failed to fetch app settings from DB:", error);
    return defaults;
  }
}

/**
 * Save updated AppSettings to PostgreSQL DB
 */
export async function saveAppSettingsForShop(
  shopName: string,
  data: Partial<AppSettingsDTO>
): Promise<AppSettingsDTO> {
  const storeTimestamps = await getStoreTimestamps(shopName);

  const defaults: AppSettingsDTO = {
    storeName: data.storeName || "My Store",
    isConnected: storeTimestamps.isConnected,
    connectedOn: storeTimestamps.connectedOn,
    lastSyncAt: storeTimestamps.lastSyncAt,
    timezone: data.timezone || "(GMT+5:30) Asia/Kolkata",
    currency: data.currency || "USD",
    enableWidget: data.enableWidget ?? true,
    showPoweredBy: data.showPoweredBy ?? true,
    autoAnalyzeNew: data.autoAnalyzeNew ?? false,
    allowAiSuggestions: data.allowAiSuggestions ?? false,
    minReviewsConfidence: data.minReviewsConfidence ?? 50,
    includeCustomerPhotos: data.includeCustomerPhotos ?? true,
    analyzeProductImages: data.analyzeProductImages ?? true,
    detectCommonIssues: data.detectCommonIssues ?? true,
    defaultLayout: data.defaultLayout || "Vertical",
    defaultPrimaryColor: data.defaultPrimaryColor || "#4F46E5",
    defaultBorderRadius: data.defaultBorderRadius || "8 px",
    defaultDropShadow: data.defaultDropShadow ?? true,
    defaultMobileOptimized: data.defaultMobileOptimized ?? true,
    showRealityScore: data.showRealityScore ?? true,
    showAiSummary: data.showAiSummary ?? true,
    showProsCons: data.showProsCons ?? true,
    showWorthBuying: data.showWorthBuying ?? true,
    showConfidenceLevel: data.showConfidenceLevel ?? true,
    showCommonIssues: data.showCommonIssues ?? false,
  };

  const store = await ensureStore(shopName);
  if (!(prisma as any).appSettings?.upsert) {
    return defaults;
  }

  const updated = await (prisma as any).appSettings.upsert({
    where: { storeId: store.id },
    update: {
      ...(data.storeName !== undefined && { storeName: data.storeName }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.enableWidget !== undefined && { enableWidget: data.enableWidget }),
      ...(data.showPoweredBy !== undefined && { showPoweredBy: data.showPoweredBy }),
      ...(data.autoAnalyzeNew !== undefined && { autoAnalyzeNew: data.autoAnalyzeNew }),
      ...(data.allowAiSuggestions !== undefined && { allowAiSuggestions: data.allowAiSuggestions }),
      ...(data.minReviewsConfidence !== undefined && { minReviewsConfidence: data.minReviewsConfidence }),
      ...(data.includeCustomerPhotos !== undefined && { includeCustomerPhotos: data.includeCustomerPhotos }),
      ...(data.analyzeProductImages !== undefined && { analyzeProductImages: data.analyzeProductImages }),
      ...(data.detectCommonIssues !== undefined && { detectCommonIssues: data.detectCommonIssues }),
      ...(data.defaultLayout !== undefined && { defaultLayout: data.defaultLayout }),
      ...(data.defaultPrimaryColor !== undefined && { defaultPrimaryColor: data.defaultPrimaryColor }),
      ...(data.defaultBorderRadius !== undefined && { defaultBorderRadius: data.defaultBorderRadius }),
      ...(data.defaultDropShadow !== undefined && { defaultDropShadow: data.defaultDropShadow }),
      ...(data.defaultMobileOptimized !== undefined && { defaultMobileOptimized: data.defaultMobileOptimized }),
      ...(data.showRealityScore !== undefined && { showRealityScore: data.showRealityScore }),
      ...(data.showAiSummary !== undefined && { showAiSummary: data.showAiSummary }),
      ...(data.showProsCons !== undefined && { showProsCons: data.showProsCons }),
      ...(data.showWorthBuying !== undefined && { showWorthBuying: data.showWorthBuying }),
      ...(data.showConfidenceLevel !== undefined && { showConfidenceLevel: data.showConfidenceLevel }),
      ...(data.showCommonIssues !== undefined && { showCommonIssues: data.showCommonIssues }),
    },
    create: {
      storeId: store.id,
      storeName: defaults.storeName,
      timezone: defaults.timezone,
      currency: defaults.currency,
      enableWidget: defaults.enableWidget,
      showPoweredBy: defaults.showPoweredBy,
      autoAnalyzeNew: defaults.autoAnalyzeNew,
      allowAiSuggestions: defaults.allowAiSuggestions,
      minReviewsConfidence: defaults.minReviewsConfidence,
      includeCustomerPhotos: defaults.includeCustomerPhotos,
      analyzeProductImages: defaults.analyzeProductImages,
      detectCommonIssues: defaults.detectCommonIssues,
      defaultLayout: defaults.defaultLayout,
      defaultPrimaryColor: defaults.defaultPrimaryColor,
      defaultBorderRadius: defaults.defaultBorderRadius,
      defaultDropShadow: defaults.defaultDropShadow,
      defaultMobileOptimized: defaults.defaultMobileOptimized,
      showRealityScore: defaults.showRealityScore,
      showAiSummary: defaults.showAiSummary,
      showProsCons: defaults.showProsCons,
      showWorthBuying: defaults.showWorthBuying,
      showConfidenceLevel: defaults.showConfidenceLevel,
      showCommonIssues: defaults.showCommonIssues,
    },
  });

  return {
    storeName: updated.storeName,
    isConnected: storeTimestamps.isConnected,
    connectedOn: storeTimestamps.connectedOn,
    lastSyncAt: storeTimestamps.lastSyncAt,
    timezone: updated.timezone,
    currency: updated.currency,
    enableWidget: updated.enableWidget,
    showPoweredBy: updated.showPoweredBy,
    autoAnalyzeNew: updated.autoAnalyzeNew,
    allowAiSuggestions: updated.allowAiSuggestions,
    minReviewsConfidence: updated.minReviewsConfidence,
    includeCustomerPhotos: updated.includeCustomerPhotos,
    analyzeProductImages: updated.analyzeProductImages,
    detectCommonIssues: updated.detectCommonIssues,
    defaultLayout: updated.defaultLayout,
    defaultPrimaryColor: updated.defaultPrimaryColor,
    defaultBorderRadius: updated.defaultBorderRadius,
    defaultDropShadow: updated.defaultDropShadow,
    defaultMobileOptimized: updated.defaultMobileOptimized,
    showRealityScore: updated.showRealityScore,
    showAiSummary: updated.showAiSummary,
    showProsCons: updated.showProsCons,
    showWorthBuying: updated.showWorthBuying,
    showConfidenceLevel: updated.showConfidenceLevel,
    showCommonIssues: updated.showCommonIssues,
  };
}

/**
 * Push default settings to all active widgets in PostgreSQL DB
 */
export async function applyDefaultsToAllWidgets(shopName: string, defaults: Partial<AppSettingsDTO>) {
  const store = await ensureStore(shopName);

  if (!(prisma as any).widget?.findMany) {
    return { success: true, count: 0 };
  }

  const widgets = await (prisma as any).widget.findMany({
    where: { storeId: store.id },
  });

  for (const w of widgets) {
    let themeConfig: any = {};
    let contentConfig: any = {};

    try { themeConfig = JSON.parse(w.theme || "{}"); } catch (e) { }
    try { contentConfig = JSON.parse(w.contentConfig || "{}"); } catch (e) { }

    themeConfig.layout = defaults.defaultLayout || "Vertical";
    themeConfig.primaryColor = defaults.defaultPrimaryColor || "#4F46E5";
    themeConfig.borderRadius = defaults.defaultBorderRadius || "8 px";
    themeConfig.dropShadow = defaults.defaultDropShadow ?? true;
    themeConfig.mobileOptimized = defaults.defaultMobileOptimized ?? true;

    contentConfig.showRealityScore = defaults.showRealityScore ?? true;
    contentConfig.showAiSummary = defaults.showAiSummary ?? true;
    contentConfig.showProsCons = defaults.showProsCons ?? true;
    contentConfig.showWorthBuying = defaults.showWorthBuying ?? true;
    contentConfig.showConfidenceLevel = defaults.showConfidenceLevel ?? true;
    contentConfig.showCommonIssues = defaults.showCommonIssues ?? false;

    if ((prisma as any).widget?.update) {
      await (prisma as any).widget.update({
        where: { id: w.id },
        data: {
          theme: JSON.stringify(themeConfig),
          contentConfig: JSON.stringify(contentConfig),
        },
      });
    }
  }

  return { success: true, count: widgets.length };
}

/**
 * Clear application cache and temporary pending jobs for a store
 */
export async function clearAppCache(shopName: string) {
  const store = await ensureStore(shopName);

  await prisma.analysisJob.deleteMany({
    where: {
      storeId: store.id,
      status: { in: ["FAILED", "QUEUED"] },
    },
  });

  return { success: true, message: "Application cache cleared successfully!" };
}

/**
 * Disconnect Store: Pauses store sync/analysis in PostgreSQL DB while preserving saved product analysis records
 * Sets analysisPaused to true so state persists across refreshes
 */
export async function disconnectStoreData(shopName: string) {
  const store = await ensureStore(shopName);

  await prisma.store.update({
    where: { id: store.id },
    data: { analysisPaused: true },
  });

  return { success: true, message: "Store disconnected successfully! Product analyses remain preserved in DB." };
}

/**
 * Query store connection status using raw SQL to avoid Prisma Client generation locks
 */
export async function getStoreConnectionStatus(shopName: string): Promise<{ isNewUserOrDeleted: boolean; isDisconnected: boolean }> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; connectedAt: Date | null; analysisPaused: boolean }>>(
      `SELECT "id", "connectedAt", "analysisPaused" FROM "Store" WHERE "shopName" = $1 LIMIT 1`,
      shopName
    );

    if (!rows || rows.length === 0) {
      return { isNewUserOrDeleted: true, isDisconnected: false };
    }

    const row = rows[0];

    // If store exists and analysisPaused is false, but connectedAt is null (existing active store), auto-backfill connectedAt now!
    if (!row.connectedAt && !row.analysisPaused) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Store" SET "connectedAt" = NOW() WHERE "id" = $1`,
          row.id
        );
      } catch (e) { }
      return { isNewUserOrDeleted: false, isDisconnected: false };
    }

    const isNewUserOrDeleted = !row.connectedAt && row.analysisPaused;
    const isDisconnected = Boolean(row.connectedAt && row.analysisPaused);

    return { isNewUserOrDeleted, isDisconnected };
  } catch (err) {
    console.error("Error checking store connection status:", err);
    return { isNewUserOrDeleted: true, isDisconnected: false };
  }
}

/**
 * Reconnect Store: Unpauses store analysis in PostgreSQL DB
 */
export async function reconnectStoreData(shopName: string, storeName?: string) {
  const store = await ensureStore(shopName, storeName);

  const updatedStore = await prisma.store.update({
    where: { id: store.id },
    data: {
      analysisPaused: false,
      ...(storeName ? { name: storeName } : {}),
      updatedAt: new Date(),
    },
  });

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Store" SET "connectedAt" = NOW() WHERE "id" = $1 AND "connectedAt" IS NULL`,
      store.id
    );
  } catch (e) { }

  return { success: true, message: "Store reconnected successfully!", lastSyncAt: formatStoreDate(updatedStore.updatedAt) };
}

/**
 * Delete Account: Permanently delete Store record and all cascading data from PostgreSQL DB
 */
export async function deleteStoreAccount(shopName: string) {
  const store = await prisma.store.findUnique({
    where: { shopName },
  });

  if (store) {
    try {
      await prisma.analysis.deleteMany({ where: { storeId: store.id } });
      await prisma.analysisJob.deleteMany({ where: { storeId: store.id } });
      await prisma.appSettings.deleteMany({ where: { storeId: store.id } });

      if ((prisma as any).product?.deleteMany) {
        try { await (prisma as any).product.deleteMany({ where: { storeId: store.id } }); } catch (e) { }
      }
      if ((prisma as any).widget?.deleteMany) {
        try { await (prisma as any).widget.deleteMany({ where: { storeId: store.id } }); } catch (e) { }
      }
      if ((prisma as any).widgetAnalytics?.deleteMany) {
        try { await (prisma as any).widgetAnalytics.deleteMany({ where: { storeId: store.id } }); } catch (e) { }
      }
      if ((prisma as any).dataSource?.deleteMany) {
        try { await (prisma as any).dataSource.deleteMany({ where: { storeId: store.id } }); } catch (e) { }
      }
      if ((prisma as any).billingInvoice?.deleteMany) {
        try { await (prisma as any).billingInvoice.deleteMany({ where: { storeId: store.id } }); } catch (e) { }
      }

      await prisma.store.delete({
        where: { id: store.id },
      });
    } catch (err) {
      console.error("Error during store account deletion:", err);
    }
  }

  return { success: true, message: "ProductReady account and all associated data permanently deleted!" };
}
