import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { syncProductsFromShopify } from "../services/shopifyProduct.service";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return { success: false, message: "Method not allowed" };
  }

  let storeName = session.shop.split(".")[0];
  try {
    const shopRes = await admin.graphql(`
      #graphql
      query {
        shop {
          name
        }
      }
    `);
    const { data } = await shopRes.json();
    if (data?.shop?.name) {
      storeName = data.shop.name;
    }
  } catch (err) {
    console.error("Failed to fetch shop name in sync route:", err);
  }

  const result = await syncProductsFromShopify(admin, session.shop, storeName);
  return result;
};

export const loader = async () => {
  return { message: "Use POST to trigger product synchronization." };
};
