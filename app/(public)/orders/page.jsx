'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import PageTitle from '@/components/PageTitle'
import OrderItem from '@/components/OrderItem'
import Loading from '@/components/Loading'
import { graphqlRequest } from '@/lib/apiClient'
import { LIST_MY_ORDERS_QUERY } from '@/lib/graphql/order'
import { promptLoginModal } from '@/components/AuthModalContext'
import { useCurrency } from '@/lib/features/currency/useCurrency'
import { 
    PackageOpen, 
    ShoppingBag, 
    ArrowRight, 
    RefreshCw, 
    Search, 
    SlidersHorizontal,
    PackageCheck,
    Clock,
    X,
    Sparkles
} from 'lucide-react'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'

    const { isAuthenticated } = useSelector(state => state.auth)
    const { formatPrice } = useCurrency()

    const fetchOrders = async (silent = false) => {
        if (!isAuthenticated) {
            setOrders([])
            setLoading(false)
            return
        }

        try {
            if (!silent) setLoading(true)
            else setIsRefreshing(true)

            const res = await graphqlRequest(LIST_MY_ORDERS_QUERY, { limit: 50, offset: 0 })
            const fetchedOrders = res?.listMyOrders?.orders
            if (Array.isArray(fetchedOrders)) {
                setOrders(fetchedOrders)
            } else {
                setOrders([])
            }
        } catch (err) {
            console.warn('Failed to fetch orders from backend:', err)
            setOrders([])
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [isAuthenticated])

    // Compute category counts
    const counts = useMemo(() => {
        let active = 0
        let delivered = 0
        let cancelled = 0
        let totalSpend = 0

        orders.forEach(order => {
            const st = (order.orderStatus || order.status || 'CONFIRMED').toUpperCase()
            const amt = order.totalAmount ?? order.total ?? 0
            totalSpend += amt

            if (st === 'DELIVERED') {
                delivered++
            } else if (st === 'CANCELLED') {
                cancelled++
            } else {
                active++
            }
        })

        return {
            all: orders.length,
            active,
            delivered,
            cancelled,
            totalSpend
        }
    }, [orders])

    // Filtered orders based on activeTab and searchQuery
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const st = (order.orderStatus || order.status || 'CONFIRMED').toUpperCase()

            // 1. Tab check
            if (activeTab === 'ACTIVE' && (st === 'DELIVERED' || st === 'CANCELLED')) return false
            if (activeTab === 'DELIVERED' && st !== 'DELIVERED') return false
            if (activeTab === 'CANCELLED' && st !== 'CANCELLED') return false

            // 2. Search check
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim()
                const orderNum = (order.orderNumber || order.id || '').toLowerCase()
                const itemMatch = (order.items || order.orderItems || []).some(item => 
                    (item.productName || item.product?.name || '').toLowerCase().includes(query)
                )

                let addressStr = ''
                if (typeof order.shippingAddress === 'string') {
                    addressStr = order.shippingAddress.toLowerCase()
                } else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
                    addressStr = `${order.shippingAddress.name || ''} ${order.shippingAddress.city || ''}`.toLowerCase()
                }

                return orderNum.includes(query) || itemMatch || addressStr.includes(query)
            }

            return true
        })
    }, [orders, activeTab, searchQuery])

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] mx-6 flex flex-col items-center justify-center text-center py-20">
                <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                    <ShoppingBag size={30} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Track Your Orders</h1>
                <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
                    Please sign in to view your live order history, delivery status, and rate your purchased products.
                </p>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => promptLoginModal('Sign in to view orders', 'Please sign in to view your live orders and status updates.')}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    >
                        Sign In Now
                    </button>
                    <Link
                        href="/"
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
                    >
                        Continue Browsing
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] px-4 sm:px-6 py-8">
            {loading ? (
                <Loading 
                    variant="orders" 
                    title="Fetching Your Orders" 
                    subtitle="Retrieving your live order history, invoice details and delivery timelines..." 
                />
            ) : orders.length > 0 ? (
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                    My Orders
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Track packages, review previous purchases, and download official invoices.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-auto">
                            <button
                                type="button"
                                onClick={() => fetchOrders(true)}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
                                title="Refresh order status"
                            >
                                <RefreshCw size={13} className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition"
                            >
                                <span>Continue Shopping</span>
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>

                    {/* Stats & Search Toolbar */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {/* Filter Tabs */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ALL')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                        activeTab === 'ALL'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    All ({counts.all})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ACTIVE')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                        activeTab === 'ACTIVE'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    In Progress ({counts.active})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('DELIVERED')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                        activeTab === 'DELIVERED'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    Delivered ({counts.delivered})
                                </button>
                                {counts.cancelled > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('CANCELLED')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                            activeTab === 'CANCELLED'
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                        }`}
                                    >
                                        Cancelled ({counts.cancelled})
                                    </button>
                                )}
                            </div>

                            {/* Search Bar */}
                            <div className="relative min-w-[240px]">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by order ID or item..."
                                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Orders List Container */}
                    {filteredOrders.length > 0 ? (
                        <div className="space-y-5">
                            {filteredOrders.map((order) => (
                                <OrderItem 
                                    order={order} 
                                    key={order.id} 
                                    onRatingSubmitted={() => fetchOrders(true)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                            <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                <Search size={24} />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">No orders found</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                We couldn&apos;t find any orders matching &ldquo;{searchQuery || activeTab}&rdquo;. Try clearing your search or filters.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('')
                                    setActiveTab('ALL')
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="min-h-[70vh] mx-6 flex flex-col items-center justify-center text-center py-20">
                    <div className="size-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                        <PackageOpen size={30} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">You have no orders yet</h2>
                    <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                        Looks like you haven&apos;t placed any orders yet. Discover our trending catalog and enjoy great discounts!
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition"
                    >
                        Explore Marketplace <ArrowRight size={15} />
                    </Link>
                </div>
            )}
        </div>
    )
}
