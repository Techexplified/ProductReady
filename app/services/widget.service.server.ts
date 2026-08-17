import { PrismaClient } from "@prisma/client";
import prisma from "../db.server";
import {
  DEFAULT_WIDGET_THEME,
  DEFAULT_CONTENT_CONFIG,
  DEFAULT_BEHAVIOR_CONFIG,
  DEFAULT_DISPLAY_RULES,
  type WidgetTheme,
  type WidgetContentConfig,
  type WidgetBehaviorConfig,
  type DisplayRuleCondition,
  type WidgetDisplayRuleData,
} from "../types/widget.types";

export type {
  WidgetTheme,
  WidgetContentConfig,
  WidgetBehaviorConfig,
  DisplayRuleCondition,
  WidgetDisplayRuleData,
};
export {
  DEFAULT_WIDGET_THEME,
  DEFAULT_CONTENT_CONFIG,
  DEFAULT_BEHAVIOR_CONFIG,
  DEFAULT_DISPLAY_RULES,
};

let fallbackClient: PrismaClient | null = null;

function getDelegates() {
  const p = prisma as any;
  let widget = p.widget;
  let displayRules = p.widgetDisplayRules;
  let analytics = p.widgetAnalytics;

  if (!widget || !displayRules || !analytics) {
    if (!fallbackClient) {
      fallbackClient = new PrismaClient();
    }
    const f = fallbackClient as any;
    widget = f.widget;
    displayRules = f.widgetDisplayRules;
    analytics = f.widgetAnalytics;
  }

  return { widget, displayRules, analytics };
}

export async function getOrCreateStoreByShop(shopName: string, name = "My Store") {
  let store = await prisma.store.findUnique({
    where: { shopName },
  });

  if (!store && shopName) {
    store = await prisma.store.findFirst();
  }

  if (!store) {
    store = await prisma.store.create({
      data: {
        shopName,
        name,
      },
    });
  }

  return store;
}

export async function seedDefaultWidgetsForStore(storeId: string) {
  const { widget } = getDelegates();
  if (!widget) return;

  try {
    const existingCount = await widget.count({ where: { storeId } });
    if (existingCount > 0) return;
  } catch (err) {
    console.error("Error checking widget count:", err);
  }

  const defaultWidgets = [
    {
      name: "Product Page Widget",
      location: "Product Page",
      status: "PUBLISHED",
      isDefault: true,
      badgeType: "Default",
      badgeSource: "Shopify Theme",
      theme: JSON.stringify({ ...DEFAULT_WIDGET_THEME, layout: "vertical" }),
      contentConfig: JSON.stringify(DEFAULT_CONTENT_CONFIG),
      behaviorConfig: JSON.stringify(DEFAULT_BEHAVIOR_CONFIG),
      displayRules: {
        create: {
          pageTypes: JSON.stringify(["Product Page"]),
          ruleLogic: "AND",
          conditions: JSON.stringify([]),
        },
      },
    },
    {
      name: "Collection Page Widget",
      location: "Collection Page",
      status: "PUBLISHED",
      isDefault: true,
      badgeType: "Default",
      badgeSource: "Shopify Theme",
      theme: JSON.stringify({ ...DEFAULT_WIDGET_THEME, layout: "compact" }),
      contentConfig: JSON.stringify({ ...DEFAULT_CONTENT_CONFIG, showProsCons: false }),
      behaviorConfig: JSON.stringify(DEFAULT_BEHAVIOR_CONFIG),
      displayRules: {
        create: {
          pageTypes: JSON.stringify(["Collection Page"]),
          ruleLogic: "AND",
          conditions: JSON.stringify([]),
        },
      },
    },
    {
      name: "Cart Page Widget",
      location: "Cart Page",
      status: "PUBLISHED",
      isDefault: false,
      badgeType: "Custom",
      badgeSource: "Shopify Theme",
      theme: JSON.stringify({ ...DEFAULT_WIDGET_THEME, layout: "horizontal" }),
      contentConfig: JSON.stringify(DEFAULT_CONTENT_CONFIG),
      behaviorConfig: JSON.stringify(DEFAULT_BEHAVIOR_CONFIG),
      displayRules: {
        create: {
          pageTypes: JSON.stringify(["Cart Page"]),
          ruleLogic: "AND",
          conditions: JSON.stringify([]),
        },
      },
    },
    {
      name: "Home Page Banner",
      location: "Home Page",
      status: "DRAFT",
      isDefault: false,
      badgeType: "Draft",
      badgeSource: "Shopify Theme",
      theme: JSON.stringify({ ...DEFAULT_WIDGET_THEME, layout: "horizontal" }),
      contentConfig: JSON.stringify(DEFAULT_CONTENT_CONFIG),
      behaviorConfig: JSON.stringify(DEFAULT_BEHAVIOR_CONFIG),
      displayRules: {
        create: {
          pageTypes: JSON.stringify(["Home Page"]),
          ruleLogic: "AND",
          conditions: JSON.stringify([]),
        },
      },
    },
  ];

  for (const widgetData of defaultWidgets) {
    try {
      await widget.create({
        data: {
          storeId,
          ...widgetData,
        },
      });
    } catch (err) {
      console.error("Error seeding default widget:", err);
    }
  }
}

