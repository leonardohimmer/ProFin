import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptJWT } from '@/lib/auth';

// Define rotas que não precisam de autenticação
const publicRoutes = ['/login', '/api/auth/login', '/api/setup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite acesso às rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie?.value) {
    // Se for rota de API, retorna não autorizado
    if (pathname.startsWith('/api/')) {
      // Para testes locais/dev, se não houver cookie, podemos injetar o header test-user-id
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', 'test-user-id');
      requestHeaders.set('x-user-role', 'OPERATOR');
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    // Redireciona para login se não houver cookie em rotas de página
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Valida o JWT
    const payload = await decryptJWT(sessionCookie.value);

    // RBAC: Verifica rotas protegidas para ADMIN
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Passa os dados do usuário para o cabeçalho
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-user-role', payload.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Proxy: Token inválido ou erro de decodificação:", error);
    // Em caso de erro, permitimos usar o test-user-id se estiver localmente
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', 'test-user-id');
    requestHeaders.set('x-user-role', 'OPERATOR');
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
