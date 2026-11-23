'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { graphqlRequest } from '@/lib/apiClient'
import { setAuth } from '@/lib/features/auth/authSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import {
    LOGIN_WITH_FACEBOOK_MUTATION,
    REGISTER_WITH_FACEBOOK_MUTATION,
} from '@/lib/graphql/auth'
import { GET_ME_QUERY } from '@/lib/graphql/user'
import { getFacebookRedirectUri, getFacebookOAuthURL } from '@/lib/facebookAuth'
import { X, ShieldCheck, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'

const STEPS = [
    'Verifying Facebook account',
    'Synchronizing cart & preferences',
    'Preparing your marketplace session',
]

export default function FacebookOAuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dispatch = useDispatch()
    const hasProcessedRef = useRef(false)

    const [isProcessing, setIsProcessing] = useState(false)
    const [step, setStep] = useState(0)
    const [done, setDone] = useState(false)
    const [error, setError] = useState(null)
    const [targetRoleState, setTargetRoleState] = useState('USER')
    const [modeState, setModeState] = useState('login')

    const dismiss = () => {
        setIsProcessing(false)
        setError(null)
        window.history.replaceState(null, '', window.location.pathname)
        if (!done) {
            router.push('/login')
        }
    }

    useEffect(() => {
        if (typeof window === 'undefined') return

        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const oauthError = searchParams.get('error') || searchParams.get('error_reason')
        const errorDesc = searchParams.get('error_description') || searchParams.get('error_message')

        // Only handle if this is a Facebook OAuth callback
        const isFacebook = state && (state.startsWith('facebook:') || state.toLowerCase().includes('facebook'))
        if (!isFacebook) return

        if (oauthError) {
            window.history.replaceState(null, '', window.location.pathname)
            toast.error(errorDesc || 'Facebook sign-in was cancelled.')
            return
        }

        if (!code) return

        // Prevent double processing on component remounts or hot-reloads
        const sessionKey = `oauth_fb_${code}`
        if (hasProcessedRef.current || sessionStorage.getItem(sessionKey)) {
            // Clean URL in case it's still present
            window.history.replaceState(null, '', window.location.pathname)
            return
        }
        hasProcessedRef.current = true
        sessionStorage.setItem(sessionKey, '1')

        // Clean URL immediately so page refresh or back-button never re-submits the single-use code
        window.history.replaceState(null, '', window.location.pathname)

        setIsProcessing(true)

        // Parse state: "facebook:ROLE:MODE"
        let role = 'USER'
        let mode = 'login'
        if (state) {
            const parts = state.split(':')
            if (parts.length >= 3) {
                role = parts[1].toUpperCase()
                mode = parts[2].toLowerCase()
            } else if (parts.length === 2) {
                role = parts[1].toUpperCase()
            }
        }

        const validRoles = ['USER', 'MERCHANT', 'DELIVERY_PARTNER', 'ADMIN']
        const targetRole = validRoles.includes(role) ? role : 'USER'
        setTargetRoleState(targetRole)
        setModeState(mode)
        const redirectUri = getFacebookRedirectUri()

        const run = async () => {
            try {
                setStep(0)
                await new Promise((r) => setTimeout(r, 300))

                setStep(1)
                let authPayload = null

                if (mode === 'register') {
                    try {
                        const res = await graphqlRequest(REGISTER_WITH_FACEBOOK_MUTATION, {
                            input: { code, redirectUri, role: targetRole },
                        })
                        authPayload = res?.registerWithFacebook
                    } catch (e) {
                        const msg = (e?.message || '').toLowerCase()
                        if (msg.includes('already exists') || msg.includes('please login')) {
                            throw new Error('An account with this Facebook profile already exists. Please sign in instead.')
                        }
                        if (msg.includes('code has been used') || msg.includes('authorization code has been used')) {
                            throw new Error('This Facebook authorization code has expired. Please try signing in again.')
                        }
                        throw e
                    }
                } else {
                    try {
                        const res = await graphqlRequest(LOGIN_WITH_FACEBOOK_MUTATION, {
                            input: { code, redirectUri, role: targetRole },
                        })
                        authPayload = res?.loginWithFacebook
                    } catch (e) {
                        const msg = (e?.message || '').toLowerCase()
                        if (msg.includes('not found') || msg.includes('please register')) {
                            throw new Error('No account found for this Facebook profile. Please register first.')
                        }
                        if (msg.includes('code has been used') || msg.includes('authorization code has been used')) {
                            throw new Error('This Facebook authorization code has expired. Please try signing in again.')
                        }
                        throw e
                    }
                }

                if (!authPayload?.token) {
                    throw new Error('Facebook authentication did not return a valid session.')
                }

                setStep(2)

                const token = authPayload.token
                const refreshToken = authPayload.refreshToken

                let user = null
                try {
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
                    user = {
                        id: payload.userId || payload.id || payload.sub || '',
                        name: payload.name || payload.email?.split('@')[0] || 'User',
                        email: payload.email || '',
                        role: authPayload.role || payload.role || targetRole,
                    }
                } catch {
                    user = { id: '', name: 'User', email: '', role: authPayload.role || targetRole }
                }

                localStorage.setItem('token', token)
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
                if (user) localStorage.setItem('user', JSON.stringify(user))

                const maxAge = authPayload.expiresIn || 604800
                document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`

                dispatch(setAuth({ user, token }))

                // Hydrate full user details in the background
                graphqlRequest(GET_ME_QUERY)
                    .then((res) => {
                        if (res?.me) {
                            const me = res.me
                            const fullName = `${me.firstName || ''} ${me.lastName || ''}`.trim()
                            const freshUser = {
                                ...user, ...me,
                                name: fullName || me.username || user?.name || me.email?.split('@')[0] || 'User',
                                firstName: me.firstName || '',
                                lastName: me.lastName || '',
                                avatar: me.avatarUrl || null,
                                avatarUrl: me.avatarUrl || null,
                            }
                            localStorage.setItem('user', JSON.stringify(freshUser))
                            dispatch(setAuth({ user: freshUser, token }))
                        }
                    })
                    .catch(() => {})

                // Restore pending cart item
                const pending = localStorage.getItem('pendingCartItem')
                if (pending) {
                    dispatch(addToCart({ productId: pending }))
                    localStorage.removeItem('pendingCartItem')
                    toast.success('Product added to your cart!')
                }

                setDone(true)
                await new Promise((r) => setTimeout(r, 600))

                toast.success(`Welcome, ${user?.name || 'Shopper'}!`)

                const finalRole = user?.role || authPayload.role || targetRole
                if (finalRole === 'ADMIN') {
                    window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
                } else if (finalRole === 'MERCHANT' || finalRole === 'SELLER') {
                    router.push('/store')
                } else if (finalRole === 'DELIVERY_PARTNER') {
                    router.push('/orders')
                } else {
                    router.push('/')
                }
            } catch (err) {
                console.error('Facebook OAuth callback error:', err)
                let errorMsg = err.message || 'Failed to authenticate with Facebook. Please try again.'
                if (errorMsg.toLowerCase().includes('authorization code has been used') || errorMsg.toLowerCase().includes('code has been used')) {
                    errorMsg = 'This Facebook authorization session expired or was already used. Please click below to try again.'
                }
                setError(errorMsg)
            }
        }

        run()
    }, [searchParams, router, dispatch])

    if (!isProcessing) return null

    const isNoAccountError = error && (error.toLowerCase().includes('register first') || error.toLowerCase().includes('no account found'))
    const isAlreadyExistsError = error && (error.toLowerCase().includes('already exists') || error.toLowerCase().includes('sign in instead'))

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={error || done ? dismiss : undefined}
        >
            <div
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 text-center border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Dismiss button */}
                {(error || done) && (
                    <button
                        type="button"
                        onClick={dismiss}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {error ? (
                    /* ── Error State ── */
                    <div className="flex flex-col items-center gap-4 pt-1">
                        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                            <X className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-base mb-1.5">Facebook Authentication</h3>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{error}</p>
                        </div>

                        <div className="w-full space-y-2 pt-1">
                            {isNoAccountError ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = getFacebookOAuthURL({ role: targetRoleState, mode: 'register' })
                                        window.location.href = url
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>Create Account with Facebook</span>
                                    <ArrowRight size={14} />
                                </button>
                            ) : isAlreadyExistsError ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = getFacebookOAuthURL({ role: targetRoleState, mode: 'login' })
                                        window.location.href = url
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>Sign In with Facebook</span>
                                    <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = getFacebookOAuthURL({ role: targetRoleState, mode: modeState })
                                        window.location.href = url
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>Retry with Facebook</span>
                                    <ArrowRight size={14} />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={dismiss}
                                className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Loading State ── */
                    <div className="flex flex-col items-center gap-5 pt-1">
                        {/* Facebook Icon + Ring */}
                        <div className="relative flex items-center justify-center w-16 h-16">
                            {/* Rotating Facebook gradient ring */}
                            {!done && (
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: 'conic-gradient(from 0deg, #1877F2, #42B72A, #1877F2, #0866FF, #1877F2)',
                                        animation: 'spin 1.4s linear infinite',
                                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black 0)',
                                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black 0)',
                                    }}
                                />
                            )}

                            {/* Success ring */}
                            {done && (
                                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-400 transition-all duration-300" />
                            )}

                            {/* Inner Facebook logo */}
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center z-10">
                                {done ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <h3 className="font-semibold text-slate-800 text-base">
                                {done ? 'Welcome to GoCart' : 'Securing Your Session'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {done ? 'Redirecting to your shopping experience...' : STEPS[step] || 'Please wait a moment...'}
                            </p>
                        </div>

                        {/* Step dots */}
                        <div className="flex gap-2">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        done || i < step
                                            ? 'w-5 bg-emerald-400'
                                            : i === step
                                            ? 'w-5 bg-[#1877F2]'
                                            : 'w-1.5 bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Step list */}
                        <div className="w-full space-y-2 text-left">
                            {STEPS.map((label, i) => {
                                const isActive = i === step && !done
                                const isComplete = done || i < step
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                                            isComplete
                                                ? 'text-slate-500'
                                                : isActive
                                                ? 'text-slate-800 font-medium'
                                                : 'text-slate-300'
                                        }`}
                                    >
                                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                            {isComplete ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : isActive ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1877F2]" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            )}
                                        </div>
                                        <span>{label}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Secure · Encrypted · Private</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
