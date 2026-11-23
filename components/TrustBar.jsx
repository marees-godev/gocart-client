'use client'

import React from 'react'
import { Truck, ShieldCheck, CreditCard, RefreshCw, Sparkles } from 'lucide-react'
import { useCurrency } from '@/lib/features/currency/useCurrency'

export default function TrustBar() {
    const { formatPrice } = useCurrency()

    const PERKS = [
        {
            icon: Truck,
            title: 'Free Express Shipping',
            description: `On orders above ${formatPrice(499)} with doorstep tracking`,
            badge: 'Fast Dispatch',
            accent: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
        },
        {
            icon: ShieldCheck,
            title: '100% Guaranteed Genuine',
            description: 'Certified merchant quality & verified authenticity',
            badge: 'Verified',
            accent: 'text-blue-600 bg-blue-50 border-blue-200/80',
        },
        {
            icon: CreditCard,
            title: 'Secured Checkout',
            description: 'Encrypted payments via UPI, Cards & NetBanking',
            badge: '256-bit SSL',
            accent: 'text-purple-600 bg-purple-50 border-purple-200/80',
        },
        {
            icon: RefreshCw,
            title: '7-Day Easy Returns',
            description: 'Zero questions asked with instant refund options',
            badge: 'Hassle-Free',
            accent: 'text-amber-600 bg-amber-50 border-amber-200/80',
        },
    ]
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 my-10 sm:my-14 select-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                {PERKS.map((perk, i) => {
                    const Icon = perk.icon
                    return (
                        <div key={i} className="flex items-start gap-4 p-2 group">
                            <div className={`p-3 rounded-2xl border ${perk.accent} shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-2xs`}>
                                <Icon size={22} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-sm text-slate-800">{perk.title}</h4>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                                    {perk.description}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
