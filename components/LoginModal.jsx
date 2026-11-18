'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, 
    Mail, 
    Lock, 
    User, 
    ArrowRight, 
    Eye, 
    EyeOff, 
    Sparkles, 
    Loader2, 
    ShieldCheck,
    Info
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setAuth } from '@/lib/features/auth/authSlice';
import { graphqlRequest } from '@/lib/apiClient';
import { 
    LOGIN_MUTATION, 
    REGISTER_MUTATION, 
    VERIFY_EMAIL_MUTATION, 
    RESEND_VERIFICATION_EMAIL_MUTATION 
} from '@/lib/graphql/auth';
import { GET_ME_QUERY } from '@/lib/graphql/user';
import { getGoogleOAuthURL } from '@/lib/googleAuth';
import toast from 'react-hot-toast';

export default function LoginModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    title = "Sign in to continue",
    alertMessage = null
}) {
    const dispatch = useDispatch();

    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form inputs
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // OTP state
    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key and lock background scroll
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Resend OTP countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    if (!isOpen || !mounted) return null;

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAuthSuccess = (authData) => {
        const token = authData.token;
        const refreshToken = authData.refreshToken;
        const expiresIn = authData.expiresIn || 604800;

        let tokenPayload = {};
        try {
            const base64Url = token.split('.')[1];
            if (base64Url) {
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                tokenPayload = JSON.parse(atob(base64));
            }
        } catch {}

        const user = {
            id: tokenPayload.user_id || tokenPayload.userId || tokenPayload.sub || '',
            email: tokenPayload.email || formData.email,
            role: authData.role || tokenPayload.role || 'USER',
            name: tokenPayload.name || formData.firstName || 'User',
            firstName: tokenPayload.first_name || tokenPayload.firstName || formData.firstName || '',
            lastName: tokenPayload.last_name || tokenPayload.lastName || formData.lastName || '',
        };

        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(user));
            document.cookie = `token=${token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
        }

        dispatch(setAuth({ user, token }));

        // Fetch fresh profile in background
        graphqlRequest(GET_ME_QUERY)
            .then((res) => {
                if (res?.me) {
                    const me = res.me;
                    const fullName = `${me.firstName || ''} ${me.lastName || ''}`.trim();
                    const freshUser = {
                        ...user,
                        ...me,
                        name: fullName || me.username || user.name,
                    };
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('user', JSON.stringify(freshUser));
                    }
                    dispatch(setAuth({ user: freshUser, token }));
                }
            })
            .catch(() => {});

        toast.success(`Welcome back, ${user.firstName || user.name || 'Shopper'}!`);
        if (onSuccess) onSuccess(user);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                const res = await graphqlRequest(LOGIN_MUTATION, {
                    input: {
                        email: formData.email.trim(),
                        password: formData.password,
                        role: 'USER',
                    }
                });

                if (res?.login) {
                    handleAuthSuccess(res.login);
                } else {
                    throw new Error('Invalid login response from server');
                }
            } else if (mode === 'register') {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                if (formData.password.length < 6) {
                    throw new Error("Password must be at least 6 characters");
                }

                const res = await graphqlRequest(REGISTER_MUTATION, {
                    input: {
                        firstName: formData.firstName.trim(),
                        lastName: formData.lastName.trim(),
                        email: formData.email.trim(),
                        password: formData.password,
                        role: 'USER',
                    }
                });

                if (res?.register?.token) {
                    handleAuthSuccess(res.register);
                } else {
                    toast.success('Registration successful! Please check your email for the verification code.');
                    setMode('verify');
                    setResendCooldown(60);
                }
            } else if (mode === 'verify') {
                if (!otp || otp.trim().length === 0) {
                    throw new Error('Please enter the verification code');
                }

                const res = await graphqlRequest(VERIFY_EMAIL_MUTATION, {
                    email: formData.email.trim(),
                    otp: otp.trim(),
                    role: 'USER',
                });

                if (res?.verifyEmail) {
                    toast.success('Email verified successfully! Please sign in.');
                    setMode('login');
                } else {
                    throw new Error('Verification failed. Please check the code.');
                }
            }
        } catch (err) {
            const errorMsg = err.message || 'Authentication failed';
            if (errorMsg.toLowerCase().includes('not verified') || errorMsg.toLowerCase().includes('verify your email')) {
                toast('Please verify your email address to continue.', { icon: '📧' });
                setMode('verify');
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !formData.email) return;
        try {
            await graphqlRequest(RESEND_VERIFICATION_EMAIL_MUTATION, {
                email: formData.email.trim(),
                role: 'USER',
            });
            toast.success('Verification code resent!');
            setResendCooldown(60);
        } catch (err) {
            toast.error(err.message || 'Failed to resend code');
        }
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        >
            {/* Modal Box */}
            <div 
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-700 animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Close Button */}
                <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-green-50 text-green-600 border border-green-200/50">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                {mode === 'verify' ? 'Verify Email' : title}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {mode === 'verify' 
                                    ? `Enter the code sent to ${formData.email}`
                                    : 'Sign in to access saved addresses & complete order'}
                            </p>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
                        title="Close in 1 click and continue as guest"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Appealing UI Alert Banner */}
                {alertMessage && (
                    <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-green-50 border border-emerald-200/90 shadow-xs flex items-start gap-3 text-xs">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                            <ShieldCheck size={17} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 text-[13px]">Notice for Checkout</p>
                            <p className="text-slate-600 mt-0.5 leading-relaxed">
                                {alertMessage}
                            </p>
                        </div>
                    </div>
                )}

                {/* Mode Selector Tabs (only shown if not in OTP verification) */}
                {mode !== 'verify' && (
                    <div className="flex px-6 pt-4 border-b border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={() => setMode('login')}
                            className={`flex-1 pb-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
                                mode === 'login'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('register')}
                            className={`flex-1 pb-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
                                mode === 'register'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Create Account
                        </button>
                    </div>
                )}

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {mode === 'verify' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    6-Digit Verification Code
                                </label>
                                <input
                                    type="text"
                                    maxLength={8}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="••••••"
                                    required
                                    autoFocus
                                    className="w-full text-center text-xl font-mono tracking-widest py-2.5 px-4 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-slate-800 transition"
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                <span>Didn't receive code?</span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0}
                                    className="text-green-600 hover:underline font-medium disabled:opacity-50 cursor-pointer"
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className="text-xs text-slate-400 hover:text-slate-600 hover:underline block text-center w-full"
                            >
                                ← Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            {mode === 'register' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="Alex"
                                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-slate-800 transition"
                                            />
                                            <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Smith"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-slate-800 transition"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-slate-800 transition"
                                    />
                                    <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-slate-800 transition"
                                    />
                                    <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {mode === 'register' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-slate-800 transition"
                                        />
                                        <ShieldCheck size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-xs shadow-md shadow-green-600/20 active:scale-98 transition disabled:opacity-70 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" /> Processing...
                            </>
                        ) : mode === 'verify' ? (
                            'Verify Code'
                        ) : mode === 'register' ? (
                            'Create Account'
                        ) : (
                            'Sign In & Continue'
                        )}
                    </button>

                    {/* Google OAuth (only in login/register) */}
                    {mode !== 'verify' && (
                        <>
                            <div className="relative flex items-center justify-center py-1">
                                <div className="border-t border-slate-200 w-full" />
                                <span className="bg-white px-2 text-[11px] text-slate-400 uppercase font-medium absolute">
                                    or
                                </span>
                            </div>

                            <a
                                href={getGoogleOAuthURL('USER')}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition active:scale-98 cursor-pointer"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                Continue with Google
                            </a>
                        </>
                    )}
                </form>

                {/* Footer: Prominent option to continue browsing as guest */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Prefer not to sign in right now?</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="font-semibold text-green-700 hover:text-green-800 hover:underline cursor-pointer flex items-center gap-1"
                    >
                        Continue as Guest <ArrowRight size={13} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
