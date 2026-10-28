'use client'

import React, { useState, useEffect } from 'react'
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
    ToggleRight,
    Send,
    CheckCircle2,
    XCircle,
    Globe,
    ExternalLink
} from 'lucide-react'
import { useStore } from '@/components/store/StoreLayout'
import { graphqlRequest } from '@/lib/apiClient'
import {
    UPDATE_STORE_MUTATION,
    PUBLISH_STORE_MUTATION,
    UNPUBLISH_STORE_MUTATION
} from '@/lib/graphql/store'
import toast from 'react-hot-toast'

export default function MerchantStoreSettings() {
    const { storeInfo, refetchStore, submittingStatus, submitDraftStore } = useStore()
    const [activeTab, setActiveTab] = useState('general') // 'general' | 'payout' | 'policies'
    const [saving, setSaving] = useState(false)
    const [togglingPublish, setTogglingPublish] = useState(false)

    // Form state initialized from merchant's actual store
    const [storeData, setStoreData] = useState({
        name: '',
        username: '',
        email: '',
        contact: '',
        description: '',
        address: '',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        taxId: '',
        logo: null,
        banner: null,
        isVacationMode: false,
        vacationMessage: "We're currently taking a short break. Orders will resume shortly!",
        currency: 'USD ($)',
        payoutMethod: 'bank_transfer',
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        routingNumber: ''
    })

    // Sync form state when storeInfo is loaded/refetched
    useEffect(() => {
        if (storeInfo) {
            setStoreData(prev => ({
                ...prev,
                name: storeInfo.name || '',
                username: storeInfo.slug || '',
                email: storeInfo.businessEmail || '',
                contact: storeInfo.businessPhone || '',
                description: storeInfo.description || '',
                address: storeInfo.address || '',
                logo: storeInfo.logoUrl || null,
                isVacationMode: Boolean(storeInfo.isVacationMode),
                taxId: storeInfo.gstin || prev.taxId,
                accountHolderName: prev.accountHolderName || storeInfo.name || '',
            }))
        }
    }, [storeInfo])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setStoreData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleTogglePublish = async () => {
        if (!storeInfo?.id) return
        setTogglingPublish(true)
        try {
            if (storeInfo.isPublished) {
                await graphqlRequest(UNPUBLISH_STORE_MUTATION, { id: storeInfo.id })
                toast.success("Storefront unpublished from public directory")
            } else {
                await graphqlRequest(PUBLISH_STORE_MUTATION, { id: storeInfo.id })
                toast.success("Storefront published live to shoppers!")
            }
            if (refetchStore) await refetchStore()
        } catch (err) {
            console.error("Error toggling store publish state:", err)
            toast.error(err.message || "Failed to update publish state")
        } finally {
            setTogglingPublish(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!storeInfo?.id) {
            toast.error("No store record found to update")
            return
        }

        setSaving(true)
        try {
            const cleanSlug = (storeData.username || storeData.name)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')

            await graphqlRequest(UPDATE_STORE_MUTATION, {
                input: {
                    id: storeInfo.id,
                    name: storeData.name.trim(),
                    slug: cleanSlug,
                    description: storeData.description.trim(),
                    businessEmail: storeData.email.trim(),
                    businessPhone: storeData.contact.trim(),
                    address: storeData.address.trim(),
                    logoUrl: typeof storeData.logo === 'string' ? storeData.logo : "",
                    isVacationMode: Boolean(storeData.isVacationMode)
                }
            })

            toast.success("Store settings updated successfully!")
            if (refetchStore) await refetchStore()
        } catch (err) {
            console.error("Failed to update store settings:", err)
            toast.error(err.message || "Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const approvalStatus = storeInfo?.approvalStatus || 'DRAFT'
    const isDraft = approvalStatus === 'DRAFT' || approvalStatus === 'draft'
    const isApproved = approvalStatus === 'APPROVED' || approvalStatus === 'approved'
    const isPending = approvalStatus === 'PENDING' || approvalStatus === 'pending'
    const isRejected = approvalStatus === 'REJECTED' || approvalStatus === 'rejected'

    return (
        <div className="text-slate-600 mb-28 max-w-5xl space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl text-slate-500">
                    Store <span className="text-slate-800 font-medium">Settings</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Manage your merchant profile, branding, lifecycle status, and store operations.
                </p>
            </div>

            {/* Store Status & Lifecycle Control Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Store Approval Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                isApproved
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isDraft
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : isRejected
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                                {isApproved ? '● Active & Approved' : `Status: ${approvalStatus}`}
                            </span>

                            {storeInfo?.slug && isApproved && (
                                <a
                                    href={`/shop/${storeInfo.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:underline"
                                >
                                    /shop/{storeInfo.slug} <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Action button based on status */}
                    <div className="flex items-center gap-3">
                        {isDraft && (
                            <button
                                type="button"
                                onClick={() => submitDraftStore(storeInfo?.id)}
                                disabled={submittingStatus}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                            >
                                <Send size={14} />
                                {submittingStatus ? "Submitting..." : "Submit Store for Admin Review"}
                            </button>
                        )}

                        {isRejected && (
                            <button
                                type="button"
                                onClick={() => submitDraftStore(storeInfo?.id)}
                                disabled={submittingStatus}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                            >
                                <Send size={14} />
                                {submittingStatus ? "Submitting..." : "Re-submit Application"}
                            </button>
                        )}

                        {isApproved && (
                            <button
                                type="button"
                                onClick={handleTogglePublish}
                                disabled={togglingPublish}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                                    storeInfo?.isPublished
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                }`}
                            >
                                <Globe size={14} />
                                {togglingPublish
                                    ? "Updating..."
                                    : storeInfo?.isPublished
                                    ? "Storefront Live (Click to Unpublish)"
                                    : "Storefront Hidden (Click to Publish)"}
                            </button>
                        )}
                    </div>
                </div>

                {isDraft && (
                    <div className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex items-start gap-2.5">
                        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p>
                            <strong>Action Required:</strong> Your store application is currently in <strong>Draft</strong> status. GoCart administrators cannot view or approve draft applications. Submit your application so our team can approve your store and activate public sales.
                        </p>
                    </div>
                )}

                {isPending && (
                    <div className="text-xs text-blue-800 bg-blue-50 p-3.5 rounded-xl border border-blue-200 flex items-start gap-2.5">
                        <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <p>
                            <strong>Application in Review:</strong> Your store has been submitted to administrators. You can configure your catalog items while waiting for administrator approval.
                        </p>
                    </div>
                )}

                {isRejected && (
                    <div className="text-xs text-rose-800 bg-rose-50 p-3.5 rounded-xl border border-rose-200 flex items-start gap-2.5">
                        <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <p>
                            <strong>Application Rejected:</strong> {storeInfo?.rejectionReason || "Please review your store information and re-submit your application."}
                        </p>
                    </div>
                )}
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
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? "Saving Settings..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    )
}
