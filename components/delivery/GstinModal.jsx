'use client'

import React, { useState, useEffect } from 'react'
import {
    ShieldCheck,
    AlertTriangle,
    X,
    FileText,
    CheckCircle2,
    Building2,
    Info
} from 'lucide-react'
import { graphqlRequest } from '@/lib/apiClient'
import { UPDATE_DELIVERY_PARTNER_PROFILE_MUTATION } from '@/lib/graphql/delivery'
import toast from 'react-hot-toast'

// Official Indian GSTIN format regex (matching backend regex):
// 2 digits state code + 5 letters PAN + 4 digits PAN + 1 letter PAN + 1 entity code + 'Z' + 1 checksum digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export default function GstinModal({ isOpen, onClose, partnerId, currentGstin, onSuccess }) {
    const [gstin, setGstin] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setGstin(currentGstin || '')
        }
    }, [isOpen, currentGstin])

    if (!isOpen) return null

    const cleanGstin = gstin.trim().toUpperCase()
    const isValidFormat = GSTIN_REGEX.test(cleanGstin)
    const isPristine = cleanGstin.length === 0

    const handleChange = (e) => {
        const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15)
        setGstin(val)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!partnerId) {
            toast.error('Partner ID missing. Please refresh and try again.')
            return
        }

        if (!cleanGstin) {
            toast.error('Please enter a 15-character GSTIN number')
            return
        }

        if (!isValidFormat) {
            toast.error('Invalid GSTIN format. Must be 15 alphanumeric characters matching Indian GST format.')
            return
        }

        setSubmitting(true)
        const toastId = toast.loading('Registering GSTIN with logistics network...')

        try {
            const input = {
                partnerId: String(partnerId),
                gstin: cleanGstin
            }

            const res = await graphqlRequest(UPDATE_DELIVERY_PARTNER_PROFILE_MUTATION, { input })
            if (res?.updateDeliveryPartnerProfile) {
                toast.success('GSTIN submitted for carrier verification!', { id: toastId })
                if (onSuccess) {
                    onSuccess(res.updateDeliveryPartnerProfile)
                }
                onClose()
            } else {
                toast.error('Failed to save GSTIN. Please try again.', { id: toastId })
            }
        } catch (err) {
            toast.error(err.message || 'Error updating GSTIN', { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                {currentGstin ? 'Update GSTIN Registration' : 'Register GSTIN Number'}
                            </h3>
                            <p className="text-xs text-slate-500">Carrier Tax & Compliance Verification</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                            <span>15-Character GST Identification Number</span>
                            <span className="font-mono text-[10px] text-slate-400">
                                {cleanGstin.length}/15 chars
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={cleanGstin}
                                onChange={handleChange}
                                placeholder="22AAAAA0000A1Z5"
                                maxLength={15}
                                autoFocus
                                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono tracking-wider text-sm font-bold uppercase transition outline-none ${
                                    isPristine
                                        ? 'border-slate-200 focus:border-amber-500'
                                        : isValidFormat
                                        ? 'border-emerald-400 bg-emerald-50/20 text-emerald-800 focus:border-emerald-500'
                                        : 'border-amber-400 bg-amber-50/20 text-amber-900 focus:border-amber-500'
                                }`}
                            />
                            {isValidFormat && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                                    <CheckCircle2 size={18} />
                                </div>
                            )}
                        </div>

                        {/* Format Validation Indicator */}
                        {!isPristine && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                                {isValidFormat ? (
                                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Valid GSTIN format
                                    </span>
                                ) : (
                                    <span className="text-amber-700 font-medium flex items-center gap-1">
                                        <AlertTriangle size={13} /> Must match Indian GSTIN format (e.g. 22AAAAA0000A1Z5)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Breakdown explanation */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                        <p className="font-semibold text-slate-700 flex items-center gap-1">
                            <Info size={13} className="text-amber-600" /> Structure of Indian GSTIN:
                        </p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-slate-500 pt-1">
                            <div>• First 2 digits: State Code</div>
                            <div>• Next 10 chars: Business PAN</div>
                            <div>• 13th char: Entity number</div>
                            <div>• 14th char: Default 'Z'</div>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-800 leading-relaxed">
                        Submitting an updated GSTIN resets approval status to <span className="font-bold">PENDING</span> until verified by the platform compliance team.
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !isValidFormat}
                            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
                        >
                            {submitting ? 'Saving...' : 'Submit GSTIN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
