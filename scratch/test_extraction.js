const descriptionText = `Solawave Solabiome Refreshing Jelly Mist is a spritzable pre- and probiotic face toner with Solabiome synbiotic complex (Lactobacillus Ferment Lysate probiotic plus Beta-Glucan and Sparassis Crispa cauliflower mushroom prebiotics), pro-vitamin B5 (panthenol), Centella Asiatica (gotu kola) extract, dipotassium glycyrrhizate, and vitamin E (tocopherol) to instantly hydrate, soothe reactive skin, and protect against environmental free radicals and pollution. Ultra-light, fast-absorbing jelly texture lands evenly without dripping or running. Use as a toner after cleansing — close eyes, hold 6-8 inches from face, and mist generously. Can also be used any time during the day for a hydration refresh, to set makeup, or as a pick-me-up between meetings. Layers with all other Solabiome and Solawave topicals; primes skin to receive serums and creams. Suitable for all skin types including sensitive — fragrance-free, paraben-free, phthalate-free, PEG-free, cyclic-silicone-free, vegan, cruelty-free, gluten-free, dermatologist-tested. Not a replacement for moisturizer. Compatible with use before Solawave LED light therapy device treatments. HSA/FSA eligible, 60-day money-back guarantee.`;

function extractPolicies(descriptionHtml, metafields = [], storePolicies = {}) {
  const cleanText = (descriptionHtml || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let shippingInfo = storePolicies?.shippingPolicy || null;
  let returnInfo = storePolicies?.refundPolicy || null;
  let warrantyInfo = null;

  // 1. Check Metafields first
  for (const mf of metafields || []) {
    const combined = `${mf.namespace || ""} ${mf.key || ""}`.toLowerCase();
    const val = String(mf.value || "").trim();
    if (!val) continue;

    if (!shippingInfo && (combined.includes("ship") || combined.includes("delivery") || combined.includes("transit"))) {
      shippingInfo = val;
    }
    if (!returnInfo && (combined.includes("return") || combined.includes("refund") || combined.includes("moneyback") || combined.includes("money-back"))) {
      returnInfo = val;
    }
    if (!warrantyInfo && (combined.includes("warranty") || combined.includes("guarantee"))) {
      warrantyInfo = val;
    }
  }

  // Split description into clean sentences/clauses for intelligent parsing
  const sentences = cleanText
    .split(/(?<=[.!?])\s+|(?<=;)\s+|—\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Helper to extract full matching sentence or surrounding clause
  const findClause = (keywords) => {
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        // Return full sentence if under 160 chars, or trim surrounding context
        if (sentence.length <= 160) return sentence;
        // Trim clause
        const firstKw = keywords.find((kw) => lower.includes(kw));
        const idx = lower.indexOf(firstKw);
        const start = Math.max(0, idx - 40);
        const end = Math.min(sentence.length, idx + 100);
        let excerpt = sentence.substring(start, end).trim();
        if (start > 0) excerpt = "..." + excerpt;
        if (end < sentence.length) excerpt = excerpt + "...";
        return excerpt;
      }
    }
    return null;
  };

  // 2. Extract Return / Refund / Guarantee from Description
  if (!returnInfo) {
    const returnClause = findClause([
      "money-back",
      "moneyback",
      "return policy",
      "returns policy",
      "returnable",
      "30-day return",
      "60-day return",
      "90-day return",
      "full refund",
      "easy returns",
      "free returns",
      "satisfaction guarantee",
      "guarantee",
    ]);
    if (returnClause) {
      returnInfo = returnClause;
    }
  }

  // 3. Extract Shipping / Delivery from Description
  if (!shippingInfo) {
    const shippingClause = findClause([
      "ships in",
      "shipping",
      "delivery",
      "dispatched",
      "delivered in",
      "transit time",
      "express delivery",
      "standard delivery",
      "free shipping",
      "fast shipping",
      "business days",
    ]);
    if (shippingClause) {
      shippingInfo = shippingClause;
    }
  }

  // 4. Extract Warranty / Eligibility from Description
  if (!warrantyInfo) {
    const warrantyClause = findClause([
      "warranty",
      "warranties",
      "guaranteed",
      "hsa/fsa eligible",
      "hsa eligible",
      "fsa eligible",
      "manufacturer warranty",
      "limited warranty",
      "lifetime warranty",
      "year warranty",
    ]);
    if (warrantyClause) {
      warrantyInfo = warrantyClause;
    }
  }

  // Secondary fallback: if warranty is still null but returnInfo includes "guarantee", mirror or refine
  if (!warrantyInfo && returnInfo && returnInfo.toLowerCase().includes("guarantee")) {
    warrantyInfo = returnInfo;
  }

  return {
    shippingInformation: shippingInfo || "No explicit shipping information provided.",
    returnInformation: returnInfo || "No explicit return policy provided.",
    warrantyInformation: warrantyInfo || "No warranty information provided.",
  };
}

const testCases = [
  {
    name: "Solawave Refreshing Jelly Mist (User Screenshot)",
    text: "Solawave Solabiome Refreshing Jelly Mist is a spritzable pre- and probiotic face toner... Suitable for all skin types including sensitive. HSA/FSA eligible, 60-day money-back guarantee.",
  },
  {
    name: "T-Shirt with Shipping & Return Details in Description",
    text: "Men's Classic Cotton T-Shirt. Premium quality 100% organic cotton. Ships within 1-2 business days via FedEx. 30-day hassle-free returns & 1-year product warranty included.",
  },
  {
    name: "Electronics Device with Delivery and Warranty",
    text: "Wireless Noise Canceling Headphones. Bluetooth 5.2, 30-hour battery life. Fast 2-day delivery across USA. 2-Year Limited Manufacturer Warranty.",
  },
  {
    name: "Beauty Product with Free Shipping and Satisfaction Guarantee",
    text: "Hydrating Facial Serum. Free shipping on all orders over $35. 100% satisfaction guarantee or full refund within 45 days.",
  },
];

for (const tc of testCases) {
  console.log(`\n--- TEST: ${tc.name} ---`);
  console.log(JSON.stringify(extractPolicies(tc.text), null, 2));
}
