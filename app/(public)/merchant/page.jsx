'use client'

import React from 'react'
import Link from 'next/link'
import {
    Store,
    TrendingUp,
    ShieldCheck,
    CreditCard,
    ArrowRight,
    CheckCircle2,
    Users,
    Sparkles,
    BarChart3,
    Package
} from 'lucide-react'

export default function MerchantPortalLanding() {
    return (
        <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Hero Section */}
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 p-8 sm:p-14 text-white shadow-xl overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative max-w-2xl space-y-6">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                            <Sparkles size={14} /> GoCart Merchant Network
                        </span>
                        
                        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight">
                            Grow your business with the <span className="text-green-400">GoCart Seller Hub</span>.
                        </h1>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            Reach millions of shoppers, manage orders seamlessly, and scale your brand with industry-leading merchant tools, real-time analytics, and guaranteed payouts.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <Link
                                href="/merchant/login"
                                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-slate-950 font-bold text-sm shadow-lg transition active:scale-95"
                            >
                                <Store size={18} /> Sign In to Merchant Portal
                            </Link>
                            <Link
                                href="/create-store"
                                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition active:scale-95"
                            >
                                Register New Store <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Key Merchant Features Grid */}
                <div className="space-y-6">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            Everything you need to sell online
                        </h2>
                        <p className="text-sm text-slate-500">
                            A complete suite of merchant tools designed to save you time and maximize sales.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Advanced Analytics</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Monitor live sales performance, conversion metrics, customer demographics, and product revenue trends.
                            </p>
                            <Link href="/store/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:underline pt-2">
                                View Analytics Demo <ArrowRight size={13} />
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                                <Package size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Effortless Inventory</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Bulk upload catalog items, adjust pricing on the fly, toggle in-stock status, and manage multi-variant products.
                            </p>
                            <Link href="/store/manage-product" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline pt-2">
                                Manage Products <ArrowRight size={13} />
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                                <CreditCard size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Automated Payouts</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Direct deposit disbursements to your registered bank account on a predictable, bi-weekly schedule with transparent fee reporting.
                            </p>
                            <Link href="/store/settings" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline pt-2">
                                Payout Settings <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Merchant Navigation Directory */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Merchant Portal Pages</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <Link href="/store" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            📊 Dashboard Overview
                        </Link>
                        <Link href="/store/add-product" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            ➕ Add New Product
                        </Link>
                        <Link href="/store/manage-product" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            📦 Product Inventory
                        </Link>
                        <Link href="/store/orders" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            🛍️ Customer Orders
                        </Link>
                        <Link href="/store/analytics" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            📈 Revenue Analytics
                        </Link>
                        <Link href="/store/coupons" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            🏷️ Promo Coupons
                        </Link>
                        <Link href="/store/reviews" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            ⭐ Customer Reviews
                        </Link>
                        <Link href="/store/settings" className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 transition">
                            ⚙️ Store Profile & Payout
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    )
}
