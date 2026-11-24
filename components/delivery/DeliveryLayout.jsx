'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import {
    AlertCircle,
    XCircle,
    Truck,
    Send
} from 'lucide-react'
import Loading from '@/components/Loading'
import DeliveryNavbar from './DeliveryNavbar'
import DeliverySidebar from './DeliverySidebar'
import { useResizableSidebar } from '@/lib/hooks/useResizableSidebar'
import { graphqlRequest } from '@/lib/apiClient'
import {
    GET_DELIVERY_PARTNER_PROFILE_QUERY,
    ACTIVATE_DELIVERY_PARTNER_MUTATION,
    DEACTIVATE_DELIVERY_PARTNER_MUTATION
} from '@/lib/graphql/delivery'
import { GET_MY_WAREHOUSES_QUERY } from '@/lib/graphql/inventory'
import toast from 'react-hot-toast'

export const DeliveryContext = createContext({
    profile: null,
    setProfile: () => {},
    refetchProfile: async () => {},
    warehouses: [],
    setWarehouses: () => {},
    refetchWarehouses: async () => {},
    loading: true,
    toggleActiveStatus: async () => {},
})

export const useDelivery = () => useContext(DeliveryContext)

export default function DeliveryLayout({ children }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth)

    const [profile, setProfile] = useState(null)
    const [warehouses, setWarehouses] = useState([])
    const [loading, setLoading] = useState(true)
    const hasInitializedRef = useRef(false)

    const sidebar = useResizableSidebar({
        storageKey: 'gocart_delivery_sidebar_width',
        defaultWidth: 260,
        minWidth: 200,
        maxWidth: 450
    })

    const fetchPartnerProfile = useCallback(async () => {
        try {
            const data = await graphqlRequest(GET_DELIVERY_PARTNER_PROFILE_QUERY).catch((err) => {
                console.warn('Delivery partner profile error:', err)
                return null
            })

            if (data?.deliveryPartnerProfile) {
                setProfile(data.deliveryPartnerProfile)
            }
        } catch (err) {
            console.error('Failed to load delivery profile:', err)
        }
    }, [])

    const fetchWarehouses = useCallback(async () => {
        try {
            const data = await graphqlRequest(GET_MY_WAREHOUSES_QUERY).catch((err) => {
                console.warn('Warehouses error:', err)
                return null
            })

            if (Array.isArray(data?.myWarehouses)) {
                setWarehouses(data.myWarehouses)
            }
        } catch (err) {
            console.error('Failed to load warehouses:', err)
        }
    }, [])

    // Initial data load: run once on mount
    useEffect(() => {
        if (!authLoading && !hasInitializedRef.current) {
            hasInitializedRef.current = true

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            if (!token || !isAuthenticated) {
                router.push(`/delivery/login?redirect=${encodeURIComponent(pathname || '/delivery')}`)
                return
            }

            if (user?.role && user.role !== 'DELIVERY_PARTNER' && user.role !== 'ADMIN') {
                toast.error('Access restricted to registered Delivery Partners')
                router.push('/')
                return
            }

            Promise.allSettled([fetchPartnerProfile(), fetchWarehouses()]).finally(() => {
                setLoading(false)
            })
        }
    }, [authLoading, isAuthenticated, user, router, pathname, fetchPartnerProfile, fetchWarehouses])

    const toggleActiveStatus = async () => {
        if (!profile) return

        const willActivate = !profile.isActive
        const toastId = toast.loading(willActivate ? 'Activating carrier dispatch status...' : 'Pausing dispatch status...')

        try {
            if (willActivate) {
                const res = await graphqlRequest(ACTIVATE_DELIVERY_PARTNER_MUTATION)
                if (res?.activateDeliveryPartner?.success) {
                    setProfile((prev) => (prev ? { ...prev, isActive: true } : prev))
                    toast.success('Carrier online and accepting dispatches!', { id: toastId })
                }
            } else {
                const reason = prompt('Reason for pausing deliveries:', 'Scheduled maintenance') || 'Scheduled maintenance'
                const res = await graphqlRequest(DEACTIVATE_DELIVERY_PARTNER_MUTATION, { reason })
                if (res?.deactivateDeliveryPartner?.success) {
                    setProfile((prev) => (prev ? { ...prev, isActive: false } : prev))
                    toast.success('Carrier dispatch paused (offline)', { id: toastId })
                }
            }
        } catch (err) {
            console.error('Toggle active status error:', err)
            toast.error(err.message || 'Failed to update carrier status', { id: toastId })
        }
    }

    // Full-page loader only on initial load (matches StoreLayout behavior)
    if (loading || authLoading) {
        return (
            <Loading
                variant="delivery"
                title="Connecting to Logistics Hub"
                subtitle="Verifying carrier credentials and active dispatch routes..."
            />
        )
    }

    const currentApproval = profile?.approvalStatus || 'PENDING'
    const isRejected = currentApproval === 'REJECTED'

    return (
        <DeliveryContext.Provider
            value={{
                profile,
                setProfile,
                refetchProfile: fetchPartnerProfile,
                warehouses,
                setWarehouses,
                refetchWarehouses: fetchWarehouses,
                loading,
                toggleActiveStatus,
                sidebar,
            }}
        >
            <div className="flex flex-col h-screen bg-slate-50">
                <DeliveryNavbar
                    profile={profile}
                    onToggleActive={toggleActiveStatus}
                    onProfileUpdate={(updated) => setProfile((prev) => (prev ? { ...prev, ...updated } : updated))}
                    sidebar={sidebar}
                />

                <div className="flex flex-1 items-start h-full overflow-hidden">
                    <DeliverySidebar profile={profile} sidebar={sidebar} />
                    <div className="flex-1 h-full p-5 lg:p-8 overflow-y-scroll">
                        {/* Status Banners (matches StoreLayout style & placement) */}
                        {isRejected && (
                            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-900 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <XCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-sm">Carrier Application Rejected</p>
                                        <p className="text-xs text-rose-700 mt-0.5">
                                            {profile?.rejectionReason
                                                ? `Reason: ${profile.rejectionReason}`
                                                : 'Compliance documentation or GSTIN verification failed platform standards. Please review your details and submit an appeal.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href="/delivery/settings"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                                    >
                                        Review & Submit Appeal &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>
        </DeliveryContext.Provider>
    )
}
