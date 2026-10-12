import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function getDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // If using Neon without -pooler, automatically route through the connection pooler
  // to avoid exhausting direct PostgreSQL connections in serverless environments (Vercel)
  if (url.includes(".aws.neon.tech") && !url.includes("-pooler.")) {
    url = url.replace(/@(ep-[a-z0-9-]+)(?!-pooler)\./i, "@$1-pooler.");
  }

  // Ensure connection_limit=1 and connect_timeout=15 in serverless to prevent P2024 pool timeouts
  if (!url.includes("connection_limit=")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}connection_limit=1&connect_timeout=15`;
  }

  return url;
}

function getPrismaClient(): PrismaClient {
  // Reuse existing PrismaClient instance on globalThis across warm serverless lambda invocations
  if (global.prismaGlobal) {
    return global.prismaGlobal;
  }

  const dbUrl = getDatabaseUrl();
  const client = new PrismaClient(
    dbUrl
      ? {
          datasources: {
            db: { url: dbUrl },
          },
        }
      : undefined
  );

  global.prismaGlobal = client;
  return client;
}

const prisma = getPrismaClient();

export default prisma;
