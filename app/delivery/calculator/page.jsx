'use client'

import React, { useState } from 'react'
import {
    Calculator,
    Truck,
    MapPin,
    Package,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Loader2
} from 'lucide-react'
import { useDelivery } from '@/components/delivery/DeliveryLayout'
import { graphqlRequest } from '@/lib/apiClient'
import { CALCULATE_SHIPPING_FEE_QUERY } from '@/lib/graphql/delivery'
import { GET_LOCATION_BY_PINCODE_QUERY } from '@/lib/graphql/address'
import toast from 'react-hot-toast'

export default function DeliveryCalculatorPage() {
    const { profile, warehouses } = useDelivery()

    const [form, setForm] = useState({
        destinationPostalCode: '',
        destinationCity: '',
        destinationState: '',
        originCity: 'Mumbai',
        originState: 'Maharashtra',
        weightGrams: 500,
        zone: 'LOCAL'
    })

    const [isLookingUpPin, setIsLookingUpPin] = useState(false)
    const [isCalculating, setIsCalculating] = useState(false)
    const [result, setResult] = useState(null)

    // Auto-fill destination from pincode
    const handlePincodeLookup = async (pin) => {
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
                const city = loc.district || loc.postOffices?.[0]?.district || ''
                const state = loc.state || ''
                setForm(prev => ({
                    ...prev,
                    destinationCity: city || prev.destinationCity,
                    destinationState: state || prev.destinationState
                }))
                toast.success(`📍 Destination located: ${city}, ${state}`)
            }
        } catch {
            // Silently fallback
        } finally {
            setIsLookingUpPin(false)
        }
    }

    const handleCalculate = async (e) => {
        e.preventDefault()
        const partnerId = profile?.partnerId || profile?.id
        if (!partnerId) {
            toast.error('Partner ID missing from session')
            return
        }

        setIsCalculating(true)
        setResult(null)

        try {
            const input = {
                deliveryPartnerId: partnerId,
                weightGrams: parseFloat(form.weightGrams) || 500,
                zone: form.zone,
                originCity: form.originCity.trim() || undefined,
                originState: form.originState.trim() || undefined,
                destinationCity: form.destinationCity.trim() || undefined,
                destinationState: form.destinationState.trim() || undefined,
                destinationPostalCode: form.destinationPostalCode.trim() || undefined,
            }

            const data = await graphqlRequest(CALCULATE_SHIPPING_FEE_QUERY, { input })
            if (data?.calculateShippingFee) {
                setResult(data.calculateShippingFee)
                toast.success('Shipping rate calculated!')
            }
        } catch (err) {
            toast.error(err.message || 'Calculation failed')
        } finally {
            setIsCalculating(false)
        }
    }

    return (
        <div className="w-full space-y-6 pb-12 text-slate-700">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                    <Calculator className="text-amber-600 size-7" /> Rate & Shipping Fee Estimator
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Calculate authoritative platform shipping charges, carrier payouts, and zone-based transit fees.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Truck size={18} className="text-amber-600" /> Transit Routing Parameters
                    </h2>

                    <form onSubmit={handleCalculate} className="space-y-4 text-sm">
                        {/* Origin */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <p className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-1.5">
                                <MapPin size={13} className="text-amber-600" /> Origin Hub / Facility
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Origin City</label>
                                    <input
                                        type="text"
                                        value={form.originCity}
                                        onChange={(e) => setForm({ ...form, originCity: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Origin State</label>
                                    <input
                                        type="text"
                                        value={form.originState}
                                        onChange={(e) => setForm({ ...form, originState: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Destination with Pincode lookup */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-1.5">
                                    <MapPin size={13} className="text-emerald-600" /> Destination Doorstep
                                </p>
                                {isLookingUpPin && (
                                    <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                                        <Loader2 size={12} className="animate-spin" /> Verifying PIN...
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Destination PIN Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={form.destinationPostalCode}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        setForm({ ...form, destinationPostalCode: val })
                                        if (val.trim().length === 6) {
                                            handlePincodeLookup(val.trim())
                                        }
                                    }}
                                    placeholder="e.g. 560001 (auto-resolves city & state)"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 font-mono text-sm font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Destination City</label>
                                    <input
                                        type="text"
                                        value={form.destinationCity}
                                        onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
                                        placeholder="City"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Destination State</label>
                                    <input
                                        type="text"
                                        value={form.destinationState}
                                        onChange={(e) => setForm({ ...form, destinationState: e.target.value })}
                                        placeholder="State"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Package Specs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Weight (Grams) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.weightGrams}
                                    onChange={(e) => setForm({ ...form, weightGrams: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 font-mono text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Logistics Zone</label>
                                <select
                                    value={form.zone}
                                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 cursor-pointer text-sm font-medium"
                                >
                                    <option value="LOCAL">Local (Intra-city)</option>
                                    <option value="REGIONAL">Regional (Intra-state)</option>
                                    <option value="NATIONAL">National (Inter-state)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isCalculating}
                            className="w-full mt-3 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer text-sm"
                        >
                            {isCalculating ? 'Computing Fee...' : 'Calculate Authoritative Shipping Fee'}
                        </button>
                    </form>
                </div>

                {/* Result Card */}
                <div className="lg:col-span-5 space-y-4">
                    {result ? (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 animate-in fade-in">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rate Calculation Breakdown</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Zone: {result.zone}
                                </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-1">
                                <p className="text-xs text-slate-300">Authoritative Shipping Fee</p>
                                <p className="text-3xl font-extrabold text-amber-400">
                                    ₹{(result.shippingFee || 0).toFixed(2)}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    Currency: {result.currency || 'INR'} • Model: {result.calculationModel || 'STANDARD_SLAB'}
                                </p>
                            </div>

                            <div className="space-y-2 text-xs divide-y divide-slate-100">
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Base Freight:</span>
                                    <span className="font-semibold text-slate-800">₹{(result.shippingFee || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Platform Fee:</span>
                                    <span className="font-semibold text-slate-800">₹{(result.platformFee || 7.00).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Billed Package Weight:</span>
                                    <span className="font-mono text-slate-800">{result.totalWeightGrams || form.weightGrams}g</span>
                                </div>
                            </div>

                            {result.breakdownDetails && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                                    <p className="font-semibold text-slate-700 mb-0.5">Rate Engine Notice:</p>
                                    <p>{result.breakdownDetails}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                            <Calculator size={42} className="mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                            <h4 className="text-sm font-bold text-slate-700">Ready to Compute Rates</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                Enter routing parameters on the left to evaluate zone rates, platform levies, and delivery thresholds.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
