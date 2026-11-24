'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Truck,
    Package,
    Warehouse,
    RotateCcw,
    Calculator,
    ShieldCheck,
    CheckCircle2,
    Clock,
    Search,
    MapPin,
    ArrowUpRight,
    TrendingUp,
    Phone,
    Plus,
    RefreshCw,
    SlidersHorizontal,
    AlertTriangle,
    Layers,
    Activity
} from 'lucide-react'
import { useDelivery } from '@/components/delivery/DeliveryLayout'
import { graphqlRequest } from '@/lib/apiClient'
import {
    GET_DELIVERY_BY_ORDER_QUERY,
    GET_DELIVERY_BY_TRACKING_QUERY,
    UPDATE_DELIVERY_STATUS_MUTATION
} from '@/lib/graphql/delivery'
import { LIST_RETURNS_QUERY } from '@/lib/graphql/return'
import GstinModal from '@/components/delivery/GstinModal'
import toast from 'react-hot-toast'

export default function DeliveryDashboardPage() {
    const { profile, warehouses, refetchProfile, refetchWarehouses } = useDelivery()

    const [refreshing, setRefreshing] = useState(false)
    const [gstinModalOpen, setGstinModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('orderId')
    const [activeDelivery, setActiveDelivery] = useState(null)
    const [isSearching, setIsSearching] = useState(false)
    const [returnsCount, setReturnsCount] = useState(0)

    // Load recent return orders count for metrics
    useEffect(() => {
        graphqlRequest(LIST_RETURNS_QUERY, { limit: 50 })
            .then((data) => {
                if (Array.isArray(data?.listReturns)) {
                    setReturnsCount(data.listReturns.length)
                }
            })
            .catch(() => {})
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await Promise.allSettled([refetchProfile(), refetchWarehouses()])
        setRefreshing(false)
        toast.success('Logistics dashboard synced')
    }

    const handleSearchDelivery = async (e) => {
        e?.preventDefault()
        const q = searchQuery.trim()
        if (!q) {
            toast.error('Enter an Order ID or Tracking Number')
            return
        }

        setIsSearching(true)
        try {
            if (searchType === 'trackingNumber') {
                const res = await graphqlRequest(GET_DELIVERY_BY_TRACKING_QUERY, { trackingNumber: q })
                if (res?.deliveryByTracking) {
                    setActiveDelivery(res.deliveryByTracking)
                    toast.success('Shipment located!')
                } else {
                    toast.error('No delivery record found')
                }
            } else {
                const res = await graphqlRequest(GET_DELIVERY_BY_ORDER_QUERY, { orderId: q })
                if (res?.deliveryByOrder) {
                    setActiveDelivery(res.deliveryByOrder)
                    toast.success('Shipment located!')
                } else {
                    toast.error('No delivery record found')
                }
            }
        } catch (err) {
            toast.error(err.message || 'Lookup failed')
        } finally {
            setIsSearching(false)
        }
    }

    const handleQuickAdvance = async (nextStatus) => {
        if (!activeDelivery?.id) return
        const toastId = toast.loading(`Advancing shipment to ${nextStatus.replace('_', ' ')}...`)

        try {
            const res = await graphqlRequest(UPDATE_DELIVERY_STATUS_MUTATION, {
                id: activeDelivery.id,
                status: nextStatus,
                location: 'Hub Checkpoint'
            })
            if (res?.updateDeliveryStatus) {
                setActiveDelivery(res.updateDeliveryStatus)
                toast.success(`Shipment updated to ${nextStatus.replace('_', ' ')}!`, { id: toastId })
            }
        } catch (err) {
            toast.error(err.message || 'Status update failed', { id: toastId })
        }
    }

    const partnerName = profile?.companyName || 'Logistics Carrier'
    const approvalStatus = profile?.approvalStatus || 'PENDING'

    return (
        <div className="space-y-6 pb-12">
            {/* Header / Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Truck className="text-amber-600 size-7" /> Logistics Command Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Welcome back, <span className="font-semibold text-slate-700">{partnerName}</span>. Real-time fulfillment tracking, hub management & reverse logistics.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-98 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : ''} />
                        Sync Data
                    </button>
                    <Link
                        href="/delivery/dispatch"
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 active:scale-98 transition shadow-xs cursor-pointer"
                    >
                        <Plus size={14} /> New Dispatch
                    </Link>
                </div>
            </div>

            {/* GSTIN Registration Banner (if not yet registered) */}
            {!profile?.gstin && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="text-amber-600 size-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Carrier GSTIN Registration Required</p>
                            <p className="text-slate-600 mt-0.5 leading-relaxed">
                                Enter your 15-character GSTIN to enable automated dispatch consignments, merchant order routing, and platform tax compliance.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setGstinModalOpen(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs flex items-center gap-1.5"
                    >
                        <ShieldCheck size={14} /> Enter GST Number
                    </button>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Warehouses</span>
                        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                            <Warehouse size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">
                        {warehouses.length}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Fulfillment pickup hubs</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Return Pickups</span>
                        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                            <RotateCcw size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">
                        {returnsCount}
                    </p>
                    <p className="text-xs text-indigo-600 font-semibold">Pending inspection</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Carrier Status</span>
                        <div className={`p-2.5 rounded-2xl ${profile?.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Activity size={20} />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                        {profile?.isActive ? 'Active Dispatch' : 'Paused (Offline)'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Network receiving status</p>
                </div>

                <div
                    onClick={() => setGstinModalOpen(true)}
                    className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs transition cursor-pointer group space-y-2"
                    title="Click to register or update GSTIN"
                >
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">GSTIN Verification</span>
                        <div className={`p-2.5 rounded-2xl transition ${profile?.isGstinVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'}`}>
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                        {profile?.isGstinVerified ? 'Tax Verified' : 'Pending Verification'}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-600 font-semibold truncate">
                            {profile?.gstin ? profile.gstin : 'No GSTIN registered'}
                        </span>
                        <span className="text-amber-600 font-bold text-xs group-hover:underline shrink-0 ml-1">
                            {profile?.gstin ? 'Edit →' : '+ Register →'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Shipment Lookup & Dispatch Manager */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Search size={19} className="text-amber-600" /> Quick Dispatch & Shipment Finder
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Quickly lookup and advance a customer package checkpoint.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                            <input
                                type="radio"
                                name="dashSearchType"
                                checked={searchType === 'orderId'}
                                onChange={() => setSearchType('orderId')}
                                className="accent-amber-600"
                            />
                            Order ID
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                            <input
                                type="radio"
                                name="dashSearchType"
                                checked={searchType === 'trackingNumber'}
                                onChange={() => setSearchType('trackingNumber')}
                                className="accent-amber-600"
                            />
                            Tracking Number
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSearchDelivery} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchType === 'orderId' ? 'Enter customer Order ID (e.g. ord-123)...' : 'Enter TRK-... tracking number'}
                        className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition font-medium"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 active:scale-98 transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                        {isSearching ? 'Locating...' : 'Lookup Shipment'}
                    </button>
                </form>

                {activeDelivery && (
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div>
                                <span className="font-mono text-xs font-bold text-slate-800">
                                    Tracking: {activeDelivery.trackingNumber || 'Pending'}
                                </span>
                                <p className="text-[11px] text-slate-500">Order: {activeDelivery.orderId}</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase self-start sm:self-auto">
                                {activeDelivery.status}
                            </span>
                        </div>

                        <p className="text-xs text-slate-600">
                            <strong>Destination:</strong> {activeDelivery.shippingAddress || 'Address on file'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {activeDelivery.status === 'CREATED' && (
                                <button
                                    onClick={() => handleQuickAdvance('PICKED_UP')}
                                    className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition cursor-pointer"
                                >
                                    Mark Picked Up
                                </button>
                            )}
                            {activeDelivery.status === 'PICKED_UP' && (
                                <button
                                    onClick={() => handleQuickAdvance('IN_TRANSIT')}
                                    className="px-3.5 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-700 transition cursor-pointer"
                                >
                                    Mark In Transit
                                </button>
                            )}
                            {activeDelivery.status === 'IN_TRANSIT' && (
                                <button
                                    onClick={() => handleQuickAdvance('OUT_FOR_DELIVERY')}
                                    className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                >
                                    Mark Out for Delivery
                                </button>
                            )}
                            {activeDelivery.status === 'OUT_FOR_DELIVERY' && (
                                <button
                                    onClick={() => handleQuickAdvance('DELIVERED')}
                                    className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                                >
                                    Confirm Delivered
                                </button>
                            )}
                            <Link
                                href="/delivery/dispatch"
                                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
                            >
                                Full Dispatch Details &rarr;
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Warehouse Pickup Hubs Preview */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Warehouse size={19} className="text-amber-600" /> Carrier Pickup & Fulfillment Hubs
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Active distribution nodes authorized for merchant pickup dispatch.
                        </p>
                    </div>
                    <Link
                        href="/delivery/warehouses"
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                    >
                        Manage All Hubs &rarr;
                    </Link>
                </div>

                {warehouses.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                        <Warehouse size={32} className="mx-auto text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700">No Warehouse Facilities Registered</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Add distribution hubs with Indian postal codes to receive merchant consignment pickups.
                        </p>
                        <Link
                            href="/delivery/warehouses"
                            className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                        >
                            <Plus size={14} /> Add First Hub
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Facility Name</th>
                                    <th className="px-4 py-3">Hub Code</th>
                                    <th className="px-4 py-3">Region / Pincode</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {warehouses.slice(0, 5).map((w) => (
                                    <tr key={w.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {w.name}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                            {w.code}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {w.city ? `${w.city}, ${w.state || ''} (${w.postalCode || ''})` : w.postalCode || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                ● Operational
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Portal Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/delivery/dispatch"
                    className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition cursor-pointer"
                >
                    <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Truck size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        Dispatch & Shipments
                        <ArrowUpRight size={15} className="text-slate-400 group-hover:text-amber-600 transition" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Generate carrier shipments, advance transit checkpoints, and handle customer door deliveries.
                    </p>
                </Link>

                <Link
                    href="/delivery/warehouses"
                    className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition cursor-pointer"
                >
                    <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Warehouse size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        Fulfillment Warehouse Hubs
                        <ArrowUpRight size={15} className="text-slate-400 group-hover:text-emerald-600 transition" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Register distribution facilities with pincode auto-fill where merchants stock SKU inventory.
                    </p>
                </Link>

                <Link
                    href="/delivery/returns"
                    className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition cursor-pointer"
                >
                    <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <RotateCcw size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        Return Pickups & Inspections
                        <ArrowUpRight size={15} className="text-slate-400 group-hover:text-indigo-600 transition" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Perform doorstep verification for customer returns, inspect product condition, and authorize refunds.
                    </p>
                </Link>
            </div>

            {/* GSTIN Registration Modal */}
            <GstinModal
                isOpen={gstinModalOpen}
                onClose={() => setGstinModalOpen(false)}
                partnerId={profile?.partnerId || profile?.id}
                currentGstin={profile?.gstin}
                onSuccess={() => refetchProfile()}
            />
        </div>
    )
}
