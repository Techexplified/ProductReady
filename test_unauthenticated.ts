import shopify from "./app/shopify.server";

async function testUnauthenticated() {
  try {
    const { admin } = await shopify.unauthenticated.admin("abcd-qssk9ukc.myshopify.com");
    console.log("Unauthenticated admin client created successfully!");

    const res = await admin.graphql(`#graphql
      query {
        products(first: 10) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `);

    const json = await res.json();
    console.log("GraphQL products for abcd:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Unauthenticated error:", err);
  }
}

testUnauthenticated();
