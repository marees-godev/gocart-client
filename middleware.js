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

    // Redirect any legacy /admin requests to the standalone gocart-admin site
    if (pathname.startsWith('/admin')) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
        const targetPath = pathname.replace(/^\/admin/, '') || '/'
        return NextResponse.redirect(new URL(targetPath, adminUrl))
    }

    const token = request.cookies.get('token')?.value
    const isStoreRoute = pathname.startsWith('/store');

    if (!token && isStoreRoute) {
        const loginUrl = new URL('/merchant/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (token && isStoreRoute) {
        const payload = decodeJwtPayload(token)

        if (!payload) {
            const loginUrl = new URL('/merchant/login', request.url)
            return NextResponse.redirect(loginUrl)
        }

        if (payload.role !== 'MERCHANT' && payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/merchant', request.url))
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/store/:path*'],
}