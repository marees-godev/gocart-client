'use client'

import React, { useState } from 'react'
import {
    Settings,
    Building2,
    ShieldCheck,
    AlertTriangle,
    Edit3,
    CheckCircle2,
    Clock,
    X,
    AlertCircle,
    Power
} from 'lucide-react'
import { useDelivery } from '@/components/delivery/DeliveryLayout'
import { graphqlRequest } from '@/lib/apiClient'
import {
    UPDATE_DELIVERY_PARTNER_PROFILE_MUTATION,
    APPEAL_DELIVERY_PARTNER_MUTATION,
    REACTIVATE_DELIVERY_PARTNER_MUTATION,
    DELETE_DELIVERY_PARTNER_MUTATION
} from '@/lib/graphql/delivery'
import GstinModal from '@/components/delivery/GstinModal'
import toast from 'react-hot-toast'

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export default function DeliverySettingsPage() {
    const { profile, setProfile, toggleActiveStatus } = useDelivery()

    const [gstinModalOpen, setGstinModalOpen] = useState(false)
    const [editModal, setEditModal] = useState(false)
    const [editForm, setEditForm] = useState({
        companyName: profile?.companyName || '',
        contactNumber: profile?.contactNumber || '',
        email: profile?.email || '',
        gstin: profile?.gstin || ''
    })
    const [isSaving, setIsSaving] = useState(false)

    // Appeal Modal
    const [appealModal, setAppealModal] = useState(false)
    const [appealReason, setAppealReason] = useState('')
    const [isAppealing, setIsAppealing] = useState(false)

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        const partnerId = profile?.partnerId || profile?.id
        if (!partnerId) return

        setIsSaving(true)
        const toastId = toast.loading('Saving carrier profile...')

        try {
            const cleanGstin = editForm.gstin.trim().toUpperCase()
            if (cleanGstin && !GSTIN_REGEX.test(cleanGstin)) {
                toast.error('Invalid GSTIN format (must be 15 alphanumeric characters matching Indian GST)', { id: toastId })
                setIsSaving(false)
                return
            }

            const input = {
                partnerId,
                companyName: editForm.companyName.trim() || undefined,
                contactNumber: editForm.contactNumber.trim() || undefined,
                email: editForm.email.trim() || undefined,
                gstin: cleanGstin || undefined
            }

            const res = await graphqlRequest(UPDATE_DELIVERY_PARTNER_PROFILE_MUTATION, { input })
            if (res?.updateDeliveryPartnerProfile) {
                setProfile(res.updateDeliveryPartnerProfile)
                toast.success('Carrier profile updated!', { id: toastId })
                setEditModal(false)
            }
        } catch (err) {
            toast.error(err.message || 'Failed to update profile', { id: toastId })
        } finally {
            setIsSaving(false)
        }
    }

    const handleAppeal = async (e) => {
        e.preventDefault()
        if (!appealReason.trim()) {
            toast.error('Please describe your appeal justification')
            return
        }

        setIsAppealing(true)
        const toastId = toast.loading('Submitting verification appeal to admin...')

        try {
            const res = await graphqlRequest(APPEAL_DELIVERY_PARTNER_MUTATION, {
                reason: appealReason.trim()
            })
            if (res?.appealDeliveryPartnerRejection) {
                setProfile(res.appealDeliveryPartnerRejection)
                toast.success('Appeal submitted for administrator review!', { id: toastId })
                setAppealModal(false)
                setAppealReason('')
            }
        } catch (err) {
            toast.error(err.message || 'Failed to submit appeal', { id: toastId })
        } finally {
            setIsAppealing(false)
        }
    }

    const approvalStatus = profile?.approvalStatus || 'PENDING'

    return (
        <div className="w-full max-w-6xl space-y-6 pb-12 text-slate-700">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                    <Settings className="text-amber-600 size-7" /> Carrier Partner Settings & Compliance
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage logistics business entity, tax registrations, active fleet dispatch status, and verification credentials.
                </p>
            </div>

            {/* Rejection / Appeal Banner */}
            {approvalStatus === 'REJECTED' && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-rose-800">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Carrier Verification Rejected by Platform Admin</p>
                            <p className="text-rose-600 mt-1 leading-relaxed">
                                {profile?.rejectionReason || 'Compliance documentation or GSTIN verification failed platform standards.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAppealModal(true)}
                        className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                    >
                        Appeal Decision
                    </button>
                </div>
            )}

            {/* Profile Overview Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Building2 size={18} className="text-amber-600" /> Carrier Business Credentials
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Authoritative operational entity information visible on dispatch consignments.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditForm({
                                companyName: profile?.companyName || '',
                                contactNumber: profile?.contactNumber || '',
                                email: profile?.email || '',
                                gstin: profile?.gstin || ''
                            })
                            setEditModal(true)
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                        <Edit3 size={13} /> Edit Credentials
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div>
                            <p className="text-slate-400">Carrier Company Name</p>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">{profile?.companyName || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400">Partner UUID</p>
                            <p className="font-mono text-slate-600 mt-0.5 truncate">{profile?.partnerId || profile?.id}</p>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <p className="text-slate-400">GSTIN Tax Registration</p>
                                <button
                                    type="button"
                                    onClick={() => setGstinModalOpen(true)}
                                    className="text-amber-600 hover:text-amber-700 font-bold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    {profile?.gstin ? 'Update GSTIN →' : '+ Enter GSTIN →'}
                                </button>
                            </div>
                            <div className="font-semibold text-slate-800 flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs">{profile?.gstin || 'Not Provided'}</span>
                                {profile?.isGstinVerified ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                        <ShieldCheck size={11} /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                        Verification Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div>
                            <p className="text-slate-400">Authorized Logistics Email</p>
                            <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400">Dispatch Support Phone</p>
                            <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile?.contactNumber || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400">Verification Status</p>
                            <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                approvalStatus === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                                {approvalStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network Active Status Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Power size={16} className={profile?.isActive ? 'text-emerald-600' : 'text-slate-400'} />
                        Carrier Availability & Network Dispatch State
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {profile?.isActive
                            ? 'Your carrier fleet is active and receiving checkout shipments from buyers.'
                            : 'Carrier fleet is paused. Shoppers will not be assigned this carrier.'}
                    </p>
                </div>

                <button
                    onClick={toggleActiveStatus}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer active:scale-98 shadow-xs self-start sm:self-auto ${
                        profile?.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                >
                    {profile?.isActive ? 'Pause Carrier Dispatch' : 'Activate Carrier Online'}
                </button>
            </div>

            {/* Reactivate / Delete Carrier Account */}
            <div className="bg-white p-6 rounded-3xl border border-rose-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-bold text-rose-800">Carrier Account Lifecycle</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Reactivate a deactivated carrier account or permanently schedule carrier deletion.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={async () => {
                            const toastId = toast.loading('Reactivating carrier...')
                            try {
                                const res = await graphqlRequest(REACTIVATE_DELIVERY_PARTNER_MUTATION)
                                if (res?.reactivateDeliveryPartner?.success) {
                                    setProfile((prev) => (prev ? { ...prev, isActive: true } : prev))
                                    toast.success(res.reactivateDeliveryPartner.message || 'Carrier reactivated!', { id: toastId })
                                }
                            } catch (err) {
                                toast.error(err.message || 'Reactivation failed', { id: toastId })
                            }
                        }}
                        className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
                    >
                        Reactivate Carrier
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            const reason = prompt('Enter reason for deleting carrier account:')
                            if (!reason) return
                            const toastId = toast.loading('Deleting carrier account...')
                            try {
                                const res = await graphqlRequest(DELETE_DELIVERY_PARTNER_MUTATION, { reason })
                                if (res?.deleteDeliveryPartner?.success) {
                                    toast.success(res.deleteDeliveryPartner.message || 'Carrier account deleted', { id: toastId })
                                }
                            } catch (err) {
                                toast.error(err.message || 'Deletion failed', { id: toastId })
                            }
                        }}
                        className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* EDIT PROFILE MODAL */}
            {editModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Edit3 className="text-amber-600 size-5" /> Edit Carrier Credentials
                            </h3>
                            <button
                                onClick={() => setEditModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Carrier / Company Name</label>
                                <input
                                    type="text"
                                    value={editForm.companyName}
                                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Dispatch Phone</label>
                                <input
                                    type="text"
                                    value={editForm.contactNumber}
                                    onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Authorized Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">GSTIN Tax Registration</label>
                                <input
                                    type="text"
                                    value={editForm.gstin}
                                    onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
                                    placeholder="22AAAAA0000A1Z5"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none uppercase font-mono"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* APPEAL MODAL */}
            {appealModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="text-rose-600 size-5" /> Appeal Rejection Decision
                            </h3>
                            <button
                                onClick={() => setAppealModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAppeal} className="space-y-3 text-xs">
                            <p className="text-slate-500">
                                Explain how regulatory documents, GSTIN tax credentials, or carrier compliance issues have been rectified.
                            </p>
                            <textarea
                                rows={4}
                                required
                                value={appealReason}
                                onChange={(e) => setAppealReason(e.target.value)}
                                placeholder="State appeal justification..."
                                className="w-full p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none"
                            />

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setAppealModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAppealing}
                                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                    {isAppealing ? 'Submitting...' : 'Submit Appeal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dedicated GSTIN Registration Modal */}
            <GstinModal
                isOpen={gstinModalOpen}
                onClose={() => setGstinModalOpen(false)}
                partnerId={profile?.partnerId || profile?.id}
                currentGstin={profile?.gstin}
                onSuccess={(updated) => setProfile((prev) => (prev ? { ...prev, ...updated } : updated))}
            />
        </div>
    )
}
