import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** URL libsql:// atau http(s):// berarti database remote (Turso). */
function isRemoteDatabase(url: string | undefined): url is string {
  return (
    !!url &&
    (url.startsWith("libsql://") ||
      url.startsWith("http://") ||
      url.startsWith("https://"))
  );
}

export function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  if (isRemoteDatabase(url)) {
    const adapter = new PrismaLibSQL({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter, log });
  }

  // Fallback: SQLite file lokal (DATABASE_URL="file:./dev.db")
  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
