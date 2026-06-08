import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "fallback-secret-for-dev-only";
const key = new TextEncoder().encode(secretKey);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function encryptJWT(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // Sessão expira em 2 horas (requisito de segurança)
    .sign(key);
}

export async function decryptJWT(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}
