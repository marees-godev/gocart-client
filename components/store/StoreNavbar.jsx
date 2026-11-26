'use client'
import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import {
    LogOut,
    User,
    Store,
    ExternalLink,
    ChevronDown,
    Home,
    Settings,
    LayoutList,
    Package
} from "lucide-react"
import { logout } from "@/lib/features/auth/authSlice"
import { graphqlRequest } from "@/lib/apiClient"
import { LOGOUT_MUTATION } from "@/lib/graphql/auth"
import toast from "react-hot-toast"

const StoreNavbar = ({ storeInfo, sidebar }) => {
    const router = useRouter()
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

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
            toast.success("Signed out of merchant portal")
            router.push("/merchant/login")
        }
    }

    const approvalStatus = storeInfo?.approvalStatus || 'DRAFT'

    return (
        <div className="flex items-center justify-between px-6 sm:px-12 py-3.5 border-b border-slate-200 bg-white transition-all">
            <div className="flex items-center gap-3">
                <Link href="/" className="relative text-3xl sm:text-4xl font-semibold text-slate-800">
                    <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                    <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full text-white bg-green-600 align-middle">
                        Store
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        (approvalStatus === 'APPROVED' || approvalStatus === 'approved')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (approvalStatus === 'DRAFT' || approvalStatus === 'draft')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : (approvalStatus === 'REJECTED' || approvalStatus === 'rejected')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                        {approvalStatus === 'APPROVED' ? '● Live Store' : `Status: ${approvalStatus}`}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {storeInfo?.slug && (approvalStatus === 'APPROVED' || approvalStatus === 'approved') && (
                    <Link
                        href={`/shop/${storeInfo.slug}`}
                        target="_blank"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                        Storefront <ExternalLink size={12} />
                    </Link>
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
                        <div className="size-6 rounded-lg bg-green-600/10 text-green-700 flex items-center justify-center font-bold text-xs">
                            <User size={14} />
                        </div>
                        <span className="font-semibold text-xs max-w-[140px] truncate text-slate-800">
                            {user?.name || storeInfo?.name || "Merchant"}
                        </span>
                        <ChevronDown
                            size={14}
                            className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                                dropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                                <p className="font-bold text-xs text-slate-800 truncate">
                                    {user?.name || storeInfo?.name || "Merchant"}
                                </p>
                                {(user?.email || storeInfo?.businessEmail) && (
                                    <p className="text-[11px] text-slate-500 truncate">
                                        {user?.email || storeInfo?.businessEmail}
                                    </p>
                                )}
                                {storeInfo?.name && (
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                        Store: {storeInfo.name}
                                    </p>
                                )}
                            </div>

                            <div className="p-1 space-y-0.5 text-xs">
                                <Link
                                    href="/profile"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                >
                                    <User size={15} className="text-green-600" />
                                    <span>Account Profile</span>
                                </Link>

                                <Link
                                    href="/store"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                >
                                    <Home size={15} className="text-slate-500" />
                                    <span>Seller Dashboard</span>
                                </Link>

                                <Link
                                    href="/store/manage-product"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                >
                                    <Package size={15} className="text-slate-500" />
                                    <span>Manage Products</span>
                                </Link>

                                <Link
                                    href="/store/orders"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                >
                                    <LayoutList size={15} className="text-slate-500" />
                                    <span>Store Orders</span>
                                </Link>

                                <Link
                                    href="/store/settings"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
                                >
                                    <Settings size={15} className="text-slate-500" />
                                    <span>Store Settings</span>
                                </Link>
                            </div>

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

                <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Sign out of seller account"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    )
}

export default StoreNavbar