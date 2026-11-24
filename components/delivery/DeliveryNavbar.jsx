'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import {
    LogOut,
    User,
    Truck,
    ShieldCheck,
    AlertTriangle,
    ChevronDown,
    Settings,
    Warehouse,
    Package,
    Home,
    PlusCircle,
    Activity
} from 'lucide-react'
import { logout } from '@/lib/features/auth/authSlice'
import { graphqlRequest } from '@/lib/apiClient'
import { LOGOUT_MUTATION } from '@/lib/graphql/auth'
import GstinModal from './GstinModal'
import toast from 'react-hot-toast'

export default function DeliveryNavbar({ profile, onToggleActive, onProfileUpdate, sidebar }) {
    const router = useRouter()
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [gstinModalOpen, setGstinModalOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            await graphqlRequest(LOGOUT_MUTATION)
        } catch (err) {
            console.warn('Backend logout notice:', err)
        } finally {
            dispatch(logout())
            toast.success('Signed out of delivery portal')
            router.push('/delivery/login')
        }
    }

    const partnerName = profile?.companyName || user?.name || 'Carrier Partner'
    const approvalStatus = profile?.approvalStatus || 'PENDING'
    const isApproved = approvalStatus === 'APPROVED'
    const partnerId = profile?.partnerId || profile?.id || user?.id

    return (
        <>
            <div className="flex items-center justify-between px-6 sm:px-12 py-3.5 border-b border-slate-200 bg-white transition-all">
                {/* Logo & Brand Navigation (matches StoreNavbar exactly) */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="relative text-3xl sm:text-4xl font-semibold text-slate-800 hover:opacity-95 transition"
                        title="GoCart Home"
                    >
                        <span className="text-amber-600">go</span>cart<span className="text-amber-600 text-5xl leading-0">.</span>
                        <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full text-white bg-amber-600 align-middle">
                            Logistics
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                isApproved
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : approvalStatus === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                        >
                            {isApproved ? '● Verified Carrier' : `Approval: ${approvalStatus}`}
                        </span>

                        {profile && (
                            <button
                                type="button"
                                onClick={onToggleActive}
                                className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                    profile.isActive
                                        ? 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Click to toggle carrier online/offline dispatch state"
                            >
                                <span
                                    className={`size-1.5 rounded-full ${
                                        profile.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                                    }`}
                                />
                                {profile.isActive ? 'Online & Dispatching' : 'Paused (Offline)'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side Navigation & Profile Actions */}
                <div className="flex items-center gap-3">
                    {/* GSTIN Badge or Quick Add Button */}
                    {profile?.gstin ? (
                        <button
                            type="button"
                            onClick={() => setGstinModalOpen(true)}
                            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 transition cursor-pointer"
                            title="Click to view or update GSTIN"
                        >
                            {profile.isGstinVerified ? (
                                <ShieldCheck size={14} className="text-emerald-600" />
                            ) : (
                                <AlertTriangle size={14} className="text-amber-600" />
                            )}
                            <span className="font-mono text-[11px] font-bold">{profile.gstin}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setGstinModalOpen(true)}
                            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold transition cursor-pointer animate-pulse"
                            title="Register 15-character GSTIN to verify carrier account"
                        >
                            <PlusCircle size={13} />
                            <span>+ Enter GSTIN</span>
                        </button>
                    )}

                    {/* Interactive Profile Pill Button & Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs group"
                            aria-expanded={dropdownOpen}
                            aria-haspopup="true"
                        >
                            <div className="size-6 rounded-lg bg-amber-600/10 text-amber-700 flex items-center justify-center font-bold text-xs">
                                <User size={14} />
                            </div>
                            <span className="font-semibold text-xs max-w-[140px] truncate text-slate-800">
                                {partnerName}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                                    dropdownOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {/* Profile Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                {/* Carrier Profile Header */}
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                                    <p className="font-bold text-xs text-slate-800 truncate">{partnerName}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{user?.email || profile?.email}</p>
                                    {partnerId && (
                                        <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                                            ID: {partnerId}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <span
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                isApproved
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}
                                        >
                                            {approvalStatus}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {profile?.isActive ? '● Online' : '○ Paused'}
                                        </span>
                                    </div>
                                </div>

                                {/* Menu Links */}
                                <div className="p-1 space-y-0.5 text-xs">
                                    <Link
                                        href="/delivery"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                    >
                                        <Home size={15} className="text-amber-600" />
                                        <span>Command Dashboard</span>
                                    </Link>

                                    <Link
                                        href="/delivery/settings"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                    >
                                        <Settings size={15} className="text-slate-500" />
                                        <span>Carrier Settings & GSTIN</span>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            setGstinModalOpen(true)
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium text-left cursor-pointer"
                                    >
                                        <ShieldCheck size={15} className="text-emerald-600" />
                                        <span>{profile?.gstin ? 'Manage GSTIN' : 'Enter GST Number'}</span>
                                    </button>

                                    <Link
                                        href="/delivery/warehouses"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                    >
                                        <Warehouse size={15} className="text-slate-500" />
                                        <span>Warehouse Hubs</span>
                                    </Link>

                                    <Link
                                        href="/delivery/dispatch"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                    >
                                        <Package size={15} className="text-slate-500" />
                                        <span>Shipments & Dispatch</span>
                                    </Link>

                                    <Link
                                        href="/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                    >
                                        <User size={15} className="text-slate-500" />
                                        <span>Account Profile</span>
                                    </Link>
                                </div>

                                {/* Divider & Sign Out */}
                                <div className="p-1 border-t border-slate-100 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            handleLogout()
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition font-medium text-xs text-left cursor-pointer"
                                    >
                                        <LogOut size={15} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Standalone Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Sign out of delivery partner account"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* GSTIN Input Modal */}
            <GstinModal
                isOpen={gstinModalOpen}
                onClose={() => setGstinModalOpen(false)}
                partnerId={partnerId}
                currentGstin={profile?.gstin}
                onSuccess={(updatedProfile) => {
                    if (onProfileUpdate) {
                        onProfileUpdate(updatedProfile)
                    }
                }}
            />
        </>
    )
}
