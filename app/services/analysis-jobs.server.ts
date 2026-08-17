import prisma from "../db.server";
import { getShopifyProducts } from "./shopify.service.server";

export type AnalysisJobStatus = "NOT_ANALYZED" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface AnalysisDashboardSummary {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
}

export interface AnalysisWorkspaceJob {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  status: AnalysisJobStatus;
  progress: number;
  currentStep: string;
  queuePosition: number | null;
  failureReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
  addedTime: string;
  completedTime: string | null;
  score: number;
}

export interface AnalysisWorkspaceData {
  store: {
    id: string;
    name: string;
    shopName: string;
    analysisPaused: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  summary: AnalysisDashboardSummary;
  jobs: AnalysisWorkspaceJob[];
}

function formatRelativeTime(date: Date) {
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function ensureStore(shopName: string, storeName: string) {
  return prisma.store.upsert({
    where: { shopName },
    update: { name: storeName },
    create: { name: storeName, shopName },
  });
}

export async function prepareAnalysisWorkspace(
  admin: any,
  shopName: string,
  storeName: string
): Promise<AnalysisWorkspaceData> {
  const store = await ensureStore(shopName, storeName);

  // 1. Fetch live products from Shopify Admin GraphQL API
  const { products: shopifyProducts } = await getShopifyProducts(admin, 50);

  // 2. Fetch jobs & analysis records from PostgreSQL
  const [freshStore, jobs, analyses] = await Promise.all([
    prisma.store.findUnique({ where: { id: store.id } }),
    prisma.analysisJob.findMany({
      where: { storeId: store.id },
      orderBy: [{ status: "asc" }, { queuePosition: "asc" }, { createdAt: "asc" }],
    }),
    prisma.analysis.findMany({
      where: { storeId: store.id },
    }),
  ]);

  const analysisMap = new Map(analyses.map((a) => [a.productId, a]));
  const jobMap = new Map(jobs.map((j) => [j.productId, j]));

  // Build workspace jobs for all Shopify products
  const workspaceJobs: AnalysisWorkspaceJob[] = shopifyProducts.map((sp) => {
    const job = jobMap.get(sp.id);
    const analysis = analysisMap.get(sp.id);
    const shortId = sp.id.includes("/") ? sp.id.split("/").pop()! : sp.id;

    let status: AnalysisJobStatus = "NOT_ANALYZED";
    if (job) {
      status = job.status as AnalysisJobStatus;
    } else if (analysis && (analysis.status === "COMPLETED" || analysis.score > 0)) {
      status = "COMPLETED";
    }

    return {
      id: job?.id || `job-${shortId}`,
      productId: sp.id,
      productName: sp.title,
      productImage: sp.featuredImage?.url || null,
      status,
      progress: job?.progress ?? (status === "COMPLETED" ? 100 : 0),
      currentStep: job?.currentStep ?? (status === "COMPLETED" ? "Analysis complete" : "Not started"),
      queuePosition: job?.queuePosition ?? null,
      failureReason: job?.failureReason ?? null,
      startedAt: job?.startedAt ? job.startedAt.toISOString() : null,
      completedAt: job?.completedAt ? job.completedAt.toISOString() : null,
      addedTime: job ? formatRelativeTime(job.createdAt) : "Just now",
      completedTime: job?.completedAt ? formatRelativeTime(job.completedAt) : (analysis ? "Recently" : null),
      score: analysis?.score ?? 0,
    };
  });

  // Calculate summary counts
  const summary: AnalysisDashboardSummary = workspaceJobs.reduce(
    (acc, j) => {
      if (j.status === "QUEUED") acc.queued += 1;
      else if (j.status === "RUNNING") acc.running += 1;
      else if (j.status === "COMPLETED") acc.completed += 1;
      else if (j.status === "FAILED") acc.failed += 1;
      acc.total += 1;
      return acc;
    },
    { queued: 0, running: 0, completed: 0, failed: 0, total: 0 }
  );

  return {
    store: freshStore ?? store,
    summary,
    jobs: workspaceJobs,
  };
}

export async function pauseAnalysis(storeId: string, paused: boolean) {
  await prisma.store.update({
    where: { id: storeId },
    data: { analysisPaused: paused },
  });
}

export async function clearQueuedAnalysisJobs(storeId: string) {
  await prisma.analysisJob.deleteMany({
    where: { storeId, status: "QUEUED" },
  });
}

export async function cancelAnalysisJob(jobId: string) {
  await prisma.analysisJob.deleteMany({
    where: { id: jobId },
  });
}