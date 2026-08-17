import type { DisplayRuleCondition, WidgetDisplayRuleData } from "../types/widget.types";

export interface ProductRuleContext {
  pageType: string; // e.g. "Product Page", "Collection Page", "Home Page", "Cart Page"
  tags?: string[];
  vendor?: string;
  collections?: string[];
  price?: number;
  productType?: string;
}

export function evaluateDisplayRuleCondition(
  condition: DisplayRuleCondition,
  context: ProductRuleContext
): boolean {
  const { field, operator, value } = condition;
  const targetVal = value.trim().toLowerCase();

  switch (field) {
    case "tag": {
      const tags = (context.tags || []).map((t) => t.toLowerCase());
      if (operator === "equals") return tags.includes(targetVal);
      if (operator === "contains") return tags.some((t) => t.includes(targetVal));
      return false;
    }
    case "vendor": {
      const vendor = (context.vendor || "").toLowerCase();
      if (operator === "equals") return vendor === targetVal;
      if (operator === "contains") return vendor.includes(targetVal);
      return false;
    }
    case "collection": {
      const collections = (context.collections || []).map((c) => c.toLowerCase());
      if (operator === "equals") return collections.includes(targetVal);
      if (operator === "contains") return collections.some((c) => c.includes(targetVal));
      return false;
    }
    case "type": {
      const pType = (context.productType || "").toLowerCase();
      if (operator === "equals") return pType === targetVal;
      if (operator === "contains") return pType.includes(targetVal);
      return false;
    }
    case "price": {
      const numVal = parseFloat(value);
      if (isNaN(numVal)) return true;
      const price = context.price || 0;
      if (operator === "greater_than") return price > numVal;
      if (operator === "less_than") return price < numVal;
      if (operator === "equals") return price === numVal;
      return false;
    }
    default:
      return true;
  }
}

export function evaluateWidgetDisplayRules(
  rules: WidgetDisplayRuleData,
  context: ProductRuleContext
): boolean {
  // Check Page Type
  if (rules.pageTypes && rules.pageTypes.length > 0) {
    const pageMatched = rules.pageTypes.some(
      (pt) => pt.toLowerCase() === context.pageType.toLowerCase()
    );
    if (!pageMatched) return false;
  }

  // Check conditions
  if (!rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  if (rules.ruleLogic === "OR") {
    return rules.conditions.some((cond) => evaluateDisplayRuleCondition(cond, context));
  } else {
    return rules.conditions.every((cond) => evaluateDisplayRuleCondition(cond, context));
  }
}
