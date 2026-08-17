import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { ProductProvider } from "../context/ProductContext";
import { getStoreProducts } from "../services/store-products.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Fetch store name from Shopify Admin API
  const response = await admin.graphql(
    `#graphql
      query {
        shop {
          name
          myshopifyDomain
        }
      }`
  );
  const { data } = await response.json();
  const shopName = session.shop;
  const storeName = data?.shop?.name ?? "My Store";

  const products = await getStoreProducts(shopName, storeName);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    storeName,
    storeDomain: data?.shop?.myshopifyDomain ?? "",
    products,
  };
};

export default function App() {
  const { apiKey, products } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <NavMenu>
        <a href="/app" rel="home">
          Dashboard
        </a>
        <a href="/app/products">Products</a>
        <a href="/app/settings">Settings</a>
      </NavMenu>
      <ProductProvider initialProducts={products as any}>
        <main className="w-full min-h-screen bg-[#F6F7FB] p-6">
          <Outlet />
        </main>
      </ProductProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
