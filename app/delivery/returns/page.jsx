'use client'

import React, { useState, useEffect } from 'react'
import {
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    PackageCheck,
    Search,
    ShieldCheck,
    FileCheck,
    RefreshCw,
    SlidersHorizontal,
    X,
    Clock,
    AlertTriangle
} from 'lucide-react'
import { useDelivery } from '@/components/delivery/DeliveryLayout'
import { graphqlRequest } from '@/lib/apiClient'
import {
    LIST_RETURNS_QUERY,
    VERIFY_PRODUCT_MUTATION,
    UPDATE_RETURN_STATUS_MUTATION,
    GET_EXCHANGE_QUERY,
    VERIFY_EXCHANGE_PRODUCT_MUTATION,
    RESOLVE_EXCHANGE_MISMATCH_MUTATION
} from '@/lib/graphql/return'
import toast from 'react-hot-toast'

const CONDITIONS = [
    { value: 'GOOD', label: 'Good Condition (Original & Intact)', desc: 'Tags and seal undamaged' },
    { value: 'OPEN_BOX', label: 'Open Box (Like New)', desc: 'Packaging opened but product intact' },
    { value: 'DEFECTIVE', label: 'Defective (Non-functional)', desc: 'Product reported malfunctioning' },
    { value: 'DAMAGED', label: 'Physically Damaged', desc: 'Broken parts, scratch or crack' },
    { value: 'WRONG_ITEM', label: 'Wrong Item Delivered', desc: 'Item does not match merchant SKU' },
]