export async function getWidgetsForStore(shopName: string) {
  const store = await getOrCreateStoreByShop(shopName);
  await seedDefaultWidgetsForStore(store.id);

  const { widget } = getDelegates();
  if (!widget) {
    return { store, widgets: [] };
  }

  let widgets = await widget.findMany({
    where: { storeId: store.id },
    include: {
      displayRules: true,
      analytics: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!widgets || widgets.length === 0) {
    await seedDefaultWidgetsForStore(store.id);
    widgets = await widget.findMany({
      where: { storeId: store.id },
      include: {
        displayRules: true,
        analytics: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  return { store, widgets };
}

export async function getWidgetById(widgetId: string) {
  const { widget: widgetDelegate } = getDelegates();
  if (!widgetDelegate) return null;

  const widget = await widgetDelegate.findUnique({
    where: { id: widgetId },
    include: {
      displayRules: true,
      analytics: true,
    },
  });

  if (!widget) return null;

  return {
    ...widget,
    themeParsed: JSON.parse(widget.theme || "{}") as WidgetTheme,
    contentConfigParsed: JSON.parse(widget.contentConfig || "{}") as WidgetContentConfig,
    behaviorConfigParsed: JSON.parse(widget.behaviorConfig || "{}") as WidgetBehaviorConfig,
    displayRulesParsed: widget.displayRules[0]
      ? {
          pageTypes: JSON.parse(widget.displayRules[0].pageTypes || "[]"),
          ruleLogic: widget.displayRules[0].ruleLogic as "AND" | "OR",
          conditions: JSON.parse(widget.displayRules[0].conditions || "[]"),
        }
      : DEFAULT_DISPLAY_RULES,
  };
}

export async function createWidget(shopName: string, data: {
  name: string;
  location: string;
  status?: string;
  theme: WidgetTheme;
  contentConfig: WidgetContentConfig;
  behaviorConfig: WidgetBehaviorConfig;
  displayRules: WidgetDisplayRuleData;
}) {
  const store = await getOrCreateStoreByShop(shopName);
  const { widget: widgetDelegate } = getDelegates();

  const newWidget = await widgetDelegate.create({
    data: {
      storeId: store.id,
      name: data.name,
      location: data.location,
      status: data.status || "PUBLISHED",
      badgeType: "Custom",
      badgeSource: "Shopify Theme",
      theme: JSON.stringify(data.theme),
      contentConfig: JSON.stringify(data.contentConfig),
      behaviorConfig: JSON.stringify(data.behaviorConfig),
      displayRules: {
        create: {
          pageTypes: JSON.stringify(data.displayRules.pageTypes),
          ruleLogic: data.displayRules.ruleLogic,
          conditions: JSON.stringify(data.displayRules.conditions),
        },
      },
      analytics: {
        create: [
          {
            date: new Date().toISOString().split("T")[0],
            impressions: 0,
            views: 0,
            clicks: 0,
            ctr: 0.0,
          },
        ],
      },
    },
  });

  return newWidget;
}

export async function updateWidget(widgetId: string, data: {
  name?: string;
  location?: string;
  status?: string;
  theme?: WidgetTheme;
  contentConfig?: WidgetContentConfig;
  behaviorConfig?: WidgetBehaviorConfig;
  displayRules?: WidgetDisplayRuleData;
}) {
  const { widget: widgetDelegate, displayRules: rulesDelegate } = getDelegates();

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.location) updateData.location = data.location;
  if (data.status) updateData.status = data.status;
  if (data.theme) updateData.theme = JSON.stringify(data.theme);
  if (data.contentConfig) updateData.contentConfig = JSON.stringify(data.contentConfig);
  if (data.behaviorConfig) updateData.behaviorConfig = JSON.stringify(data.behaviorConfig);

  const updated = await widgetDelegate.update({
    where: { id: widgetId },
    data: updateData,
  });

  if (data.displayRules && rulesDelegate) {
    const existingRule = await rulesDelegate.findFirst({
      where: { widgetId },
    });

    if (existingRule) {
      await rulesDelegate.update({
        where: { id: existingRule.id },
        data: {
          pageTypes: JSON.stringify(data.displayRules.pageTypes),
          ruleLogic: data.displayRules.ruleLogic,
          conditions: JSON.stringify(data.displayRules.conditions),
        },
      });
    } else {
      await rulesDelegate.create({
        data: {
          widgetId,
          pageTypes: JSON.stringify(data.displayRules.pageTypes),
          ruleLogic: data.displayRules.ruleLogic,
          conditions: JSON.stringify(data.displayRules.conditions),
        },
      });
    }
  }

  return updated;
}

export async function toggleWidgetStatus(widgetId: string, status: "PUBLISHED" | "DRAFT") {
  const { widget: widgetDelegate } = getDelegates();
  return await widgetDelegate.update({
    where: { id: widgetId },
    data: { status },
  });
}

export async function deleteWidget(widgetId: string) {
  const { widget: widgetDelegate } = getDelegates();
  return await widgetDelegate.delete({
    where: { id: widgetId },
  });
}
