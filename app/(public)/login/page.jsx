'use client'

import React, { useReducer, useState } from 'react'
import Link from 'next/link'
import {
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    Truck,
    Sparkles,
    ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { apiClient, graphqlRequest } from '@/lib/apiClient'
import { setAuth } from '@/lib/features/auth/authSlice'
import toast from 'react-hot-toast'
import { LOGIN_MUTATION, REGISTER_MUTATION } from '@/lib/graphql/auth'

export default function LoginPage() {

    const [authMode, setAuthMode] = useState('login')
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: "",
        email: '',
        isMerchant: false,
        password: '',
        confirmPassword: '',
        rememberMe: false,
        agreeTerms: true,
    })

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }


    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {

            let authData

            if (authMode === 'login') {
                const response = await graphqlRequest(LOGIN_MUTATION, {
                    email: formData.email,
                    password: formData.password
                })
                authData = response.login
            } else {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords doesn't match")
                }
                const response = await graphqlRequest(REGISTER_MUTATION, {
                    input: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        password: formData.password,
                        isMerchant: formData.isMerchant || false,
                    }
                })

                authData = response.register
            }

            const token = authData.token
            let user = authData.user

            // If backend only returns token on register, extract user info or decode from token
            if (!user && token) {
                try {
                    const base64Url = token.split('.')[1]
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                    const decoded = JSON.parse(atob(base64))
                    user = {
                        id: decoded.userId || decoded.id || '',
                        name: decoded.name || `${formData.firstName} ${formData.lastName}`.trim(),
                        email: decoded.email || formData.email,
                        role: decoded.role || (formData.isMerchant ? 'MERCHANT' : 'USER'),
                    }
                } catch {
                    user = {
                        name: `${formData.firstName} ${formData.lastName}`.trim() || formData.email,
                        email: formData.email,
                        role: formData.isMerchant ? 'MERCHANT' : 'USER',
                    }
                }
            }

            localStorage.setItem('token', token)
            if (user) localStorage.setItem('user', JSON.stringify(user))
            document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`

            dispatch(setAuth({
                user: user, 
                token: token
            }))

            toast.success(authMode === 'login' ? `Welcome back, ${user?.name || 'User'}!` : 'Account created successfully!')

            const redirectUrl = searchParams.get('redirect')
            if (redirectUrl) {
                router.push(redirectUrl)
                return
            }

            const userRole = user?.role || (formData.isMerchant ? 'MERCHANT' : 'USER')
            switch (userRole) {
                case 'ADMIN':
                    router.push('/admin')
                    break;
                case 'MERCHANT':
                    router.push('/store')
                    break;
                case 'USER':
                default:
                    router.push('/')
                    break;
            }

        } catch (err) {
            toast.error(err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
            <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">

                {/* Left Side: Brand Promo / Visual Highlight */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    {/* Decorative background glows */}
                    <div className="absolute -top-16 -right-16 w-60 h-60 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative space-y-6">
                        {/* Logo */}
                        <Link href="/" className="inline-block text-3xl font-bold tracking-tight">
                            <span className="text-green-400">go</span>cart<span className="text-green-400 text-4xl leading-none">.</span>
                        </Link>

                        <div className="space-y-2 pt-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                                <Sparkles size={13} /> Exclusive Shopping Experience
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
                                {authMode === 'login' && 'Welcome back to seamless shopping.'}
                                {authMode === 'register' && 'Join thousands of happy shoppers today.'}
                                {authMode === 'forgot' && 'Reset your password in seconds.'}
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Discover curated products, lightning-fast delivery, and guaranteed buyer protection.
                            </p>
                        </div>
                    </div>

                    {/* Features list */}
                    <div className="relative space-y-3.5 pt-8 border-t border-slate-700/60 my-6 lg:my-0">
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="p-1.5 rounded-lg bg-green-500/20 text-green-400 shrink-0">
                                <Truck size={17} />
                            </div>
                            <span>Express doorstep delivery nationwide</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                                <ShieldCheck size={17} />
                            </div>
                            <span>100% secure encrypted checkout</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                                <CheckCircle2 size={17} />
                            </div>
                            <span>Verified customer reviews & instant returns</span>
                        </div>
                    </div>

                    {/* Bottom footer quote */}
                    <div className="relative text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} GoCart Inc. All rights reserved.
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">

                    {/* Header with Switcher Tabs */}
                    <div className="mb-8">
                        {authMode === 'forgot' ? (
                            <button
                                type="button"
                                onClick={() => setAuthMode('login')}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition"
                            >
                                <ArrowLeft size={14} /> Back to Sign In
                            </button>
                        ) : null}

                        <h3 className="text-2xl font-bold text-slate-900">
                            {authMode === 'login' && 'Sign in to your account'}
                            {authMode === 'register' && 'Create your free account'}
                            {authMode === 'forgot' && 'Reset your password'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {authMode === 'login' && 'Enter your credentials to access your account.'}
                            {authMode === 'register' && 'Fill in your details below to get started.'}
                            {authMode === 'forgot' && "Enter your email and we'll send you a recovery link."}
                        </p>
                    </div>

                    {/* Social Logins (shown for login and register) */}
                    {authMode !== 'forgot' && (
                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm active:scale-98"
                                >
                                    {/* Google SVG Icon */}
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path
                                            fill="#EA4335"
                                            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                                        />
                                        <path
                                            fill="#4285F4"
                                            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                                        />
                                    </svg>
                                    <span>Google</span>
                                </button>

                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm active:scale-98"
                                >
                                    {/* GitHub SVG Icon */}
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                        />
                                    </svg>
                                    <span>GitHub</span>
                                </button>
                            </div>

                            <div className="relative flex items-center justify-center">
                                <div className="border-t border-slate-200 w-full" />
                                <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-medium absolute">
                                    Or continue with email
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Name Input (Register Mode only) */}
                        {authMode === 'register' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="Alex"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-sm transition"
                                        />
                                        <User size={17} className="absolute left-3.5 top-3 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Morgan"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-sm transition"
                                        />
                                        <User size={17} className="absolute left-3.5 top-3 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-sm transition"
                                />
                                <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
                            </div>
                        </div>

                        {/* Password Input (Login & Register modes) */}
                        {authMode !== 'forgot' && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Password
                                    </label>
                                    {authMode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => setAuthMode('forgot')}
                                            className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-sm transition"
                                    />
                                    <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password (Register Mode only) */}
                        {authMode === 'register' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-sm transition"
                                    />
                                    <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Remember Me / Terms Checkboxes */}
                        {authMode === 'login' && (
                            <div className="flex items-center pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <span>Remember me for 30 days</span>
                                </label>
                            </div>
                        )}

                        {authMode === 'register' && (
                            <div className="flex items-start gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    id="agreeTerms"
                                    required
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <label htmlFor="agreeTerms" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-slate-800 underline font-medium">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-slate-800 underline font-medium">
                                        Privacy Policy
                                    </Link>
                                    .
                                </label>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-md hover:shadow-lg active:scale-98 transition-all mt-2"
                            disabled={loading || (authMode === 'register' && !formData.agreeTerms)}
                        >
                            <span>
                                {authMode === 'login' && 'Sign In to Account'}
                                {authMode === 'register' && 'Create Account'}
                                {authMode === 'forgot' && 'Send Reset Instructions'}
                            </span>
                            <ArrowRight size={16} />
                        </button>
                    </form>

                    {/* Bottom Mode Switch Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
                        {authMode === 'login' && (
                            <p>
                                Don&apos;t have an account yet?{' '}
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('register')}
                                    className="font-semibold text-green-600 hover:text-green-700 hover:underline"
                                >
                                    Sign up for free
                                </button>
                            </p>
                        )}

                        {authMode === 'register' && (
                            <p>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className="font-semibold text-green-600 hover:text-green-700 hover:underline"
                                >
                                    Sign in here
                                </button>
                            </p>
                        )}

                        {authMode === 'forgot' && (
                            <p>
                                Remembered your password?{' '}
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className="font-semibold text-green-600 hover:text-green-700 hover:underline"
                                >
                                    Return to sign in
                                </button>
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
