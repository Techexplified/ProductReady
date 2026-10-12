import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { syncProductsFromShopify } from "../services/shopifyProduct.service";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ success: false, message: "Method not allowed" }, { status: 405 });
  }

  let session, admin;
  try {
    const authResult = await authenticate.admin(request);
    session = authResult.session;
    admin = authResult.admin;
  } catch (authError: any) {
    console.error("Authentication failed in app.products.sync:", authError);
    return Response.json(
      { success: false, message: "Session expired or authentication failed. Please reload the app.", isAuthError: true },
      { status: 401 }
    );
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
