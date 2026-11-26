'use client'

import React, { useState } from 'react'
import {
    Warehouse,
    Plus,
    Trash2,
    MapPin,
    Search,
    ShieldCheck,
    CheckCircle2,
    X,
    Sparkles,
    Loader2
} from 'lucide-react'
import { useDelivery } from '@/components/delivery/DeliveryLayout'
import { graphqlRequest } from '@/lib/apiClient'
import {
    CREATE_WAREHOUSE_MUTATION,
    DELETE_WAREHOUSE_MUTATION
} from '@/lib/graphql/inventory'
import { GET_LOCATION_BY_PINCODE_QUERY } from '@/lib/graphql/address'
import { useDialog } from '@/components/DialogProvider'
import toast from 'react-hot-toast'

export default function DeliveryWarehousesPage() {
    const { profile, warehouses, setWarehouses, refetchWarehouses } = useDelivery()
    const { confirm: confirmDialog } = useDialog()

    const [searchQuery, setSearchQuery] = useState('')
    const [createModal, setCreateModal] = useState(false)
    const [form, setForm] = useState({
        name: '',
        code: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
    })
    const [isCreating, setIsCreating] = useState(false)
    const [isLookingUpPin, setIsLookingUpPin] = useState(false)

    // Postal Code auto-lookup
    const handlePostalLookup = async (pin) => {
        const cleanPin = String(pin || '').trim()
        if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) return

        setIsLookingUpPin(true)
        try {
            const data = await graphqlRequest(GET_LOCATION_BY_PINCODE_QUERY, {
                pincode: cleanPin,
                country: 'IN'
            })
            if (data?.locationByPincode) {
                const loc = data.locationByPincode
                const autoCity = loc.district || loc.postOffices?.[0]?.district || ''
                const autoState = loc.state || ''
                setForm(prev => ({
                    ...prev,
                    city: autoCity || prev.city,
                    state: autoState || prev.state
                }))
                toast.success(`📍 Auto-detected hub region: ${autoCity}, ${autoState}`)
            }
        } catch {
            // Silently ignore if not found
        } finally {
            setIsLookingUpPin(false)
        }
    }

    const handleCreateWarehouse = async (e) => {
        e.preventDefault()
        const partnerId = profile?.partnerId || profile?.id
        if (!partnerId) {
            toast.error('Carrier Partner ID missing')
            return
        }

        setIsCreating(true)
        const toastId = toast.loading('Registering warehouse fulfillment hub...')

        try {
            const input = {
                deliveryPartnerId: partnerId,
                name: form.name.trim(),
                code: form.code.trim().toUpperCase(),
                street: form.street.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                postalCode: form.postalCode.trim(),
                isActive: true
            }

            const res = await graphqlRequest(CREATE_WAREHOUSE_MUTATION, { input })
            if (res?.createWarehouse) {
                setWarehouses(prev => [...prev, res.createWarehouse])
                toast.success(`Warehouse "${input.name}" registered!`, { id: toastId })
                setCreateModal(false)
                setForm({ name: '', code: '', street: '', city: '', state: '', postalCode: '' })
            }
        } catch (err) {
            toast.error(err.message || 'Failed to create warehouse', { id: toastId })
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteWarehouse = async (id, name) => {
        const confirmed = await confirmDialog({
            title: 'Remove Warehouse Hub',
            description: `Are you sure you want to remove "${name}"? It will no longer be available for pickup routing.`,
            confirmText: 'Remove Warehouse',
            variant: 'danger',
        })
        if (!confirmed) return
        const partnerId = profile?.partnerId || profile?.id
        const toastId = toast.loading('Deleting warehouse...')

        try {
            const res = await graphqlRequest(DELETE_WAREHOUSE_MUTATION, { id, deliveryPartnerId: partnerId })
            if (res?.deleteWarehouse?.success) {
                setWarehouses(prev => prev.filter(w => w.id !== id))
                toast.success('Warehouse hub removed', { id: toastId })
            }
        } catch (err) {
            toast.error(err.message || 'Failed to delete warehouse', { id: toastId })
        }
    }

    const filteredWarehouses = warehouses.filter(wh => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase().trim()
        return (
            wh.name.toLowerCase().includes(q) ||
            wh.code.toLowerCase().includes(q) ||
            wh.city.toLowerCase().includes(q) ||
            wh.state.toLowerCase().includes(q) ||
            wh.postalCode.includes(q)
        )
    })

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Warehouse className="text-amber-600 size-7" /> Fulfillment Warehouse Hubs
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Physical distribution centers where merchants stock SKU inventory and dispatches originate.
                    </p>
                </div>

                <button
                    onClick={() => setCreateModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 active:scale-98 transition shadow-xs cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={14} /> Register Warehouse Hub
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <Search size={16} className="text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search warehouses by name, hub code, city or PIN code..."
                    className="w-full text-xs outline-none bg-transparent"
                />
            </div>

            {/* Warehouse Cards Grid */}
            {filteredWarehouses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                    <Warehouse size={42} className="mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                    <h4 className="text-sm font-bold text-slate-700">No Warehouse Hubs Found</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Register your sorting or distribution facilities so merchants can allocate their inventory for carrier pickup.
                    </p>
                    <button
                        onClick={() => setCreateModal(true)}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition cursor-pointer"
                    >
                        <Plus size={14} /> Add First Warehouse
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWarehouses.map((wh) => (
                        <div
                            key={wh.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 relative hover:border-slate-300 transition"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        {wh.code}
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-800 mt-1.5">{wh.name}</h3>
                                </div>
                                <button
                                    onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                                    title="Delete Warehouse"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>

                            <div className="text-xs text-slate-600 space-y-1 pt-1">
                                <p className="flex items-start gap-1.5 text-slate-500">
                                    <MapPin size={13} className="shrink-0 text-slate-400 mt-0.5" />
                                    <span>{wh.street ? `${wh.street}, ` : ''}{wh.city}, {wh.state} {wh.postalCode}</span>
                                </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className={`inline-flex items-center gap-1 font-semibold ${
                                    wh.isActive ? 'text-emerald-700' : 'text-slate-400'
                                }`}>
                                    <span className={`size-1.5 rounded-full ${wh.isActive ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                                    {wh.isActive ? 'Active Hub' : 'Inactive'}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                    ID: {wh.id.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE MODAL */}
            {createModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Warehouse className="text-amber-600 size-5" /> Register Warehouse Hub
                            </h3>
                            <button
                                onClick={() => setCreateModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateWarehouse} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Hub Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. West Hub Logistics Center"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Hub Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        placeholder="e.g. WH-MUM-01"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none uppercase font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.street}
                                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                                    placeholder="Warehouse industrial park, Unit 4"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block font-semibold text-slate-700">PIN / Postal *</label>
                                        {isLookingUpPin && <Loader2 size={11} className="text-amber-600 animate-spin" />}
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={form.postalCode}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setForm({ ...form, postalCode: val })
                                            if (val.trim().length === 6) {
                                                handlePostalLookup(val.trim())
                                            }
                                        }}
                                        placeholder="e.g. 400001"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        placeholder="Mumbai"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">State *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                        placeholder="Maharashtra"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                                    />
                                </div>
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
                                    {isCreating ? 'Registering...' : 'Save Warehouse Hub'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