export default function DeliveryReturnsPage() {
    const { profile } = useDelivery()

    const [returns, setReturns] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    // Inspection Modal State
    const [inspectItem, setInspectItem] = useState(null)
    const [condition, setCondition] = useState('GOOD')
    const [isApproved, setIsApproved] = useState(true)
    const [notes, setNotes] = useState('Doorstep inspection verified by carrier agent.')
    const [isVerifying, setIsVerifying] = useState(false)

    // Exchange Verification State
    const [exchangeLookupId, setExchangeLookupId] = useState('')
    const [exchangeData, setExchangeData] = useState(null)
    const [loadingExchange, setLoadingExchange] = useState(false)
    const [exCondition, setExCondition] = useState('GOOD')
    const [exScreenIntact, setExScreenIntact] = useState(true)
    const [exBodyIntact, setExBodyIntact] = useState(true)
    const [exFunctional, setExFunctional] = useState(true)
    const [exSerialMatches, setExSerialMatches] = useState(true)
    const [exApproved, setExApproved] = useState(true)
    const [exNotes, setExNotes] = useState('')
    const [verifyingExchange, setVerifyingExchange] = useState(false)

    const handleLookupExchange = async (e) => {
        e?.preventDefault()
        if (!exchangeLookupId.trim()) return
        setLoadingExchange(true)
        try {
            const res = await graphqlRequest(GET_EXCHANGE_QUERY, { id: exchangeLookupId.trim() })
            if (res?.exchange) {
                setExchangeData(res.exchange)
                toast.success('Exchange record loaded!')
            } else {
                toast.error('Exchange not found')
            }
        } catch (err) {
            toast.error(err.message || 'Failed to lookup exchange')
        } finally {
            setLoadingExchange(false)
        }
    }

    const handleVerifyExchange = async (e) => {
        e.preventDefault()
        if (!exchangeData?.id) return
        setVerifyingExchange(true)
        const toastId = toast.loading('Verifying trade-in device...')
        try {
            const res = await graphqlRequest(VERIFY_EXCHANGE_PRODUCT_MUTATION, {
                input: {
                    exchangeId: exchangeData.id,
                    conditionRating: exCondition,
                    isApproved: exApproved,
                    screenIntact: exScreenIntact,
                    bodyIntact: exBodyIntact,
                    functional: exFunctional,
                    serialMatches: exSerialMatches,
                    notes: exNotes.trim() || undefined,
                },
            })
            if (res?.verifyExchangeProduct) {
                setExchangeData((prev) => ({ ...prev, ...res.verifyExchangeProduct }))
                toast.success('Exchange device verified!', { id: toastId })
            }
        } catch (err) {
            toast.error(err.message || 'Exchange verification failed', { id: toastId })
        } finally {
            setVerifyingExchange(false)
        }
    }

    const handleResolveMismatch = async (action) => {
        if (!exchangeData?.id) return
        const toastId = toast.loading('Resolving exchange mismatch...')
        try {
            const res = await graphqlRequest(RESOLVE_EXCHANGE_MISMATCH_MUTATION, {
                input: {
                    exchangeId: exchangeData.id,
                    action,
                    paymentMethod: action === 'PAY_DIFFERENCE' ? 'CASH' : undefined,
                },
            })
            if (res?.resolveExchangeMismatch) {
                setExchangeData((prev) => ({ ...prev, ...res.resolveExchangeMismatch }))
                toast.success(`Mismatch resolved: ${action}`, { id: toastId })
            }
        } catch (err) {
            toast.error(err.message || 'Failed to resolve mismatch', { id: toastId })
        }
    }

    const fetchReturns = async () => {
        try {
            const data = await graphqlRequest(LIST_RETURNS_QUERY, { limit: 50 })
            if (Array.isArray(data?.listReturns)) {
                setReturns(data.listReturns)
            } else {
                setReturns([])
            }
        } catch (err) {
            console.error('Failed to load returns:', err)
            toast.error('Failed to load return orders')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchReturns()
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchReturns()
    }

    // Submit Doorstep Verification
    const handleSubmitVerification = async (e) => {
        e.preventDefault()
        if (!inspectItem?.id) return

        setIsVerifying(true)
        const toastId = toast.loading('Recording product inspection...')

        try {
            const input = {
                returnId: inspectItem.id,
                condition,
                isApproved,
                notes: notes.trim() || undefined,
            }

            const res = await graphqlRequest(VERIFY_PRODUCT_MUTATION, { input })
            if (res?.verifyProduct) {
                toast.success('Product inspection recorded successfully!', { id: toastId })
                setInspectItem(null)
                fetchReturns()
            }
        } catch (err) {
            toast.error(err.message || 'Verification failed', { id: toastId })
        } finally {
            setIsVerifying(false)
        }
    }

    // Advance Return Status
    const handleUpdateStatus = async (id, nextStatus) => {
        const toastId = toast.loading(`Updating return to ${nextStatus}...`)
        try {
            const res = await graphqlRequest(UPDATE_RETURN_STATUS_MUTATION, {
                id,
                status: nextStatus
            })
            if (res?.updateReturnStatus) {
                toast.success(`Return status set to ${nextStatus}`, { id: toastId })
                fetchReturns()
            }
        } catch (err) {
            toast.error(err.message || 'Failed to update return status', { id: toastId })
        }
    }

    const filteredReturns = returns.filter((item) => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            const matchId = item.id.toLowerCase().includes(q)
            const matchOrder = item.orderId.toLowerCase().includes(q)
            const matchReason = (item.reason || '').toLowerCase().includes(q)
            if (!matchId && !matchOrder && !matchReason) return false
        }

        if (statusFilter === 'ALL') return true
        if (statusFilter === 'PENDING') {
            return item.status.includes('REQUESTED') || item.status === 'PICKUP_SCHEDULED'
        }
        if (statusFilter === 'PICKED_UP') return item.status === 'PICKED_UP'
        if (statusFilter === 'VERIFIED') return item.status === 'VERIFIED' || item.verification !== null
        return true
    })

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <RotateCcw className="text-amber-600 size-7" /> Reverse Logistics & Doorstep Returns
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Collect customer return packages, conduct doorstep condition verification, and update logistics custody.
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-98 transition disabled:opacity-50 cursor-pointer shadow-2xs self-start sm:self-auto"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : ''} />
                    Refresh Pickups
                </button>
            </div>

            {/* Filter and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Return ID, Order ID or reason..."
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'ALL', label: 'All Requests' },
                        { id: 'PENDING', label: 'Pending Pickup' },
                        { id: 'PICKED_UP', label: 'In Custody (Picked Up)' },
                        { id: 'VERIFIED', label: 'Inspected' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                                statusFilter === tab.id
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Returns Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-5 py-3.5">Return ID & Type</th>
                                <th className="px-4 py-3.5">Order Reference</th>
                                <th className="px-4 py-3.5">Reason & Inspection</th>
                                <th className="px-4 py-3.5 text-center">Status</th>
                                <th className="px-4 py-3.5 text-right">Refund / Value</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                        <RotateCcw size={36} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                        <p className="font-semibold text-slate-600">No return orders found</p>
                                        <p className="text-xs text-slate-400 mt-1">Customer return requests for carrier pickup will appear here.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredReturns.map((item) => {
                                    const isVerified = Boolean(item.verification)
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-5 py-3.5">
                                                <p className="font-mono font-bold text-slate-800 text-xs">
                                                    #{item.id.slice(0, 8)}...
                                                </p>
                                                <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 uppercase">
                                                    {item.type || 'RETURN'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <p className="font-mono text-slate-700 font-medium">Order: {item.orderId.slice(0, 8)}...</p>
                                                <p className="text-[10px] text-slate-400">Buyer: {item.userId ? item.userId.slice(0, 8) : 'Customer'}</p>
                                            </td>

                                            <td className="px-4 py-3.5 max-w-xs">
                                                <p className="text-slate-700 truncate" title={item.reason}>
                                                    {item.reason || 'Customer requested return'}
                                                </p>
                                                {isVerified ? (
                                                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
                                                        <ShieldCheck size={12} />
                                                        Condition: {item.verification.condition} ({item.verification.isApproved ? 'Approved' : 'Rejected'})
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                                                        <Clock size={11} /> Inspection Pending
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    item.status === 'VERIFIED' || item.status === 'COMPLETED'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : item.status === 'PICKED_UP'
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                                                ₹{(item.refundAmount || 0).toLocaleString()}
                                            </td>

                                            <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-2">
                                                {!isVerified ? (
                                                    <button
                                                        onClick={() => {
                                                            setInspectItem(item)
                                                            setCondition('GOOD')
                                                            setIsApproved(true)
                                                            setNotes('Doorstep inspection verified by carrier agent.')
                                                        }}
                                                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition active:scale-98 cursor-pointer shadow-2xs"
                                                    >
                                                        Inspect Doorstep
                                                    </button>
                                                ) : item.status !== 'PICKED_UP' && item.status !== 'COMPLETED' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'PICKED_UP')}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition active:scale-98 cursor-pointer"
                                                    >
                                                        Mark Picked Up
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">Inspected & In Hub</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DOORSTEP INSPECTION MODAL */}
            {inspectItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <PackageCheck className="text-amber-600 size-5" /> Doorstep Product Verification
                            </h3>
                            <button
                                onClick={() => setInspectItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                <p className="font-semibold text-slate-800">Return ID: #{inspectItem.id}</p>
                                <p className="text-slate-500">Order ID: {inspectItem.orderId}</p>
                                <p className="text-slate-600 font-medium">Customer Reason: {inspectItem.reason}</p>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1.5">
                                    Inspected Condition at Doorstep <span className="text-rose-500">*</span>
                                </label>
                                <div className="space-y-1.5">
                                    {CONDITIONS.map((c) => (
                                        <label
                                            key={c.value}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                                                condition === c.value
                                                    ? 'border-amber-500 bg-amber-50/50'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="condition"
                                                value={c.value}
                                                checked={condition === c.value}
                                                onChange={(e) => setCondition(e.target.value)}
                                                className="mt-0.5 accent-amber-600"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-800">{c.label}</p>
                                                <p className="text-[11px] text-slate-500">{c.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={isApproved}
                                        onChange={(e) => setIsApproved(e.target.checked)}
                                        className="size-4 accent-emerald-600 rounded"
                                    />
                                    <span>Authorize Return & Custody Handover (Meets Merchant Policy)</span>
                                </label>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Agent Verification Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Serial number matches, box opened, intact accessories"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setInspectItem(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                    {isVerifying ? 'Recording...' : 'Authorize Inspection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Doorstep Exchange Verification Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="text-amber-600 size-5" /> Trade-In Exchange Device Verification
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Inspect customer trade-in devices at doorstep and resolve valuation mismatches.
                    </p>
                </div>

                <form onSubmit={handleLookupExchange} className="flex gap-2 max-w-lg text-xs">
                    <input
                        type="text"
                        value={exchangeLookupId}
                        onChange={(e) => setExchangeLookupId(e.target.value)}
                        placeholder="Enter Exchange UUID..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={loadingExchange}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                    >
                        {loadingExchange ? 'Loading...' : 'Lookup Exchange'}
                    </button>
                </form>

                {exchangeData && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">
                                    {exchangeData.oldBrand} {exchangeData.oldModel} {exchangeData.oldVariant || ''}
                                </p>
                                <p className="text-slate-500">
                                    Est. Discount: ₹{exchangeData.estimatedDiscount} • Final: ₹{exchangeData.finalDiscount ?? exchangeData.estimatedDiscount}
                                </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                {exchangeData.status}
                            </span>
                        </div>

                        {!exchangeData.verification ? (
                            <form onSubmit={handleVerifyExchange} className="space-y-3 border-t border-slate-200 pt-3">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={exScreenIntact} onChange={(e) => setExScreenIntact(e.target.checked)} className="accent-amber-600" />
                                        Screen Intact
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={exBodyIntact} onChange={(e) => setExBodyIntact(e.target.checked)} className="accent-amber-600" />
                                        Body Intact
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={exFunctional} onChange={(e) => setExFunctional(e.target.checked)} className="accent-amber-600" />
                                        Functional
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={exSerialMatches} onChange={(e) => setExSerialMatches(e.target.checked)} className="accent-amber-600" />
                                        Serial Matches
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                                        <input type="checkbox" checked={exApproved} onChange={(e) => setExApproved(e.target.checked)} className="accent-emerald-600" />
                                        Approved
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={exCondition}
                                        onChange={(e) => setExCondition(e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                                    >
                                        <option value="GOOD">GOOD</option>
                                        <option value="FAIR">FAIR</option>
                                        <option value="POOR">POOR</option>
                                        <option value="DAMAGED">DAMAGED</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={exNotes}
                                        onChange={(e) => setExNotes(e.target.value)}
                                        placeholder="Inspection notes..."
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={verifyingExchange}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                                    >
                                        {verifyingExchange ? 'Verifying...' : 'Submit Verification'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                                <span className="text-emerald-700 font-semibold">
                                    Verified ({exchangeData.verification.conditionRating}) — {exchangeData.verification.isApproved ? 'Approved' : 'Mismatch'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleResolveMismatch('PAY_DIFFERENCE')}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                                    >
                                        Collect Difference
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleResolveMismatch('CANCEL_EXCHANGE')}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
                                    >
                                        Cancel Exchange
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
