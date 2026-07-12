import { PrismaClient } from "@prisma/client";

// Configura fallback automático para a variável DATABASE_URL se ela estiver ausente
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NODE_ENV === "production" 
    ? "file:/tmp/dev.db" 
    : "file:./dev.db";
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
