export interface WidgetTheme {
  layout: "vertical" | "horizontal" | "compact" | "tabs";
  primaryColor: string;
  typography: string;
  borderRadius: string;
  shadow: string;
  spacing: string;
  buttonStyle: string;
  cardStyle: string;
}

export interface WidgetContentConfig {
  showRealityScore: boolean;
  showAiSummary: boolean;
  showProsCons: boolean;
  showWorthBuying: boolean;
  showConfidence: boolean;
  showCommonIssues: boolean;
  showReviewCount: boolean;
  showTrustBadge: boolean;
}

export interface WidgetBehaviorConfig {
  expandByDefault: boolean;
  stickyWidget: boolean;
  mobileVisible: boolean;
  desktopVisible: boolean;
  lazyLoading: boolean;
  animation: boolean;
  autoRefresh: boolean;
}

export interface DisplayRuleCondition {
  field: "tag" | "vendor" | "collection" | "price" | "type";
  operator: "equals" | "contains" | "greater_than" | "less_than";
  value: string;
}

export interface WidgetDisplayRuleData {
  pageTypes: string[];
  ruleLogic: "AND" | "OR";
  conditions: DisplayRuleCondition[];
}

export const DEFAULT_WIDGET_THEME: WidgetTheme = {
  layout: "vertical",
  primaryColor: "#4F46E5",
  typography: "Inter",
  borderRadius: "16px",
  shadow: "medium",
  spacing: "normal",
  buttonStyle: "solid",
  cardStyle: "bordered",
};

export const DEFAULT_CONTENT_CONFIG: WidgetContentConfig = {
  showRealityScore: true,
  showAiSummary: true,
  showProsCons: true,
  showWorthBuying: true,
  showConfidence: true,
  showCommonIssues: false,
  showReviewCount: true,
  showTrustBadge: true,
};

export const DEFAULT_BEHAVIOR_CONFIG: WidgetBehaviorConfig = {
  expandByDefault: true,
  stickyWidget: false,
  mobileVisible: true,
  desktopVisible: true,
  lazyLoading: true,
  animation: true,
  autoRefresh: false,
};

export const DEFAULT_DISPLAY_RULES: WidgetDisplayRuleData = {
  pageTypes: ["Product Page"],
  ruleLogic: "AND",
  conditions: [],
};
