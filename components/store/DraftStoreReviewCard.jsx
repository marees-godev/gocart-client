'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Store,
    Mail,
    Phone,
    MapPin,
    FileText,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Send,
    Edit3,
    Clock,
    Sparkles,
    ShieldAlert
} from 'lucide-react'
import { graphqlRequest } from '@/lib/apiClient'
import { SUBMIT_STORE_MUTATION } from '@/lib/graphql/store'
import toast from 'react-hot-toast'

export default function DraftStoreReviewCard({ store, onSubmitted, showEditLink = true }) {
    const [submitting, setSubmitting] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)

    if (!store) return null

    const storeLogo = store.logoUrl || store.logo
    const storeName = store.name || 'Your Store'
    const approvalStatus = store.approvalStatus || 'DRAFT'
    const isDraft = approvalStatus === 'DRAFT' || approvalStatus === 'draft'

    const handleSubmitApplication = async () => {
        if (!store.id) return

        setSubmitting(true)
        try {
            const res = await graphqlRequest(SUBMIT_STORE_MUTATION, { id: store.id })
            const updatedApproval = res?.submitStore?.approvalStatus || 'PENDING'
            toast.success("Store submitted for admin review successfully!")
            if (onSubmitted) {
                onSubmitted(updatedApproval, res?.submitStore)
            }
        } catch (error) {
            console.error('Failed to submit draft store:', error)
            toast.error(error.message || "Failed to submit store for review")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-md overflow-hidden transition-all">
            {/* Header Ribbon */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-5 sm:px-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <AlertCircle size={22} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold tracking-widest uppercase bg-black/20 px-2.5 py-0.5 rounded-full">
                                Draft Application
                            </span>
                            <span className="text-xs text-amber-100">• Pending Admin Submission</span>
                        </div>
                        <h2 className="text-lg font-bold mt-0.5">Review Store Application Details</h2>
                    </div>
                </div>

                {showEditLink && (
                    <Link
                        href="/store/settings"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-semibold hover:bg-amber-50 transition shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
                    >
                        <Edit3 size={13} /> Edit Store Details
                    </Link>
                )}
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Notice message */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                    <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p>
                        <strong>Review before submitting:</strong> Platform administrators can only approve stores after they are submitted. Please review the details below to verify your business contact info, physical address, and store identity are accurate.
                    </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store Profile & Branding */}
                    <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Store Identity & Branding
                        </p>

                        <div className="flex items-center gap-4">
                            {storeLogo && typeof storeLogo === 'string' && storeLogo.startsWith('http') ? (
                                <img
                                    src={storeLogo}
                                    alt={storeName}
                                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-slate-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                                    {storeName.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div>
                                <h3 className="text-base font-bold text-slate-900">{storeName}</h3>
                                <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                    <span>/shop/{store.slug || 'slug'}</span>
                                </p>
                                <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                    Status: DRAFT
                                </span>
                            </div>
                        </div>

                        {store.description && (
                            <div className="pt-2 border-t border-slate-200/60">
                                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                                    <FileText size={13} className="text-slate-400" /> Description / Bio
                                </p>
                                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                                    {store.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Contact & Location Details */}
                    <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Business Contact & Address
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/60">
                                <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business Email</p>
                                    <p className="text-xs font-medium text-slate-800">
                                        {store.businessEmail || <span className="text-slate-400 italic">Not provided</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/60">
                                <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Number</p>
                                    <p className="text-xs font-medium text-slate-800">
                                        {store.businessPhone || <span className="text-slate-400 italic">Not provided</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/60">
                                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physical / Warehouse Address</p>
                                    <p className="text-xs font-medium text-slate-800 leading-relaxed">
                                        {store.address || <span className="text-slate-400 italic">Not provided</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirmation Checkbox & Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                        <input
                            type="checkbox"
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                        <span>I have reviewed the store details and confirm that all information is accurate.</span>
                    </label>

                    <div className="flex items-center gap-3 shrink-0">
                        {showEditLink && (
                            <Link
                                href="/store/settings"
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
                            >
                                Edit Details
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={handleSubmitApplication}
                            disabled={submitting || !isConfirmed}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-md transition active:scale-95"
                            title={!isConfirmed ? "Please check the confirmation box first" : "Submit to admin"}
                        >
                            <Send size={14} />
                            {submitting ? "Submitting Application..." : "Submit Store for Admin Approval"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
