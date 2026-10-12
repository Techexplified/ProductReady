import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { payload, session, topic, shop } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    const current = payload?.current as string[];
    if (session && current) {
      await db.session.update({
        where: {
          id: session.id,
        },
        data: {
          scope: current.toString(),
        },
      });
    }
  } catch (error) {
    console.error("Error in app/scopes_update webhook handler:", error);
  }

  return new Response(null, { status: 200 });
};

export const loader = async () => {
  return new Response("OK", { status: 200 });
};
