import { PrismaClient } from "@prisma/client";

// Configura fallback programático com as URLs do Supabase (PostgreSQL) caso não estejam no process.env
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres.bswdsnbxlpgjdiddvdxi:mmcsgq-supabase26@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = "postgresql://postgres.bswdsnbxlpgjdiddvdxi:mmcsgq-supabase26@aws-0-us-east-1.pooler.supabase.com:5432/postgres";
}

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
