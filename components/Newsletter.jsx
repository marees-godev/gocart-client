'use client'

import React, { useState } from 'react'
import { Mail, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Newsletter() {
    const [email, setEmail] = useState('')
    const [subscribed, setSubscribed] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address')
            return
        }
        setSubscribed(true)
        toast.success('Welcome to GoCart VIP! Your 10% coupon has been sent.')
        setEmail('')
    }

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 my-16 sm:my-24 select-none'>
            <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-slate-800/80 overflow-hidden text-center">
                {/* Ambient Glows */}
                <div className="absolute top-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={12} className="text-emerald-400" />
                        Join GoCart VIP Club
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                        Unlock 10% Off Your Next Order.
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                        Get weekly insider drop alerts, limited discount vouchers, and early access to flash sales delivered straight to your inbox.
                    </p>

                    {subscribed ? (
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-semibold text-sm">
                            <CheckCircle2 size={18} /> You're on the list! Check your inbox for your 10% coupon.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2.5 max-w-md mx-auto pt-2">
                            <div className="relative w-full">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 transition"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 shrink-0 cursor-pointer flex items-center justify-center gap-2"
                            >
                                Subscribe <ArrowRight size={15} />
                            </button>
                        </form>
                    )}

                    <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
                        <span className="flex items-center gap-1">
                            <ShieldCheck size={13} className="text-emerald-400" /> Zero spam
                        </span>
                        <span>•</span>
                        <span>Unsubscribe anytime with 1-click</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
