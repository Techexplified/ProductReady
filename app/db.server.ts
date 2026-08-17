import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    if (!global.prismaGlobal || !(global.prismaGlobal as any).widget) {
      global.prismaGlobal = new PrismaClient();
    }
    return global.prismaGlobal;
  }
  return new PrismaClient();
}

const prisma = getPrismaClient();

export default prisma;
