import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  const query = `#graphql
    query checkProductDetailsAndMeta {
      shop {
        name
        shippingPolicy {
          id
          title
          body
        }
        refundPolicy {
          id
          title
          body
        }
        privacyPolicy {
          id
          title
          body
        }
        termsOfService {
          id
          title
          body
        }
      }
      products(first: 5) {
        nodes {
          id
          title
          handle
          descriptionHtml
          description
          vendor
          productType
          tags
          metafields(first: 50) {
            nodes {
              id
              namespace
              key
              value
              type
              reference {
                ... on Metaobject {
                  id
                  type
                  handle
                  fields {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const json = (await response.json()) as any;

    return {
      success: true,
      shopDomain: session.shop,
      scopes: session.scope,
      data: json.data,
      errors: json.errors || null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to execute GraphQL query.",
    };
  }
};
