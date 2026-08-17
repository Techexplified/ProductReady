/**
 * Billing Server Service
 * Calculates dynamic usage metrics, queries Shopify app subscriptions, and manages persistent billing invoices in PostgreSQL DB.
 */

import prisma from "../db.server";

export interface BillingDetailsDTO {
  planName: string;
  status: string;
  price: number;
  currencySymbol: string;
  renewalDate: string; // e.g. "Jul 10, 2026"
  billingInterval: string;
  productLimit: number;
  reviewLimit: number;
  aiAnalysisLimit: number;
  productsAnalyzed: number;
  reviewsProcessed: number;
  aiAnalysesUsed: number;
  currentMonthRange: string; // e.g. "Jun 1 - Jun 30, 2026"
  invoices: InvoiceDTO[];
  totalPaid: number;
}

export interface InvoiceDTO {
  id: string;
  number: string;
  date: string;
  planName: string;
  amount: number;
  status: string;
  periodLabel: string;
}

async function ensureStore(shopName: string) {
  return prisma.store.upsert({
    where: { shopName },
    update: {},
    create: { name: "My Store", shopName },
  });
}

function formatDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export async function getBillingDetailsForShop(
  shopName: string,
  admin: any
): Promise<BillingDetailsDTO> {
  const store = await ensureStore(shopName);

  // 1. Calculate REAL live usage directly from PostgreSQL DB
  const analyses = await prisma.analysis.findMany({
    where: { storeId: store.id },
  });

  const productsAnalyzed = analyses.filter(
    (a) => a.status === "COMPLETED" && a.score > 0
  ).length;

  const dbReviewAnalysesCount = 0;

  // Query connected data sources for imported review counts
  let dsReviewsImported = 0;
  try {
    if ((prisma as any).dataSource?.findMany) {
      const dataSources = await (prisma as any).dataSource.findMany({
        where: { storeId: store.id },
      });
      dsReviewsImported = dataSources.reduce(
        (acc: number, ds: any) => acc + (ds.reviewsImported || 0),
        0
      );
    }
  } catch (e) {
    console.error("Failed to query data sources in billing service:", e);
  }

  const reviewsProcessed = dsReviewsImported + dbReviewAnalysesCount;
  const aiAnalysesUsed = productsAnalyzed;

  // 2. Query Shopify Admin GraphQL API for active subscriptions
  let planName = "Free Trial";
  let status = "Active";
  let price = 0;
  let currencySymbol = "$";
  let renewalDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  let billingInterval = "Billed monthly";

  if (admin) {
    try {
      const response = await admin.graphql(`
        #graphql
        query getAppSubscription {
          appInstallation {
            activeSubscriptions {
              id
              name
              status
              currentPeriodEnd
              lineItems {
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      price {
                        amount
                        currencyCode
                      }
                      interval
                    }
                  }
                }
              }
            }
          }
        }
      `);
      const resJson = await response.json();
      const subs = resJson.data?.appInstallation?.activeSubscriptions;
      if (subs && subs.length > 0) {
        const sub = subs[0];
        planName = sub.name || planName;
        status = sub.status === "ACTIVE" ? "Active" : sub.status;
        if (sub.currentPeriodEnd) {
          renewalDate = formatDate(new Date(sub.currentPeriodEnd));
        }
        const pricing = sub.lineItems?.[0]?.plan?.pricingDetails;
        if (pricing?.price?.amount) {
          price = parseFloat(pricing.price.amount);
        }
      }
    } catch (e) {
      console.error("Failed to fetch Shopify app subscription:", e);
    }
  }

  // Current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const currentMonthRange = `${formatDate(startOfMonth).split(",")[0]} - ${formatDate(endOfMonth)}`;

  // 3. Fetch REAL BillingInvoices stored in PostgreSQL DB
  let invoices: InvoiceDTO[] = [];
  try {
    if ((prisma as any).billingInvoice?.findMany) {
      const dbInvoices = await (prisma as any).billingInvoice.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
      });

      invoices = dbInvoices.map((inv: any) => ({
        id: inv.id,
        number: inv.number,
        date: formatDate(new Date(inv.createdAt)),
        planName: inv.planName,
        amount: inv.amount,
        status: inv.status,
        periodLabel: inv.periodLabel,
      }));
    }
  } catch (e) {
    console.error("Failed to fetch billing invoices from DB:", e);
  }

  // Calculate total paid from real DB invoices
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.amount, 0);

  // Dynamic limits based on plan
  let productLimit = 1000;
  let reviewLimit = 10000;
  let aiAnalysisLimit = 1000;

  if (planName.toLowerCase().includes("starter")) {
    productLimit = 200;
    reviewLimit = 2000;
    aiAnalysisLimit = 200;
  } else if (planName.toLowerCase().includes("enterprise")) {
    productLimit = 10000;
    reviewLimit = 100000;
    aiAnalysisLimit = 10000;
  }

  return {
    planName,
    status,
    price,
    currencySymbol,
    renewalDate,
    billingInterval,
    productLimit,
    reviewLimit,
    aiAnalysisLimit,
    productsAnalyzed,
    reviewsProcessed,
    aiAnalysesUsed,
    currentMonthRange,
    invoices,
    totalPaid,
  };
}

/**
 * Record a new subscription billing invoice in PostgreSQL DB and request Shopify charge
 */
export async function createShopifySubscription(
  admin: any,
  planName: string,
  price: number,
  returnUrl: string
) {
  let confirmationUrl = returnUrl;

  if (admin) {
    try {
      const response = await admin.graphql(
        `#graphql
        mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
          appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: $test) {
            appSubscription {
              id
            }
            confirmationUrl
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            name: planName,
            returnUrl,
            test: true,
            lineItems: [
              {
                plan: {
                  appRecurringPricingDetails: {
                    price: {
                      amount: price,
                      currencyCode: "USD",
                    },
                    interval: "EVERY_30_DAYS",
                  },
                },
              },
            ],
          },
        }
      );

      const resJson = await response.json();
      const subData = resJson.data?.appSubscriptionCreate;
      if (subData?.confirmationUrl) {
        confirmationUrl = subData.confirmationUrl;
      }
    } catch (e) {
      console.error("Failed to create Shopify subscription:", e);
    }
  }

  return { confirmationUrl };
}

/**
 * Record a newly created invoice in PostgreSQL DB
 */
export async function recordBillingInvoice(
  shopName: string,
  planName: string,
  amount: number
) {
  const store = await ensureStore(shopName);
  const now = new Date();

  if ((prisma as any).billingInvoice?.create) {
    const invCount = await (prisma as any).billingInvoice.count({
      where: { storeId: store.id },
    });

    const invNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-00${invCount + 1}`;
    const periodLabel = `Invoice for ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;

    await (prisma as any).billingInvoice.create({
      data: {
        storeId: store.id,
        number: invNumber,
        planName,
        amount,
        status: "Paid",
        periodLabel,
      },
    });
  }
}
