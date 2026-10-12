import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getProductDetails } from "../services/product-details.service";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const productId = params.productId || "";

  let session, admin;
  try {
    const authResult = await authenticate.admin(request);
    session = authResult.session;
    admin = authResult.admin;
  } catch (authError: any) {
    console.error(`Authentication failed in /api/product-details/${productId}:`, authError);
    return Response.json(
      { productDetails: null, error: "Session expired or authentication failed. Please reload.", isAuthError: true },
      { status: 401 }
    );
  }

  try {
    const productDetails = await getProductDetails(session.shop, productId, admin);
    return Response.json({ productDetails });
  } catch (error) {
    console.error(`Error in /api/product-details/${productId}:`, error);
    return Response.json({ productDetails: null, error: "Failed to fetch product details" }, { status: 500 });
  }
};
