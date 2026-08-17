import type { ProductItem } from "../../context/ProductContext";
import type {
  AiVerification,
  ConfidenceLevel,
  CustomerImage,
  DataSourceItem,
  ProductAnalysis,
  ReviewItem,
  VisualVerification,
} from "./types";
import {
  AUTHOR_FIRST,
  AUTHOR_LAST,
  BEST_FOR_POOL,
  CONS_POOL,
  DATA_SOURCES,
  IMAGE_ANGLES,
  IMAGE_LABELS,
  IMAGE_SOURCES,
  ISSUE_POOL,
  NOT_IDEAL_POOL,
  PROS_POOL,
  REVIEW_TEMPLATES,
  SUGGESTION_POOL,
  SUMMARY_PART1,
  SUMMARY_PART2,
  SUMMARY_PART3,
  SUMMARY_PART4,
  VERDICT_POOL,
  WORTH_BUYING_SUMMARY_POOL,
} from "./content";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Deterministic seeded random so each product shows stable data on re-render. */
function createRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function chance(rng: () => number, probability: number) {
  return rng() < probability;
}

import type { AiProductAnalysisResult } from "../ai.service";

// ---------------------------------------------------------------------------
// Analysis builder
// ---------------------------------------------------------------------------

export function buildAnalysis(
  base: ProductItem,
  isReanalysis = false,
  aiData?: AiProductAnalysisResult
): ProductAnalysis {
  const rng = createRng(`${base.id}-${base.name}`);
  const score = clamp(
    aiData?.trustScore ?? (isReanalysis ? Math.min(99, base.score + Math.floor(rng() * 3) + 1) : base.score),
    0,
    100
  );

  const confidence: ConfidenceLevel = aiData?.confidence ?? (score >= 85 ? "High" : score >= 65 ? "Medium" : "Low");
  const starRating = parseFloat(((score / 100) * 5).toFixed(1));

  // ---- Common issues -------------------------------------------------------
  const issuePool = [...ISSUE_POOL];
  const issueCount = 3 + Math.floor(rng() * 2);
  const commonIssues = [];
  for (let i = 0; i < issueCount && issuePool.length > 0; i++) {
    const idx = Math.floor(rng() * issuePool.length);
    const [issue] = issuePool.splice(idx, 1);
    const scaled = clamp(Math.round((issue.base * (110 - score)) / 30), 4, 62);
    const jitter = Math.max(0, scaled + Math.floor(rng() * 9) - 4);
    commonIssues.push({ title: issue.title, percentage: jitter });
  }
  commonIssues.sort((a, b) => b.percentage - a.percentage);

  // ---- Sentiment -----------------------------------------------------------
  const positiveRatio = clamp(0.55 + (score / 100) * 0.38, 0.5, 0.93);
  const negativeRatio = clamp(0.4 - (score / 100) * 0.28, 0.03, 0.2);
  const neutralRatio = 1 - positiveRatio - negativeRatio;

  const sentiment = {
    positive: Math.round(positiveRatio * 100),
    neutral: Math.round(neutralRatio * 100),
    negative: Math.round(negativeRatio * 100),
  };

  // ---- Pros / cons ---------------------------------------------------------
  const pros = [...PROS_POOL].sort(() => rng() - 0.5).slice(0, 4 + Math.floor(rng() * 2));
  const cons =
    score >= 80
      ? [...CONS_POOL].sort(() => rng() - 0.5).slice(0, 2 + Math.floor(rng() * 2))
      : [...CONS_POOL].sort(() => rng() - 0.5).slice(0, 3 + Math.floor(rng() * 2));

  // ---- Worth buying --------------------------------------------------------
  const recommendation = score >= 70 ? "YES" : "NO";
  const verdict = VERDICT_POOL[score >= 80 ? 0 : score >= 70 ? 1 : score >= 55 ? 2 : 3];
  const bestFor = pick(rng, BEST_FOR_POOL);
  const notIdealFor = pick(rng, NOT_IDEAL_POOL);
  const worthSummary = pick(rng, WORTH_BUYING_SUMMARY_POOL);

  // ---- Confidence details --------------------------------------------------
  const reviewsAnalyzed = 40 + Math.floor(rng() * 140) + Math.round(score * 1.2);
  const customerImages = 18 + Math.floor(rng() * 60);

  const visualVerification: VisualVerification =
    score >= 82 ? "Passed" : score >= 60 ? "Needs Review" : "Failed";
  const aiVerification: AiVerification =
    score >= 82 ? "Verified" : score >= 60 ? "Pending" : "Failed";

  // ---- AI summary ----------------------------------------------------------
  const aiSummary = [
    pick(rng, SUMMARY_PART1)
      .replace("{name}", base.name)
      .replace("{reviews}", String(reviewsAnalyzed))
      .replace("{images}", String(customerImages)),
    pick(rng, SUMMARY_PART2),
    pick(rng, SUMMARY_PART3)
      .replace("{issue1}", commonIssues[0]?.title.toLowerCase() ?? "minor details")
      .replace("{issue2}", commonIssues[1]?.title.toLowerCase() ?? "packaging"),
    pick(rng, SUMMARY_PART4)
      .replace("{verdict}", verdict)
      .replace("{score}", String(score))
      .replace("{confidence}", confidence.toLowerCase())
      .replace("{name}", base.name),
  ].join(" ");

  // ---- Value for money -----------------------------------------------------
  const valueForMoney = {
    overall: clamp(Math.round((score / 10) * 10) / 10 + (rng() * 0.6 - 0.3), 3.5, 9.9),
    quality: clamp(Math.round((score / 10) * 10) / 10 + (rng() * 0.6 - 0.3), 3.5, 9.9),
    accuracy: clamp(Math.round(((score + 4) / 10) * 10) / 10 + (rng() * 0.4 - 0.2), 3.5, 9.9),
    shipping: clamp(8.2 + rng() * 1.4 - 0.7, 3.5, 9.9),
  };

  // ---- Score breakdown -----------------------------------------------------
  const scoreBreakdown = [
    { label: "Description Accuracy", value: clamp(score + Math.round(rng() * 8 - 4), 10, 99), weight: 30 },
    { label: "Image Authenticity", value: clamp(score + Math.round(rng() * 8 - 4), 10, 99), weight: 25 },
    { label: "Review Legitimacy", value: clamp(score + Math.round(rng() * 10 - 5), 10, 99), weight: 30 },
    { label: "Shipping Reliability", value: clamp(score + Math.round(rng() * 12 - 6), 10, 99), weight: 15 },
  ];

  // ---- Sample reviews ------------------------------------------------------
  const reviews: ReviewItem[] = [];
  for (let i = 0; i < 8; i++) {
    const template = pick(rng, REVIEW_TEMPLATES);
    const rating =
      template.sentiment === "Positive"
        ? 4 + (chance(rng, 0.6) ? 1 : 0)
        : template.sentiment === "Neutral"
          ? 3 + (chance(rng, 0.5) ? 1 : 0)
          : 2 + (chance(rng, 0.4) ? 1 : 0);

    const firstName = pick(rng, AUTHOR_FIRST);
    const lastName = pick(rng, AUTHOR_LAST);

    reviews.push({
      id: `rv-${base.id}-${i + 1}`,
      author: `${firstName} ${lastName[0]}.`,
      rating,
      title: template.title,
      body: template.body,
      date: `${1 + Math.floor(rng() * 28)} days ago`,
      helpfulCount: Math.floor(rng() * 45) + 3,
      verified: chance(rng, score >= 75 ? 0.85 : 0.6),
      sentiment: template.sentiment,
    });
  }

  // ---- Customer images -----------------------------------------------------
  const verifiedRatio = clamp(0.65 + (score / 100) * 0.3, 0.5, 0.95);
  const images: CustomerImage[] = IMAGE_LABELS.map((label, i) => {
    const roll = rng();
    const verification =
      roll < verifiedRatio ? "Verified" : roll < verifiedRatio + 0.12 ? "Suspicious" : "Failed";
    return {
      id: `img-${base.id}-${i + 1}`,
      label,
      source: pick(rng, IMAGE_SOURCES),
      verification,
      angle: pick(rng, IMAGE_ANGLES),
      detectedLabel:
        verification === "Verified"
          ? `HasDetected / ${base.category}`
          : verification === "Suspicious"
            ? "ObjectMatch 88%"
            : "NoMatch",
    };
  });

  // ---- Suggestions ---------------------------------------------------------
  const suggestions = [...SUGGESTION_POOL]
    .sort(() => rng() - 0.5)
    .slice(0, 4)
    .map((s, i) => ({ ...s, id: `sg-${base.id}-${i + 1}` }))
    .sort((a, b) => (a.impact === "High" ? -1 : 1) - (b.impact === "High" ? -1 : 1));

  // ---- Data sources --------------------------------------------------------
  const dataSources: DataSourceItem[] = DATA_SOURCES.map((ds, i) => ({
    ...ds,
    id: `${ds.id}-${base.id}`,
    lastSynced: `${i + 1}h ago`,
    status: (i === 2 ? "Syncing" : "Connected") as DataSourceItem["status"],
  }));

  return {
    id: base.id,
    name: base.name,
    category: base.category,
    price: base.price,
    sku: base.sku,
    status: isReanalysis ? "Analyzed" : base.status === "Active" || base.status === "Completed" ? "Analyzed" : "Processing",
    lastAnalyzed: isReanalysis ? "Just now" : base.lastAnalyzed,
    lastAnalyzedTimestamp: isReanalysis
      ? new Date().toISOString()
      : `${Math.max(1, parseInt(base.lastAnalyzed) || 1)}h ago`,
    realityScore: score,
    confidence,
    starRating,
    aiSummary: aiData?.aiSummary ?? aiSummary,
    commonIssues: aiData?.commonIssues ?? commonIssues,
    confidenceDetails: {
      reviewsAnalyzed,
      customerImages,
      visualVerification,
      aiVerification,
    },
    pros: aiData?.pros ?? pros,
    cons: aiData?.cons ?? cons,
    sentiment,
    worthBuying: {
      recommendation,
      bestFor,
      notIdealFor,
      summary: worthSummary,
    },
    valueForMoney,
    scoreBreakdown: aiData?.subScores ? [
      { label: "Description Accuracy", value: aiData.subScores.content, weight: 30 },
      { label: "Image Authenticity", value: aiData.subScores.media, weight: 25 },
      { label: "Review Legitimacy", value: aiData.subScores.specifications, weight: 30 },
      { label: "Shipping Reliability", value: aiData.subScores.shipping, weight: 15 },
    ] : scoreBreakdown,
    reviews,
    images,
    suggestions,
    whatsMissing: aiData?.whatsMissing,
    recommendations: aiData?.recommendations,
    potentialImpact: aiData?.potentialImpact,
    dataSources,
  };
}