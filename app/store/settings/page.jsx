'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
    Store,
    Mail,
    Phone,
    MapPin,
    Building2,
    DollarSign,
    Clock,
    Camera,
    Save,
    AlertCircle,
    ShieldCheck,
    CreditCard,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import { assets, dummyStoreData } from '@/assets/assets'

export default function MerchantStoreSettings() {
    const [activeTab, setActiveTab] = useState('general') // 'general' | 'payout' | 'policies'

    // Form state (Ready for JS / API integration)
    const [storeData, setStoreData] = useState({
        name: dummyStoreData?.name || 'Happy Shop',
        username: dummyStoreData?.username || 'happyshop',
        email: dummyStoreData?.email || 'happyshop@example.com',
        contact: dummyStoreData?.contact || '+1 (555) 019-2834',
        description: dummyStoreData?.description || '',
        address: dummyStoreData?.address || '123 Market Street, Suite 500, New York, NY 10001',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        taxId: 'US-984729104',
        logo: dummyStoreData?.logo || null,
        banner: null,
        isVacationMode: false,
        vacationMessage: "We're currently taking a short break. Orders will resume next Monday!",
        currency: 'USD ($)',
        payoutMethod: 'bank_transfer',
        accountHolderName: 'Happy Shop LLC',
        bankName: 'JPMorgan Chase',
        accountNumber: '••••••••8921',
        routingNumber: '021000021'
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setStoreData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // TODO: Integrate with your backend API update endpoint
        console.log('Saved Merchant Store Settings:', storeData)
    }

    return (
        <div className="text-slate-600 mb-28 max-w-5xl space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl text-slate-500">
                    Store <span className="text-slate-800 font-medium">Settings</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Manage your merchant profile, branding, payout accounts, and store preferences.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === 'general'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    Store Profile & Branding
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('payout')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === 'payout'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    Payout & Banking
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('policies')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === 'policies'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    Store Operations & Vacation
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* TAB 1: GENERAL STORE PROFILE */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Store Branding</h3>
                            <p className="text-xs text-slate-400">Upload your storefront logo and brand imagery.</p>
                        </div>

                        {/* Store Logo & Branding Upload */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                    {storeData.logo ? (
                                        <Image
                                            src={storeData.logo}
                                            alt="Store Logo"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Store size={32} className="text-slate-400" />
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 p-2 bg-slate-900 text-white rounded-full shadow-md cursor-pointer hover:bg-slate-800 transition">
                                    <Camera size={14} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setStoreData({
                                                    ...storeData,
                                                    logo: URL.createObjectURL(e.target.files[0])
                                                })
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-slate-800">Storefront Logo</h4>
                                <p className="text-xs text-slate-400">
                                    Recommended format: PNG, JPG, or SVG. Min size: 400x400px.
                                </p>
                            </div>
                        </div>

                        {/* Form Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={storeData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                    placeholder="e.g. Happy Shop"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Store Username (URL Slug)
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-xs text-slate-400 select-none">gocart.com/shop/</span>
                                    <input
                                        type="text"
                                        name="username"
                                        value={storeData.username}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-32 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                        placeholder="happyshop"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Business Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={storeData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                    />
                                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Business Phone Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        name="contact"
                                        value={storeData.contact}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                    />
                                    <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Store Description / Bio
                            </label>
                            <textarea
                                rows={4}
                                name="description"
                                value={storeData.description}
                                onChange={handleChange}
                                placeholder="Describe what makes your store unique..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Physical Business Address
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="address"
                                    value={storeData.address}
                                    onChange={handleChange}
                                    placeholder="Street, Building, Suite #"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                />
                                <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: PAYOUT & BANKING */}
                {activeTab === 'payout' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Payout & Financial Settings</h3>
                            <p className="text-xs text-slate-400">
                                Configure where your earnings and order disbursements are deposited.
                            </p>
                        </div>

                        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                            <ShieldCheck size={20} className="text-green-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-green-800">
                                <span className="font-semibold">Automated Bi-Weekly Payouts Enabled:</span> Earnings from fulfilled orders are automatically transferred to your designated bank account every other Monday.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Account Holder Full Name
                                </label>
                                <input
                                    type="text"
                                    name="accountHolderName"
                                    value={storeData.accountHolderName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    name="bankName"
                                    value={storeData.bankName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Account Number / IBAN
                                </label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    value={storeData.accountNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Routing Number / SWIFT
                                </label>
                                <input
                                    type="text"
                                    name="routingNumber"
                                    value={storeData.routingNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Tax ID / GSTIN / EIN
                                </label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={storeData.taxId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: STORE OPERATIONS & VACATION */}
                {activeTab === 'policies' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Store Operations & Availability</h3>
                            <p className="text-xs text-slate-400">
                                Temporarily pause orders or configure your store availability.
                            </p>
                        </div>

                        {/* Vacation Mode Toggle */}
                        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <Clock size={16} className="text-slate-500" /> Vacation / Maintenance Mode
                                </h4>
                                <p className="text-xs text-slate-500 max-w-xl">
                                    When enabled, your products will remain visible to customers, but checkout will be paused with a friendly notification message.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStoreData((prev) => ({ ...prev, isVacationMode: !prev.isVacationMode }))}
                                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                    storeData.isVacationMode ? 'bg-amber-500' : 'bg-slate-300'
                                }`}
                            >
                                <div
                                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                                        storeData.isVacationMode ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {storeData.isVacationMode && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Vacation Banner Message
                                </label>
                                <textarea
                                    rows={3}
                                    name="vacationMessage"
                                    value={storeData.vacationMessage}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 text-sm bg-amber-50/20 resize-none"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button */}
                <div className="flex items-center justify-end gap-4">
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-md active:scale-95 transition-all"
                    >
                        <Save size={16} /> Save Settings
                    </button>
                </div>
            </form>
        </div>
    )
}
