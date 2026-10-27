import { NextResponse } from 'next/server';

function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(atob(base64));
    } catch {
        return null
    }
}

export function middleware(request) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('token')?.value

    const isAdminRoute = pathname.startsWith('/admin');
    const isStoreRoute = pathname.startsWith('/store');

    if (!token && (isAdminRoute || isStoreRoute)) {
        const targetPath = isStoreRoute ? '/merchant/login' : '/login'
        const loginUrl = new URL(targetPath, request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (token) {
        const payload = decodeJwtPayload(token)

        if (!payload) {
            const targetPath = isStoreRoute ? '/merchant/login' : '/login'
            const loginUrl = new URL(targetPath, request.url)
            return NextResponse.redirect(loginUrl)
        }

        if (isAdminRoute && payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url))
        }

        if (isStoreRoute && payload.role !== 'MERCHANT' && payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/merchant', request.url))
        }
    }

    return NextResponse.next();

}

export const config = {
    matcher: ['/admin/:path*', '/store/:path*'],
}