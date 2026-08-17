import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getProductDetails } from "../services/product-details.service";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const productId = params.productId || "";

  try {
    const productDetails = await getProductDetails(session.shop, productId, admin);
    return Response.json({ productDetails });
  } catch (error) {
    console.error(`Error in /api/product-details/${productId}:`, error);
    return Response.json({ productDetails: null, error: "Failed to fetch product details" }, { status: 500 });
  }
};
