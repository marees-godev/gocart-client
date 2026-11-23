'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { ArrowRight, Flame, Clock, Sparkles } from 'lucide-react'

export default function PromoBanner() {
    const products = useSelector((state) => state.product?.list || [])
    const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 15 })

    // Compute actual max discount from products
    const maxDiscount = useMemo(() => {
        if (!Array.isArray(products) || products.length === 0) return null
        const validDiscounts = products.map(p => {
            const pPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0
            const pMrp = typeof p.mrp === 'number' ? p.mrp : parseFloat(p.mrp) || 0
            return pMrp > pPrice ? Math.round(((pMrp - pPrice) / pMrp) * 100) : 0
        }).filter(d => d > 0)
        return validDiscounts.length > 0 ? Math.max(...validDiscounts) : null
    }, [products])

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
                if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
                return { hours: 12, minutes: 0, seconds: 0 }
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const pad = (n) => String(n).padStart(2, '0')

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 my-14 sm:my-20 select-none">
            <div className="relative bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl border border-emerald-900/60">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Left: Deal copy */}
                    <div className="max-w-xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wider uppercase">
                            <Flame size={13} className="text-amber-400 fill-amber-400" />
                            Flash Sale Exclusive
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                            Upgrade Your Tech Arsenal. <br />
                            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                                {maxDiscount ? `Up to ${maxDiscount}% OFF Top Tier Gear.` : 'Up to 20% OFF Top Tier Gear.'}
                            </span>
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Limited merchant inventory on certified ANC headphones, AMOLED displays, and precision chronographs. Instant checkout with free express delivery.
                        </p>
                    </div>

                    {/* Right: Countdown & CTA */}
                    <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end gap-5 shrink-0">
                        {/* Countdown Timers */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold mb-1">
                                <Clock size={14} className="text-emerald-400 animate-pulse" />
                                <span>Offer Ends In:</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono font-bold text-sm">
                                <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-center min-w-11">
                                    <span className="text-white text-base block">{pad(timeLeft.hours)}</span>
                                    <span className="text-[9px] text-slate-400 uppercase font-sans">Hrs</span>
                                </div>
                                <span className="text-emerald-400 font-bold">:</span>
                                <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-center min-w-11">
                                    <span className="text-white text-base block">{pad(timeLeft.minutes)}</span>
                                    <span className="text-[9px] text-slate-400 uppercase font-sans">Min</span>
                                </div>
                                <span className="text-emerald-400 font-bold">:</span>
                                <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-center min-w-11">
                                    <span className="text-amber-300 text-base block">{pad(timeLeft.seconds)}</span>
                                    <span className="text-[9px] text-slate-400 uppercase font-sans">Sec</span>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40"
                        >
                            Claim Flash Deals <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
