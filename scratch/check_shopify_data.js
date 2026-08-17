import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function checkShopifyData() {
  try {
    const sessions = await prisma.session.findMany();
    console.log(`Found ${sessions.length} sessions in database.`);

    if (sessions.length === 0) {
      console.log("No active sessions found in database.");
      return;
    }

    const session = sessions[0];
    console.log(`Using session for shop: ${session.shop}`);
    console.log(`Access Token present: ${Boolean(session.accessToken)}`);

    const shopDomain = session.shop;
    const accessToken = session.accessToken;

    const query = `#graphql
      query checkMetafieldReferences {
        product(id: "gid://shopify/Product/11040997343425") {
          id
          title
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
              references(first: 10) {
                nodes {
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

    const res = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();
    console.log("=== GRAPHQL RESULT ===");
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error executing GraphQL test:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopifyData();
