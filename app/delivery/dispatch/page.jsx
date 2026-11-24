'use client'

import React, { useState } from 'react'
import {
    Truck,
    Package,
    Warehouse,
    MapPin,
    CheckCircle2,
    Clock,
    Search,
    Plus,
    X,
    AlertCircle,
    Phone,
    RefreshCw,
    ShieldCheck
} from 'lucide-react'
import { useDelivery } from '@/components/delivery/DeliveryLayout'
import { graphqlRequest } from '@/lib/apiClient'
import {
    GET_DELIVERY_BY_ORDER_QUERY,
    GET_DELIVERY_BY_TRACKING_QUERY,
    CREATE_DELIVERY_MUTATION,
    UPDATE_DELIVERY_STATUS_MUTATION,
    CANCEL_DELIVERY_MUTATION
} from '@/lib/graphql/delivery'
import toast from 'react-hot-toast'

const DELIVERY_STAGES = [
    { key: 'CREATED', label: 'Order Created', icon: Package },
    { key: 'PICKED_UP', label: 'Picked Up', icon: Warehouse },
    { key: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
]

export default function DeliveryDispatchPage() {
    const { profile } = useDelivery()

    const [searchType, setSearchType] = useState('orderId')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeDelivery, setActiveDelivery] = useState(null)
    const [isSearching, setIsSearching] = useState(false)
    const [locationInput, setLocationInput] = useState('')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    // Create Dispatch Modal State
    const [createModal, setCreateModal] = useState(false)
    const [createForm, setCreateForm] = useState({
        orderId: '',
        shippingAddressId: '',
        contactNumber: ''
    })
    const [isCreating, setIsCreating] = useState(false)

    const handleSearch = async (e) => {
        e?.preventDefault()
        const q = searchQuery.trim()
        if (!q) {
            toast.error('Please enter an Order ID or Tracking Number')
            return
        }

        setIsSearching(true)
        try {
            if (searchType === 'trackingNumber') {
                const res = await graphqlRequest(GET_DELIVERY_BY_TRACKING_QUERY, { trackingNumber: q })
                if (res?.deliveryByTracking) {
                    setActiveDelivery(res.deliveryByTracking)
                    toast.success('Shipment record located!')
                } else {
                    toast.error('No shipment found for this tracking number')
                }
            } else {
                const res = await graphqlRequest(GET_DELIVERY_BY_ORDER_QUERY, { orderId: q })
                if (res?.deliveryByOrder) {
                    setActiveDelivery(res.deliveryByOrder)
                    toast.success('Shipment record located!')
                } else {
                    toast.error('No shipment found for this Order ID')
                }
            }
        } catch (err) {
            toast.error(err.message || 'Shipment search failed')
        } finally {
            setIsSearching(false)
        }
    }

    const handleUpdateStatus = async (nextStatus) => {
        if (!activeDelivery?.id) return

        setIsUpdatingStatus(true)
        const toastId = toast.loading(`Updating status to ${nextStatus.replace('_', ' ')}...`)

        try {
            const res = await graphqlRequest(UPDATE_DELIVERY_STATUS_MUTATION, {
                id: activeDelivery.id,
                status: nextStatus,
                location: locationInput.trim() || undefined
            })

            if (res?.updateDeliveryStatus) {
                setActiveDelivery(res.updateDeliveryStatus)
                toast.success(`Shipment stage updated to ${nextStatus.replace('_', ' ')}!`, { id: toastId })
                setLocationInput('')
            }
        } catch (err) {
            toast.error(err.message || 'Failed to update status', { id: toastId })
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleCancel = async () => {
        if (!activeDelivery?.id) return
        const reason = prompt('Enter exception or cancellation reason:')
        if (!reason) return

        const toastId = toast.loading('Logging delivery exception...')
        try {
            const res = await graphqlRequest(CANCEL_DELIVERY_MUTATION, {
                id: activeDelivery.id,
                reason
            })
            if (res?.cancelDelivery) {
                setActiveDelivery((prev) => (prev ? { ...prev, status: 'CANCELLED' } : prev))
                toast.success('Shipment marked as cancelled', { id: toastId })
            }
        } catch (err) {
            toast.error(err.message || 'Failed to cancel shipment', { id: toastId })
        }
    }

    const handleCreateDispatch = async (e) => {
        e.preventDefault()
        const partnerId = profile?.partnerId || profile?.id
        if (!partnerId) {
            toast.error('Carrier Partner ID missing')
            return
        }

        setIsCreating(true)
        const toastId = toast.loading('Generating delivery dispatch record...')

        try {
            const input = {
                orderId: createForm.orderId.trim(),
                deliveryPartnerId: partnerId,
                shippingAddressId: createForm.shippingAddressId.trim(),
                contactNumber: createForm.contactNumber.trim() || undefined
            }

            const res = await graphqlRequest(CREATE_DELIVERY_MUTATION, { input })
            if (res?.createDelivery) {
                setActiveDelivery(res.createDelivery)
                toast.success('Delivery dispatch created successfully!', { id: toastId })
                setCreateModal(false)
                setCreateForm({ orderId: '', shippingAddressId: '', contactNumber: '' })
            }
        } catch (err) {
            toast.error(err.message || 'Failed to create delivery', { id: toastId })
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Truck className="text-amber-600 size-7" /> Dispatch & Shipment Control
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Generate customer shipments, monitor transit routes, and log delivery checkpoints.
                    </p>
                </div>

                <button
                    onClick={() => setCreateModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 active:scale-98 transition shadow-xs cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={14} /> Create Dispatch Shipment
                </button>
            </div>

            {/* Lookup Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Search size={16} className="text-amber-600" /> Shipment Search
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Locate package to inspect details or advance fulfillment lifecycle.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium">
                            <input
                                type="radio"
                                name="dispatchSearch"
                                checked={searchType === 'orderId'}
                                onChange={() => setSearchType('orderId')}
                                className="accent-amber-600"
                            />
                            By Order ID
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium">
                            <input
                                type="radio"
                                name="dispatchSearch"
                                checked={searchType === 'trackingNumber'}
                                onChange={() => setSearchType('trackingNumber')}
                                className="accent-amber-600"
                            />
                            By Tracking Number
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchType === 'orderId' ? 'Enter customer Order ID...' : 'Enter TRK-... tracking number'}
                        className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 active:scale-98 transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                        {isSearching ? 'Searching...' : 'Locate Shipment'}
                    </button>
                </form>
            </div>

            {/* Active Delivery Inspector */}
            {activeDelivery ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Carrier Shipment</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                                    {activeDelivery.status}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 mt-1 font-mono">
                                Tracking: {activeDelivery.trackingNumber || 'Pending'}
                            </h2>
                            <p className="text-xs text-slate-500">
                                Order ID: <span className="font-mono text-slate-700">{activeDelivery.orderId}</span>
                            </p>
                        </div>

                        <div className="text-right text-xs">
                            <p className="text-slate-400">Carrier</p>
                            <p className="font-semibold text-slate-700">{activeDelivery.deliveryPartner || profile?.companyName}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <p className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">Transit Stages</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {DELIVERY_STAGES.map((stage, idx) => {
                                const currentIdx = DELIVERY_STAGES.findIndex((s) => s.key === activeDelivery.status)
                                const isCompleted = currentIdx >= idx
                                const isCurrent = activeDelivery.status === stage.key

                                return (
                                    <div
                                        key={stage.key}
                                        className={`p-3 rounded-2xl border text-center transition ${
                                            isCurrent
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                                                : isCompleted
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}
                                    >
                                        <stage.icon size={20} className="mx-auto mb-1.5" />
                                        <p className="font-bold text-xs">{stage.label}</p>
                                        <p className="text-[10px] opacity-80 mt-0.5">{stage.key}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Address & Timelines */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                            <p className="font-bold text-slate-700 flex items-center gap-1.5">
                                <MapPin size={15} className="text-amber-600" /> Customer Destination Address
                            </p>
                            <p className="text-slate-600 whitespace-pre-wrap">
                                {activeDelivery.shippingAddress || 'Address on file with order'}
                            </p>
                            {activeDelivery.contactNumber && (
                                <p className="text-slate-600 flex items-center gap-1 pt-1 font-medium">
                                    <Phone size={13} className="text-slate-400" /> Contact: {activeDelivery.contactNumber}
                                </p>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                            <p className="font-bold text-slate-700 flex items-center gap-1.5">
                                <Clock size={15} className="text-blue-600" /> Dispatch Timestamps
                            </p>
                            <div className="space-y-1 text-slate-600">
                                <p>Created: {activeDelivery.createdAt ? new Date(activeDelivery.createdAt).toLocaleString() : 'N/A'}</p>
                                <p>Estimated Delivery: {activeDelivery.estimatedDeliveryAt ? new Date(activeDelivery.estimatedDeliveryAt).toLocaleDateString() : 'In transit'}</p>
                                {activeDelivery.deliveredAt && (
                                    <p className="text-emerald-700 font-bold">
                                        Delivered: {new Date(activeDelivery.deliveredAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Checkpoint & Actions */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 max-w-sm">
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Location Checkpoint Note:
                                </label>
                                <input
                                    type="text"
                                    value={locationInput}
                                    onChange={(e) => setLocationInput(e.target.value)}
                                    placeholder="e.g. Sorting Center - Sector 12"
                                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-4 sm:pt-0">
                                {activeDelivery.status === 'CREATED' && (
                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleUpdateStatus('PICKED_UP')}
                                        className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-xs active:scale-98"
                                    >
                                        Mark Picked Up from Warehouse
                                    </button>
                                )}

                                {(activeDelivery.status === 'PICKED_UP' || activeDelivery.status === 'CREATED') && (
                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleUpdateStatus('IN_TRANSIT')}
                                        className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition cursor-pointer shadow-xs active:scale-98"
                                    >
                                        Mark In Transit
                                    </button>
                                )}

                                {(activeDelivery.status === 'IN_TRANSIT' || activeDelivery.status === 'PICKED_UP') && (
                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
                                        className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition cursor-pointer shadow-xs active:scale-98"
                                    >
                                        Mark Out for Delivery
                                    </button>
                                )}

                                {activeDelivery.status === 'OUT_FOR_DELIVERY' && (
                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleUpdateStatus('DELIVERED')}
                                        className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-sm active:scale-98"
                                    >
                                        Confirm Doorstep Delivery
                                    </button>
                                )}

                                {activeDelivery.status !== 'DELIVERED' && activeDelivery.status !== 'CANCELLED' && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                                    >
                                        Report Exception / Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                    <Truck size={42} className="mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                    <h4 className="text-sm font-bold text-slate-700">No Active Shipment Selected</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Search an Order ID or carrier Tracking Number above, or click "Create Dispatch Shipment" to dispatch a new paid customer order.
                    </p>
                </div>
            )}

            {/* CREATE DISPATCH MODAL */}
            {createModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="text-amber-600 size-5" /> Create Delivery Dispatch
                            </h3>
                            <button
                                onClick={() => setCreateModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDispatch} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Customer Order ID <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.orderId}
                                    onChange={(e) => setCreateForm({ ...createForm, orderId: e.target.value })}
                                    placeholder="Order UUID (payment_status must be PAID)"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Shipping Address ID <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.shippingAddressId}
                                    onChange={(e) => setCreateForm({ ...createForm, shippingAddressId: e.target.value })}
                                    placeholder="Customer shipping address UUID"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Contact / Driver Phone
                                </label>
                                <input
                                    type="text"
                                    value={createForm.contactNumber}
                                    onChange={(e) => setCreateForm({ ...createForm, contactNumber: e.target.value })}
                                    placeholder="e.g. +91 98765 43210"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCreateModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Dispatch Shipment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
