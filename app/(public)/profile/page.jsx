'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Camera,
    Shield,
    Key,
    Bell,
    Plus,
    Trash2,
    Edit3,
    CheckCircle,
    Package,
    Heart,
    ShoppingBag,
    Save,
    AlertTriangle,
    Eye,
    EyeOff
} from 'lucide-react'
import { assets } from '@/assets/assets'
import toast from 'react-hot-toast'
import AddressModal from '@/components/AddressModal'

export default function ProfilePage() {
    // Active navigation tab
    const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'addresses' | 'security' | 'preferences'
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [editingAddress, setEditingAddress] = useState(null)

    // Profile form state (Design placeholder - replace with your JS / Auth logic)
    const [profileData, setProfileData] = useState({
        firstName: 'Alex',
        lastName: 'Morgan',
        email: 'alex.morgan@example.com',
        phone: '+1 (555) 234-5678',
        gender: 'male', // 'male' | 'female' | 'other'
        dob: '1995-06-15',
        bio: 'Tech enthusiast, music lover, and frequent GoCart shopper.',
        avatar: null
    })

    // Password & Security state
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorAuth: true
    })
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    })

    // Saved Addresses mock state
    const [addresses, setAddresses] = useState([
        {
            id: 1,
            title: 'Home',
            isDefault: true,
            name: 'Alex Morgan',
            phone: '+1 (555) 234-5678',
            street: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'OR',
            zip: '97477',
            country: 'United States'
        },
        {
            id: 2,
            title: 'Office',
            isDefault: false,
            name: 'Alex Morgan',
            phone: '+1 (555) 876-5432',
            street: '100 Silicon Ave, Suite 400',
            city: 'San Francisco',
            state: 'CA',
            zip: '94107',
            country: 'United States'
        }
    ])

    // Notification Preferences state
    const [preferences, setPreferences] = useState({
        orderUpdates: true,
        promotions: false,
        newsletter: true,
        smsAlerts: true
    })

    // Input handlers
    const handleProfileChange = (e) => {
        const { name, value } = e.target
        setProfileData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSecurityChange = (e) => {
        const { name, value } = e.target
        setSecurityData((prev) => ({ ...prev, [name]: value }))
    }

    const handlePreferenceToggle = (key) => {
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const handleOpenAddAddress = () => {
        setEditingAddress(null)
        setShowAddressModal(true)
    }

    const handleOpenEditAddress = (addr) => {
        setEditingAddress(addr)
        setShowAddressModal(true)
    }

    const handleDeleteAddress = (addrId) => {
        setAddresses(prev => prev.filter(a => a.id !== addrId))
        toast.success('Address removed successfully')
    }

    const handleSetDefaultAddress = (addrId) => {
        setAddresses(prev => prev.map(a => ({
            ...a,
            isDefault: a.id === addrId
        })))
        toast.success('Default address updated')
    }

    const handleAddressSaved = (savedAddr) => {
        if (editingAddress) {
            setAddresses(prev => prev.map(a => a.id === savedAddr.id ? savedAddr : (savedAddr.isDefault ? { ...a, isDefault: false } : a)))
        } else {
            const newEntry = {
                ...savedAddr,
                id: savedAddr.id || Date.now()
            }
            if (newEntry.isDefault) {
                setAddresses(prev => [...prev.map(a => ({ ...a, isDefault: false })), newEntry])
            } else {
                setAddresses(prev => [...prev, newEntry])
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. Profile Hero Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8">
                    {/* Background Decorative Accent */}
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-green-100/50 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                        
                        {/* Avatar & User Info */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                            <div className="relative group">
                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-green-500/20 bg-gradient-to-tr from-green-500 to-emerald-400 p-1 shadow-md">
                                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-slate-400 text-3xl font-bold">
                                        {profileData.avatar ? (
                                            <Image
                                                src={profileData.avatar}
                                                alt="User Profile"
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-slate-700">
                                                {profileData.firstName[0]}
                                                {profileData.lastName[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Upload photo overlay / button */}
                                <label className="absolute bottom-1 right-1 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                                    <Camera size={16} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setProfileData({
                                                    ...profileData,
                                                    avatar: URL.createObjectURL(e.target.files[0])
                                                })
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                                        {profileData.firstName} {profileData.lastName}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                        <CheckCircle size={13} /> Verified Buyer
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                                    <Mail size={15} className="text-slate-400" />
                                    {profileData.email}
                                </p>
                                <p className="text-xs text-slate-400">Member since January 2024</p>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full md:w-auto">
                            <Link
                                href="/orders"
                                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 hover:bg-green-50/60 border border-slate-200/80 transition-all hover:border-green-300 group"
                            >
                                <div className="p-2 rounded-xl bg-green-100 text-green-600 mb-1 group-hover:scale-110 transition-transform">
                                    <Package size={18} />
                                </div>
                                <span className="text-lg font-bold text-slate-800">12</span>
                                <span className="text-xs text-slate-500">Orders</span>
                            </Link>

                            <button
                                onClick={() => setActiveTab('addresses')}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 transition-all hover:border-indigo-300 group"
                            >
                                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 mb-1 group-hover:scale-110 transition-transform">
                                    <MapPin size={18} />
                                </div>
                                <span className="text-lg font-bold text-slate-800">{addresses.length}</span>
                                <span className="text-xs text-slate-500">Addresses</span>
                            </button>

                            <Link
                                href="/cart"
                                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 transition-all hover:border-amber-300 group"
                            >
                                <div className="p-2 rounded-xl bg-amber-100 text-amber-600 mb-1 group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={18} />
                                </div>
                                <span className="text-lg font-bold text-slate-800">3</span>
                                <span className="text-xs text-slate-500">Cart Items</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2. Main Profile Content (Sidebar + Content Panel) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-1 space-y-2">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-row lg:flex-col gap-1 overflow-x-auto">
                            
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
                                    activeTab === 'profile'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <User size={18} />
                                <span>Personal Info</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('addresses')}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
                                    activeTab === 'addresses'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <MapPin size={18} />
                                <span>Saved Addresses</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('security')}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
                                    activeTab === 'security'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Shield size={18} />
                                <span>Account Security</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
                                    activeTab === 'preferences'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Bell size={18} />
                                <span>Preferences</span>
                            </button>
                        </div>

                        {/* Quick link to Seller Store Creation */}
                        <div className="hidden lg:block bg-gradient-to-br from-green-600 to-emerald-700 text-white p-5 rounded-2xl shadow-sm space-y-3">
                            <h3 className="font-semibold text-lg">Become a Seller</h3>
                            <p className="text-xs text-green-100 leading-relaxed">
                                Open your own storefront on GoCart and start selling your products today.
                            </p>
                            <Link
                                href="/create-store"
                                className="inline-block w-full text-center py-2 px-4 bg-white text-green-800 font-medium text-xs rounded-xl shadow hover:bg-green-50 transition"
                            >
                                Create Your Store
                            </Link>
                        </div>
                    </div>

                    {/* Content Panel Area */}
                    <div className="lg:col-span-3">
                        
                        {/* TAB 1: PERSONAL INFORMATION */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
                                    <p className="text-sm text-slate-500">
                                        Update your personal details and how your profile appears.
                                    </p>
                                </div>

                                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                First Name
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={profileData.firstName}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                                    placeholder="e.g. Alex"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Last Name
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={profileData.lastName}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                                    placeholder="e.g. Morgan"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profileData.email}
                                                    onChange={handleProfileChange}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                                    placeholder="name@example.com"
                                                />
                                                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={profileData.phone}
                                                    onChange={handleProfileChange}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                                <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Date of Birth
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name="dob"
                                                    value={profileData.dob}
                                                    onChange={handleProfileChange}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                                />
                                                <Calendar size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Gender
                                            </label>
                                            <select
                                                name="gender"
                                                value={profileData.gender}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition bg-white"
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer_not_to_say">Prefer not to say</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            About / Bio
                                        </label>
                                        <textarea
                                            rows={3}
                                            name="bio"
                                            value={profileData.bio}
                                            onChange={handleProfileChange}
                                            placeholder="Write a few lines about yourself..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition resize-none"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                                        >
                                            Discard Changes
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium shadow-sm active:scale-95 transition"
                                        >
                                            <Save size={16} />
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 2: SAVED ADDRESSES */}
                        {activeTab === 'addresses' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Saved Addresses</h2>
                                        <p className="text-sm text-slate-500">
                                            Manage your shipping and delivery destinations.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleOpenAddAddress}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition active:scale-95 cursor-pointer"
                                    >
                                        <Plus size={16} />
                                        Add New Address
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            className={`relative rounded-2xl p-5 border transition-all ${
                                                addr.isDefault
                                                    ? 'border-green-500/80 bg-green-50/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{addr.title}</span>
                                                    {addr.isDefault && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditAddress(addr)}
                                                        className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                        title="Edit Address"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                        className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        title="Delete Address"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="text-sm text-slate-600 space-y-1">
                                                <p className="font-medium text-slate-800">{addr.name}</p>
                                                <p>{addr.street}</p>
                                                <p>{addr.city}, {addr.state} {addr.zip}</p>
                                                <p>{addr.country}</p>
                                                <p className="text-xs text-slate-400 pt-1">Phone: {addr.phone}</p>
                                            </div>

                                            {!addr.isDefault && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                                    className="mt-4 text-xs font-semibold text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add Address Placeholder Card */}
                                    <button
                                        type="button"
                                        onClick={handleOpenAddAddress}
                                        className="h-full min-h-[170px] border-2 border-dashed border-slate-200 hover:border-green-500 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:text-green-600 transition group cursor-pointer"
                                    >
                                        <div className="p-3 rounded-full bg-slate-50 group-hover:bg-green-50 text-slate-400 group-hover:text-green-600 mb-2 transition">
                                            <Plus size={20} />
                                        </div>
                                        <span className="text-sm font-medium">Add another address</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: ACCOUNT SECURITY */}
                        {activeTab === 'security' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-8">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Security Settings</h2>
                                    <p className="text-sm text-slate-500">
                                        Update your password and enhance your account protection.
                                    </p>
                                </div>

                                {/* Password Form */}
                                <form onSubmit={(e) => e.preventDefault()} className="space-y-5 max-w-xl">
                                    <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                        <Key size={18} className="text-slate-500" /> Change Password
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.current ? 'text' : 'password'}
                                                name="currentPassword"
                                                value={securityData.currentPassword}
                                                onChange={handleSecurityChange}
                                                placeholder="••••••••"
                                                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.new ? 'text' : 'password'}
                                                name="newPassword"
                                                value={securityData.newPassword}
                                                onChange={handleSecurityChange}
                                                placeholder="••••••••"
                                                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.confirm ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={securityData.confirmPassword}
                                                onChange={handleSecurityChange}
                                                placeholder="••••••••"
                                                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none text-slate-800 text-sm transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium shadow-sm transition"
                                    >
                                        Update Password
                                    </button>
                                </form>

                                {/* Two-factor Authentication Block */}
                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-slate-800 text-sm">Two-Factor Authentication (2FA)</h4>
                                        <p className="text-xs text-slate-500 max-w-md">
                                            Add an extra layer of security to your GoCart account by verifying logins with a code.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSecurityData((prev) => ({
                                                ...prev,
                                                twoFactorAuth: !prev.twoFactorAuth
                                            }))
                                        }
                                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                            securityData.twoFactorAuth ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <div
                                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                securityData.twoFactorAuth ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Danger Zone */}
                                <div className="pt-6 border-t border-red-100">
                                    <div className="rounded-2xl bg-red-50/50 border border-red-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <h4 className="font-semibold text-red-800 text-sm flex items-center gap-1.5">
                                                <AlertTriangle size={16} className="text-red-600" /> Delete Account
                                            </h4>
                                            <p className="text-xs text-red-600/80">
                                                Once deleted, all your orders, addresses, and data will be permanently removed.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: PREFERENCES */}
                        {activeTab === 'preferences' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Notification Preferences</h2>
                                    <p className="text-sm text-slate-500">
                                        Choose what notifications and updates you wish to receive.
                                    </p>
                                </div>

                                <div className="space-y-4 divide-y divide-slate-100">
                                    <div className="pt-4 first:pt-0 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">Order & Delivery Updates</h4>
                                            <p className="text-xs text-slate-500">Get notified when your order status changes or ships.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handlePreferenceToggle('orderUpdates')}
                                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                                preferences.orderUpdates ? 'bg-green-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <div
                                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                    preferences.orderUpdates ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">Exclusive Deals & Offers</h4>
                                            <p className="text-xs text-slate-500">Receive coupons, flash sales, and personalized discounts.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handlePreferenceToggle('promotions')}
                                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                                preferences.promotions ? 'bg-green-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <div
                                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                    preferences.promotions ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">Weekly Newsletter</h4>
                                            <p className="text-xs text-slate-500">Curated weekly highlights on trending tech & lifestyle items.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handlePreferenceToggle('newsletter')}
                                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                                preferences.newsletter ? 'bg-green-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <div
                                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                    preferences.newsletter ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">SMS Notifications</h4>
                                            <p className="text-xs text-slate-500">Receive instant SMS text message alerts for package delivery.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handlePreferenceToggle('smsAlerts')}
                                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                                preferences.smsAlerts ? 'bg-green-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <div
                                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                    preferences.smsAlerts ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showAddressModal && (
                <AddressModal
                    setShowAddressModal={setShowAddressModal}
                    editAddress={editingAddress}
                    onSuccess={handleAddressSaved}
                />
            )}
        </div>
    )
}
