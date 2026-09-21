'use client'

import React, { useState } from 'react'
import {
    TicketPercent,
    Plus,
    Trash2,
    Calendar,
    CheckCircle2,
    Clock,
    X,
    Copy,
    Tag
} from 'lucide-react'

export default function MerchantCoupons() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Mock store coupons list
    const [coupons, setCoupons] = useState([
        {
            id: 'cp_1',
            code: 'SUMMER20',
            discount: 20,
            type: 'PERCENTAGE', // 'PERCENTAGE' | 'FIXED'
            minPurchase: 50,
            usesCount: 142,
            usageLimit: 500,
            expiresAt: '2026-10-31',
            isActive: true
        },
        {
            id: 'cp_2',
            code: 'FLAT10OFF',
            discount: 10,
            type: 'FIXED',
            minPurchase: 40,
            usesCount: 89,
            usageLimit: 200,
            expiresAt: '2026-11-15',
            isActive: true
        },
        {
            id: 'cp_3',
            code: 'WELCOME5',
            discount: 5,
            type: 'PERCENTAGE',
            minPurchase: 25,
            usesCount: 320,
            usageLimit: 1000,
            expiresAt: '2025-12-31',
            isActive: false
        }
    ])

    // New Coupon form state
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount: '',
        type: 'PERCENTAGE',
        minPurchase: '',
        usageLimit: '',
        expiresAt: ''
    })

    const handleCreateCoupon = (e) => {
        e.preventDefault()
        // TODO: Insert backend API logic for creating coupon
        const created = {
            id: `cp_${Date.now()}`,
            code: newCoupon.code.toUpperCase(),
            discount: Number(newCoupon.discount),
            type: newCoupon.type,
            minPurchase: Number(newCoupon.minPurchase || 0),
            usesCount: 0,
            usageLimit: Number(newCoupon.usageLimit || 100),
            expiresAt: newCoupon.expiresAt,
            isActive: true
        }
        setCoupons([created, ...coupons])
        setIsModalOpen(false)
        setNewCoupon({ code: '', discount: '', type: 'PERCENTAGE', minPurchase: '', usageLimit: '', expiresAt: '' })
    }

    const toggleStatus = (id) => {
        setCoupons((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
        )
    }

    return (
        <div className="text-slate-600 mb-28 max-w-5xl space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl text-slate-500">
                        Store <span className="text-slate-800 font-medium">Coupons & Discounts</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Create promo codes and discount vouchers to boost your storefront sales.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium shadow-sm transition"
                >
                    <Plus size={17} /> Create New Coupon
                </button>
            </div>

            {/* Coupons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {coupons.map((coupon) => (
                    <div
                        key={coupon.id}
                        className={`relative bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${
                            coupon.isActive
                                ? 'border-slate-200 hover:border-green-300'
                                : 'border-slate-200 opacity-60 bg-slate-50'
                        }`}
                    >
                        {/* Top Code Badge & Status */}
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-sm tracking-wider">
                                <Tag size={14} className="text-green-400" />
                                {coupon.code}
                            </div>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    coupon.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                                {coupon.isActive ? 'Active' : 'Disabled'}
                            </span>
                        </div>

                        {/* Discount Value */}
                        <div className="space-y-1">
                            <div className="text-3xl font-extrabold text-slate-800">
                                {coupon.type === 'PERCENTAGE' ? `${coupon.discount}% OFF` : `$${coupon.discount} OFF`}
                            </div>
                            <p className="text-xs text-slate-400">
                                Min order: ${coupon.minPurchase} &bull; Usage limit: {coupon.usageLimit}
                            </p>
                        </div>

                        {/* Usage Progress Bar */}
                        <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Redeemed</span>
                                <span className="font-semibold">{coupon.usesCount} / {coupon.usageLimit}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${Math.min(100, (coupon.usesCount / coupon.usageLimit) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Expiration & Active Toggle */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar size={13} /> Exp: {coupon.expiresAt}
                            </span>
                            <button
                                type="button"
                                onClick={() => toggleStatus(coupon.id)}
                                className={`font-semibold hover:underline ${
                                    coupon.isActive ? 'text-amber-600' : 'text-green-600'
                                }`}
                            >
                                {coupon.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Coupon Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-bold text-slate-900">Create New Coupon</h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Coupon Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. FLASH25"
                                    value={newCoupon.code}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm uppercase font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Discount Type
                                    </label>
                                    <select
                                        value={newCoupon.type}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm bg-white"
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Flat ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Discount Value
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="e.g. 20"
                                        value={newCoupon.discount}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Min Purchase ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 50"
                                        value={newCoupon.minPurchase}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Usage Limit
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 250"
                                        value={newCoupon.usageLimit}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Expiration Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={newCoupon.expiresAt}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-slate-800 text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-md transition"
                            >
                                Save & Activate Coupon
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
