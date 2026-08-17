import type { ProductItem } from "../../context/ProductContext";

export type AnalysisStatus = "Analyzed" | "Processing" | "Failed";
export type ConfidenceLevel = "High" | "Medium" | "Low";
export type VerificationStatus = "Verified" | "Suspicious" | "Failed";
export type VisualVerification = "Passed" | "Needs Review" | "Failed";
export type AiVerification = "Verified" | "Pending" | "Failed";
export type Sentiment = "Positive" | "Neutral" | "Negative";
export type ImpactLevel = "High" | "Medium" | "Low";

export interface IssueItem {
  title: string;
  percentage: number;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  helpfulCount: number;
  verified: boolean;
  sentiment: Sentiment;
}

export interface CustomerImage {
  id: string;
  label: string;
  source: string;
  verification: VerificationStatus;
  angle: string;
  detectedLabel: string;
}

export interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  scoreGain: number;
}

export interface DataSourceItem {
  id: string;
  name: string;
  status: "Connected" | "Syncing" | "Disconnected";
  records: number;
  lastSynced: string;
  coverage: number;
}

export interface WorthBuying {
  recommendation: "YES" | "NO";
  bestFor: string;
  notIdealFor: string;
  summary: string;
}

export interface ValueForMoney {
  overall: number;
  quality: number;
  accuracy: number;
  shipping: number;
}

export interface ScoreBreakdownItem {
  label: string;
  value: number;
  weight: number;
}

export interface ConfidenceDetails {
  reviewsAnalyzed: number;
  customerImages: number;
  visualVerification: VisualVerification;
  aiVerification: AiVerification;
}

export interface WhatsMissingItem {
  iconType?: string;
  title: string;
  description: string;
  impact: ImpactLevel;
}

export interface RecommendationItem {
  iconType?: string;
  title: string;
  description: string;
  difficulty: "Easy fix" | "Moderate" | "Advanced";
  time: string;
}

export interface ProductAnalysis {
  id: string;
  name: string;
  category: string;
  price: string;
  sku: string;
  status: AnalysisStatus;
  lastAnalyzed: string;
  lastAnalyzedTimestamp: string;
  realityScore: number;
  confidence: ConfidenceLevel;
  starRating: number;
  aiSummary: string;
  commonIssues: IssueItem[];
  confidenceDetails: ConfidenceDetails;
  pros: string[];
  cons: string[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  worthBuying: WorthBuying;
  valueForMoney: ValueForMoney;
  scoreBreakdown: ScoreBreakdownItem[];
  reviews: ReviewItem[];
  images: CustomerImage[];
  suggestions: SuggestionItem[];
  whatsMissing?: WhatsMissingItem[];
  recommendations?: RecommendationItem[];
  potentialImpact?: number;
  dataSources: DataSourceItem[];
}

export type { ProductItem };