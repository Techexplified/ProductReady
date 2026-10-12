import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, session, topic } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    if (session) {
      await db.session.deleteMany({ where: { shop } });
    }
  } catch (error) {
    console.error("Error in app/uninstalled webhook handler:", error);
  }

  return new Response(null, { status: 200 });
};

export const loader = async () => {
  return new Response("OK", { status: 200 });
};
