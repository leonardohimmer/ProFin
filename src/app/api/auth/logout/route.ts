import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Limpa o cookie de sessão
  response.cookies.delete("session");
  
  return response;
}
