'use client'

import React, { useState, useEffect } from 'react'
import {
    X,
    MapPin,
    Home,
    Briefcase,
    Building2,
    User,
    Phone,
    Mail,
    Globe,
    Check,
    Navigation,
    Loader2
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { addAddress, updateAddress, normalizeAddress } from '@/lib/features/address/addressSlice'
import { graphqlRequest } from '@/lib/apiClient'
import { CREATE_USER_ADDRESS_MUTATION, UPDATE_USER_ADDRESS_MUTATION } from '@/lib/graphql/address'
import toast from 'react-hot-toast'

const ADDRESS_TYPES = [
    { id: 'Home', label: 'Home', icon: Home, desc: 'All-day delivery' },
    { id: 'Work', label: 'Work', icon: Briefcase, desc: 'Delivery 9AM - 6PM' },
    { id: 'Other', label: 'Other', icon: MapPin, desc: 'Custom address' },
]

// Extract user ID safely from state, localStorage, or JWT token
export function resolveUserId(userFromProps, reduxUser) {
    if (userFromProps) return userFromProps
    if (reduxUser?.id) return reduxUser.id

    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser)
                if (parsed?.id) return parsed.id
            } catch {}
        }

        const token = localStorage.getItem('token')
        if (token) {
            try {
                const base64Url = token.split('.')[1]
                if (base64Url) {
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                    const payload = JSON.parse(atob(base64))
                    return payload.user_id || payload.userId || payload.sub || payload.customer_id || ''
                }
            } catch {}
        }
    }
    return ''
}

const AddressModal = ({ setShowAddressModal, editAddress = null, userId = null, onSuccess = null }) => {
    const dispatch = useDispatch()
    const reduxUser = useSelector(state => state.auth?.user)
    const effectiveUserId = resolveUserId(userId, reduxUser)

    const [formData, setFormData] = useState({
        title: 'Home',
        name: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
        isDefault: false,
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (editAddress) {
            setFormData({
                title: editAddress.label || editAddress.title || 'Home',
                name: editAddress.fullName || editAddress.name || '',
                phone: editAddress.phoneNumber || editAddress.phone || '',
                email: editAddress.emailAddress || editAddress.email || '',
                street: editAddress.addressLine || editAddress.street || '',
                city: editAddress.city || '',
                state: editAddress.state || '',
                zip: editAddress.postalCode || editAddress.zip || '',
                country: editAddress.country || 'United States',
                isDefault: Boolean(editAddress.isDefault),
            })
        }
    }, [editAddress])

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name.trim() || !formData.street.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip.trim() || !formData.phone.trim()) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            if (editAddress && editAddress.id) {
                // UPDATE Address on Backend
                const input = {
                    label: formData.title,
                    fullName: formData.name.trim(),
                    phoneNumber: formData.phone.trim(),
                    emailAddress: formData.email?.trim() || null,
                    addressLine: formData.street.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    postalCode: formData.zip.trim(),
                    country: formData.country.trim() || 'United States',
                    isDefault: Boolean(formData.isDefault),
                }

                let updatedAddr = null
                try {
                    const response = await graphqlRequest(UPDATE_USER_ADDRESS_MUTATION, {
                        id: editAddress.id,
                        input
                    })
                    if (response?.updateUserAddress) {
                        updatedAddr = normalizeAddress(response.updateUserAddress)
                    }
                } catch (beError) {
                    console.warn('Backend update address warning, falling back to local update:', beError)
                }

                const finalPayload = updatedAddr || normalizeAddress({ ...editAddress, ...formData })
                dispatch(updateAddress(finalPayload))
                toast.success('Address updated successfully!')
                if (onSuccess) onSuccess(finalPayload)
            } else {
                // CREATE Address on Backend
                if (!effectiveUserId) {
                    toast.error('Please log in to save your address to your account')
                    setIsSubmitting(false)
                    return
                }

                const input = {
                    label: formData.title,
                    fullName: formData.name.trim(),
                    phoneNumber: formData.phone.trim(),
                    emailAddress: formData.email?.trim() || null,
                    addressLine: formData.street.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    postalCode: formData.zip.trim(),
                    country: formData.country.trim() || 'United States',
                    isDefault: Boolean(formData.isDefault),
                }

                let createdAddr = null
                try {
                    const response = await graphqlRequest(CREATE_USER_ADDRESS_MUTATION, {
                        userId: effectiveUserId,
                        input
                    })
                    if (response?.createUserAddress) {
                        createdAddr = normalizeAddress(response.createUserAddress)
                    }
                } catch (beError) {
                    console.error('Backend create address error:', beError)
                    throw beError
                }

                const finalPayload = createdAddr || normalizeAddress({
                    id: `addr_${Date.now()}`,
                    userId: effectiveUserId,
                    ...formData
                })

                dispatch(addAddress(finalPayload))
                toast.success('New address saved to your account!')
                if (onSuccess) onSuccess(finalPayload)
            }

            setShowAddressModal(false)
        } catch (error) {
            console.error('Failed to save address:', error)
            toast.error(error.message || 'Failed to save address. Please check your inputs.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setShowAddressModal(false)}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
            >
                {/* Header Section */}
                <div className="relative px-6 sm:px-8 pt-6 pb-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-green-500/20">
                                <MapPin size={22} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    {editAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Saved to your GoCart account for fast checkout & deliveries
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAddressModal(false)}
                            className="size-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition active:scale-90"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Address Type Selector */}
                    <div className="mt-5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                            Address Type / Label
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            {ADDRESS_TYPES.map((type) => {
                                const Icon = type.icon
                                const isSelected = formData.title === type.id
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, title: type.id }))}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                                            isSelected
                                                ? 'border-green-500 bg-green-50/80 text-green-700 shadow-sm ring-2 ring-green-500/20'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon size={16} className={isSelected ? 'text-green-600' : 'text-slate-400'} />
                                        <span>{type.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto px-6 sm:px-8 py-5 space-y-4 flex-1">
                    {/* Recipient Information */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Contact Details
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">
                                Email Address <span className="text-slate-400 font-normal">(Optional for delivery updates)</span>
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="johndoe@example.com"
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-3 pt-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Address Details
                        </span>

                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">
                                Street Address / Apartment / Suite <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Navigation size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.street}
                                    onChange={handleChange}
                                    placeholder="House / Flat No., Building Name, Street"
                                    required
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City / District"
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    State / Province <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="State or Region"
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    Postal / ZIP Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    placeholder="e.g. 10001"
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="Country"
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-green-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition ring-0 focus:ring-4 focus:ring-green-500/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Default Checkbox */}
                    <div className="pt-2">
                        <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 cursor-pointer transition">
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={formData.isDefault}
                                onChange={handleChange}
                                className="mt-0.5 size-4 rounded text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer"
                            />
                            <div className="text-xs">
                                <span className="font-semibold text-slate-800 block">Set as default delivery address</span>
                                <span className="text-slate-500">We will automatically use this address for future checkouts</span>
                            </div>
                        </label>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowAddressModal(false)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md shadow-green-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Saving to server...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={16} className="stroke-[2.5]" />
                                    <span>{editAddress ? 'Update Address' : 'Save Address'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddressModal