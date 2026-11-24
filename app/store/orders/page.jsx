'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import Loading from '@/components/Loading'
import { graphqlRequest } from '@/lib/apiClient'
import { LIST_MY_ORDERS_QUERY, UPDATE_ORDER_STATUS_MUTATION } from '@/lib/graphql/order'
import { useStore } from '@/components/store/StoreLayout'
import { useCurrency } from '@/lib/features/currency/useCurrency'
import toast from 'react-hot-toast'
import {
    Package,
    ShoppingBag,
    Search,
    RefreshCw,
    Eye,
    Copy,
    Check,
    Calendar,
    MapPin,
    Phone,
    CreditCard,
    Printer,
    X,
    AlertCircle,
    CheckCircle2,
    Clock,
    Truck,
    ExternalLink,
    DollarSign
} from 'lucide-react'

const ORDER_STATUS_OPTIONS = [
    { value: 'CREATED', label: 'Order Placed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'PROCESSING', label: 'Processing', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
]

function parseAddress(shippingAddress) {
    if (!shippingAddress) return null
    if (typeof shippingAddress === 'object') return shippingAddress
    try {
        return JSON.parse(shippingAddress)
    } catch {
        return { street: String(shippingAddress) }
    }
}

export default function StoreOrders() {
    const { formatPrice } = useCurrency()
    const { storeInfo } = useStore()
    const products = useSelector(state => state.product?.list || [])

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [updatingId, setUpdatingId] = useState(null)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    const [copiedId, setCopiedId] = useState(null)
    const [copiedAddress, setCopiedAddress] = useState(false)

    const fetchOrders = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            else setRefreshing(true)

            const data = await graphqlRequest(LIST_MY_ORDERS_QUERY, { limit: 100, offset: 0 }).catch(() => null)
            const list = data?.listMyOrders?.orders
            if (Array.isArray(list)) {
                // If merchant has a specific storeId, filter to match their store or show all merchant orders
                const storeOrders = storeInfo?.id 
                    ? list.filter(o => !o.storeId || String(o.storeId) === String(storeInfo.id))
                    : list
                setOrders(storeOrders)
            } else {
                setOrders([])
            }
        } catch (err) {
            console.error('Failed to fetch store orders:', err)
            setOrders([])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [storeInfo?.id])

    const handleUpdateStatus = async (orderId, newStatus) => {
        setUpdatingId(orderId)
        const prevOrders = [...orders]

        // Optimistic UI update
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return { ...o, status: newStatus, orderStatus: newStatus }
            }
            return o
        }))

        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => ({ ...prev, status: newStatus, orderStatus: newStatus }))
        }

        try {
            await graphqlRequest(UPDATE_ORDER_STATUS_MUTATION, {
                id: String(orderId),
                status: String(newStatus),
            })
            toast.success(`Order marked as ${newStatus}!`)
            fetchOrders(true)
        } catch (err) {
            console.error('Failed to update order status:', err)
            toast.error(err.message || 'Failed to update order status')
            setOrders(prevOrders)
        } finally {
            setUpdatingId(null)
        }
    }

    const handleCopy = (text, id) => {
        if (!text) return
        navigator.clipboard?.writeText(text)
        setCopiedId(id)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopiedId(null), 2000)
    }

    const openModal = (order) => {
        setSelectedOrder(order)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setSelectedOrder(null)
        setIsModalOpen(false)
        setCopiedAddress(false)
    }

    // KPI Metrics calculation
    const metrics = useMemo(() => {
        let totalRevenue = 0
        let pendingDispatch = 0
        let completed = 0

        orders.forEach(o => {
            const amt = typeof o.totalAmount === 'number' ? o.totalAmount : (parseFloat(o.totalAmount) || 0)
            totalRevenue += amt

            const st = (o.orderStatus || o.status || 'CREATED').toUpperCase()
            if (st === 'CREATED' || st === 'ORDER_PLACED' || st === 'CONFIRMED' || st === 'PROCESSING') {
                pendingDispatch++
            } else if (st === 'DELIVERED') {
                completed++
            }
        })

        return {
            totalOrders: orders.length,
            totalRevenue,
            pendingDispatch,
            completed,
        }
    }, [orders])

    // Filtered orders list
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const st = (order.orderStatus || order.status || 'CREATED').toUpperCase()

            // Tab filtering
            if (activeTab === 'PENDING') {
                if (st !== 'CREATED' && st !== 'ORDER_PLACED' && st !== 'CONFIRMED' && st !== 'PROCESSING') return false
            } else if (activeTab === 'SHIPPED') {
                if (st !== 'SHIPPED') return false
            } else if (activeTab === 'DELIVERED') {
                if (st !== 'DELIVERED') return false
            } else if (activeTab === 'CANCELLED') {
                if (st !== 'CANCELLED') return false
            }

            // Search query filtering
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim()
                const orderNum = (order.orderNumber || order.id || '').toLowerCase()
                const addr = parseAddress(order.shippingAddress)
                const customerName = (addr?.name || '').toLowerCase()
                const customerPhone = (addr?.phone || '').toLowerCase()
                const itemsMatch = (order.items || order.orderItems || []).some(item => 
                    (item.productName || item.product?.name || '').toLowerCase().includes(query)
                )

                return orderNum.includes(query) || customerName.includes(query) || customerPhone.includes(query) || itemsMatch
            }

            return true
        })
    }, [orders, activeTab, searchQuery])

    if (loading) {
        return (
            <Loading 
                variant="merchant" 
                title="Loading Store Orders" 
                subtitle="Fetching pending customer orders, fulfillment manifests & shipping addresses..." 
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Store Orders & Fulfillment</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage incoming customer orders, review delivery addresses, update fulfillment status, and print manifests.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Merchant KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Orders</span>
                        <ShoppingBag size={16} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">{metrics.totalOrders}</p>
                    <p className="text-[11px] text-slate-400">All-time store volume</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-amber-600">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Needs Action</span>
                        <Clock size={16} />
                    </div>
                    <p className="text-2xl font-extrabold text-amber-600">{metrics.pendingDispatch}</p>
                    <p className="text-[11px] text-slate-400">Awaiting packing/dispatch</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-600">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Fulfilled</span>
                        <CheckCircle2 size={16} />
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-600">{metrics.completed}</p>
                    <p className="text-[11px] text-slate-400">Successfully delivered</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
                        <DollarSign size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">{formatPrice(metrics.totalRevenue)}</p>
                    <p className="text-[11px] text-slate-400">Total customer spend</p>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                        All ({orders.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('PENDING')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            activeTab === 'PENDING'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                    >
                        Needs Action ({metrics.pendingDispatch})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('SHIPPED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            activeTab === 'SHIPPED'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                    >
                        In Transit
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
                        Delivered ({metrics.completed})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('CANCELLED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            activeTab === 'CANCELLED'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                    >
                        Cancelled
                    </button>
                </div>

                <div className="relative min-w-[240px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Order #, Customer, or Phone..."
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

            {/* Orders Table Manifest */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
                    <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <ShoppingBag size={26} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">No Store Orders Found</h2>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {searchQuery ? `No orders matched your search "${searchQuery}".` : "When shoppers order products from your store, their orders will appear here with full details."}
                    </p>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setActiveTab('ALL') }}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-600">
                            <thead className="bg-slate-50/90 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                                <tr>
                                    <th className="px-4 py-3.5">Order & Date</th>
                                    <th className="px-4 py-3.5">Customer & Shipping</th>
                                    <th className="px-4 py-3.5">Ordered Items</th>
                                    <th className="px-4 py-3.5 text-right">Total Amount</th>
                                    <th className="px-4 py-3.5 text-center">Payment</th>
                                    <th className="px-4 py-3.5">Fulfillment Status</th>
                                    <th className="px-4 py-3.5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => {
                                    const displayOrderNumber = order.orderNumber 
                                        ? order.orderNumber 
                                        : (order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : 'Order')

                                    const address = parseAddress(order.shippingAddress)
                                    const items = order.items || order.orderItems || []
                                    const rawStatus = (order.orderStatus || order.status || 'CREATED').toUpperCase()
                                    const currentStatusOption = ORDER_STATUS_OPTIONS.find(o => o.value === rawStatus) || {
                                        value: rawStatus,
                                        label: rawStatus.replace(/_/g, ' '),
                                        color: 'bg-slate-100 text-slate-700 border-slate-200',
                                    }

                                    const formattedDate = order.createdAt 
                                        ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            hour12: true
                                        })
                                        : 'Recent'

                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer group"
                                            onClick={() => openModal(order)}
                                        >
                                            {/* 1. Order Number & Date */}
                                            <td className="px-4 py-4 align-top">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                                            {displayOrderNumber}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleCopy(displayOrderNumber, order.id)
                                                            }}
                                                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                                                            title="Copy Order ID"
                                                        >
                                                            {copiedId === order.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                        <Calendar size={11} />
                                                        <span>{formattedDate}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. Customer & Shipping Info */}
                                            <td className="px-4 py-4 align-top max-w-[220px]">
                                                {address ? (
                                                    <div className="space-y-0.5">
                                                        <p className="font-semibold text-slate-900 truncate">
                                                            {address.name || 'Shopper'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 line-clamp-1" title={address.street}>
                                                            {address.street}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {[address.city, address.state].filter(Boolean).join(', ')} {address.postal_code || address.zip || ''}
                                                        </p>
                                                        {address.phone && (
                                                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-0.5">
                                                                <Phone size={10} />
                                                                <span>{address.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">No address provided</span>
                                                )}
                                            </td>

                                            {/* 3. Items Manifest */}
                                            <td className="px-4 py-4 align-top max-w-[260px]">
                                                <div className="space-y-1.5">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                                        {items.length} {items.length === 1 ? 'Product' : 'Products'}
                                                    </span>
                                                    <div className="space-y-1">
                                                        {items.slice(0, 2).map((item, i) => {
                                                            const catalogProd = products.find(p => String(p.id) === String(item.productId))
                                                            const thumb = catalogProd?.images?.[0] || catalogProd?.imageUrl || '/favicon.ico'

                                                            return (
                                                                <div key={item.id || i} className="flex items-center gap-2">
                                                                    <div className="size-6 rounded-md bg-slate-100 border border-slate-200/80 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                                                        <Image
                                                                            src={thumb}
                                                                            alt={item.productName || 'Product'}
                                                                            width={24}
                                                                            height={24}
                                                                            className="object-contain"
                                                                            unoptimized
                                                                        />
                                                                    </div>
                                                                    <span className="text-slate-800 truncate text-[11px] flex-1 font-medium" title={item.productName}>
                                                                        {item.productName}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                                                        ×{item.quantity}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })}
                                                        {items.length > 2 && (
                                                            <span className="text-[10px] text-emerald-600 font-bold block">
                                                                +{items.length - 2} more items
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 4. Total Amount */}
                                            <td className="px-4 py-4 align-top text-right">
                                                <div className="space-y-0.5">
                                                    <span className="font-extrabold text-slate-900 text-sm block">
                                                        {formatPrice(order.totalAmount ?? order.total ?? 0)}
                                                    </span>
                                                    {order.discountAmount > 0 && (
                                                        <span className="text-[10px] text-emerald-600 font-semibold block">
                                                            Discount: -{formatPrice(order.discountAmount)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 5. Payment Status */}
                                            <td className="px-4 py-4 align-top text-center">
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                    (order.paymentStatus || '').toUpperCase() === 'PAID' || (order.paymentStatus || '').toUpperCase() === 'COMPLETED'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : (order.paymentStatus || '').toUpperCase() === 'PENDING'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                    <span className="size-1.5 rounded-full bg-current" />
                                                    {order.paymentStatus || 'Pending'}
                                                </span>
                                            </td>

                                            {/* 6. Fulfillment Status Dropdown */}
                                            <td className="px-4 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-1.5">
                                                    <select
                                                        value={rawStatus}
                                                        disabled={updatingId === order.id}
                                                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${currentStatusOption.color} ${
                                                            updatingId === order.id ? 'opacity-50' : ''
                                                        }`}
                                                    >
                                                        {ORDER_STATUS_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value} className="text-slate-800 bg-white">
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>

                                            {/* 7. Action Button */}
                                            <td className="px-4 py-4 align-top text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => openModal(order)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                                    title="Inspect order details"
                                                >
                                                    <Eye size={12} className="text-slate-500" />
                                                    <span>Details</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Merchant Detailed Order Inspection Modal */}
            {isModalOpen && selectedOrder && (
                <div 
                    onClick={closeModal} 
                    className="fixed inset-0 flex items-center justify-center bg-slate-900/60 text-slate-700 text-sm backdrop-blur-xs z-50 p-4 animate-[fade-in_0.15s_ease-out]"
                >
                    <div 
                        onClick={e => e.stopPropagation()} 
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-slate-100"
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                        {selectedOrder.orderNumber || `#${selectedOrder.id?.slice(0, 8).toUpperCase()}`}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(selectedOrder.orderNumber || selectedOrder.id, 'modal')}
                                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                        title="Copy Order ID"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                    title="Print Packing Slip"
                                >
                                    <Printer size={13} />
                                    <span>Print</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Customer & Shipping Details */}
                        {(() => {
                            const address = parseAddress(selectedOrder.shippingAddress)
                            const fullAddrStr = address 
                                ? `${address.name ? address.name + ', ' : ''}${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postal_code || address.zip || ''}, Phone: ${address.phone || 'N/A'}`
                                : ''

                            return (
                                <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <MapPin size={14} className="text-emerald-600" />
                                            Customer Delivery Address
                                        </span>
                                        {fullAddrStr && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard?.writeText(fullAddrStr)
                                                    setCopiedAddress(true)
                                                    toast.success('Full address copied for shipping courier!')
                                                    setTimeout(() => setCopiedAddress(false), 2000)
                                                }}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                                            >
                                                {copiedAddress ? <Check size={12} /> : <Copy size={12} />}
                                                <span>{copiedAddress ? 'Address Copied' : 'Copy Address for Courier'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {address ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-slate-400 font-medium block text-[10px]">Recipient Name</span>
                                                <p className="font-bold text-slate-900 text-sm">{address.name || 'Customer'}</p>
                                                {address.phone && (
                                                    <p className="text-emerald-700 font-semibold mt-0.5">Phone: {address.phone}</p>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-medium block text-[10px]">Destination</span>
                                                <p className="text-slate-700 leading-snug">{address.street}</p>
                                                <p className="text-slate-600 font-medium">
                                                    {[address.city, address.state].filter(Boolean).join(', ')} {address.postal_code || address.zip || ''}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No delivery address recorded.</p>
                                    )}
                                </div>
                            )
                        })()}

                        {/* Ordered Products Table */}
                        {(() => {
                            const modalItems = selectedOrder.items || selectedOrder.orderItems || []
                            const computedSubtotal = modalItems.reduce((acc, it) => acc + ((it.unitPrice ?? it.price ?? 0) * (it.quantity || 1)), 0)
                            const orderSubtotal = (typeof selectedOrder.subtotal === 'number' && selectedOrder.subtotal > 0) ? selectedOrder.subtotal : computedSubtotal
                            const shippingFee = typeof selectedOrder.shippingFee === 'number' ? selectedOrder.shippingFee : (parseFloat(selectedOrder.shippingFee) || 0)
                            const platformFee = typeof selectedOrder.platformFee === 'number' ? selectedOrder.platformFee : (selectedOrder.platformFee !== undefined && selectedOrder.platformFee !== null ? (parseFloat(selectedOrder.platformFee) || 0) : 7.00)
                            const discountAmount = typeof selectedOrder.discountAmount === 'number' ? selectedOrder.discountAmount : (parseFloat(selectedOrder.discountAmount) || 0)
                            const totalAmount = typeof selectedOrder.totalAmount === 'number' ? selectedOrder.totalAmount : (parseFloat(selectedOrder.totalAmount) || selectedOrder.total || (orderSubtotal + shippingFee + platformFee - discountAmount))
                            const taxAmount = (typeof selectedOrder.taxAmount === 'number' && selectedOrder.taxAmount > 0)
                                ? selectedOrder.taxAmount
                                : Math.max(0, Math.round((totalAmount - orderSubtotal - shippingFee - platformFee + discountAmount) * 100) / 100)

                            return (
                                <div className="mb-5 space-y-2">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Package size={14} className="text-emerald-600" />
                                        Items to Dispatch ({modalItems.length})
                                    </h3>
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-3">Product</th>
                                                    <th className="p-3 text-center">Quantity</th>
                                                    <th className="p-3 text-right">Unit Price</th>
                                                    <th className="p-3 text-right">Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {modalItems.map((item, idx) => {
                                                    const catalogProd = products.find(p => String(p.id) === String(item.productId))
                                                    const thumb = catalogProd?.images?.[0] || catalogProd?.imageUrl || '/favicon.ico'
                                                    const unitPrice = item.unitPrice ?? item.price ?? 0
                                                    const qty = item.quantity || 1
                                                    const lineTotal = unitPrice * qty

                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="p-3 flex items-center gap-3">
                                                                <div className="size-10 rounded-lg bg-slate-50 border border-slate-200/80 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                                                    <Image
                                                                        src={thumb}
                                                                        alt={item.productName || 'Product'}
                                                                        width={40}
                                                                        height={40}
                                                                        className="object-contain"
                                                                        unoptimized
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                                                                    <p className="text-[10px] text-slate-400">ID: {item.productId || 'N/A'}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center font-bold text-slate-800 text-sm">
                                                                {qty}
                                                            </td>
                                                            <td className="p-3 text-right text-slate-600 font-medium">
                                                                {formatPrice(unitPrice)}
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-slate-900">
                                                                {formatPrice(lineTotal)}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                            <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-700">
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-1.5 text-right text-slate-500">Subtotal:</td>
                                                    <td className="px-3 py-1.5 text-right font-medium">{formatPrice(orderSubtotal)}</td>
                                                </tr>
                                                {taxAmount > 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-3 py-1.5 text-right text-slate-500">Taxes & Fees (GST/VAT):</td>
                                                        <td className="px-3 py-1.5 text-right font-medium">{formatPrice(taxAmount)}</td>
                                                    </tr>
                                                )}
                                                {platformFee > 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-3 py-1.5 text-right text-slate-500">Platform Fee:</td>
                                                        <td className="px-3 py-1.5 text-right font-medium">{formatPrice(platformFee)}</td>
                                                    </tr>
                                                )}
                                                {shippingFee > 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-3 py-1.5 text-right text-slate-500">Shipping Fee:</td>
                                                        <td className="px-3 py-1.5 text-right font-medium">{formatPrice(shippingFee)}</td>
                                                    </tr>
                                                )}
                                                {discountAmount > 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-3 py-1.5 text-right text-emerald-600">Discount:</td>
                                                        <td className="px-3 py-1.5 text-right text-emerald-600">-{formatPrice(discountAmount)}</td>
                                                    </tr>
                                                )}
                                                <tr className="border-t border-slate-200 text-slate-900 text-sm font-extrabold bg-slate-100/60">
                                                    <td colSpan={3} className="px-3 py-2.5 text-right">Order Grand Total:</td>
                                                    <td className="px-3 py-2.5 text-right text-emerald-700">
                                                        {formatPrice(totalAmount)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Quick Fulfillment Status Changer */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 mb-6">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                Change Order Lifecycle Status
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                {ORDER_STATUS_OPTIONS.map(opt => {
                                    const currentSt = (selectedOrder.orderStatus || selectedOrder.status || 'CREATED').toUpperCase()
                                    const isCurrent = currentSt === opt.value

                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={isCurrent || updatingId === selectedOrder.id}
                                            onClick={() => handleUpdateStatus(selectedOrder.id, opt.value)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-50 ${
                                                isCurrent
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            {isCurrent && <Check size={12} className="inline mr-1 text-emerald-400" />}
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Footer Close */}
                        <div className="flex justify-end">
                            <button 
                                type="button"
                                onClick={closeModal} 
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                                Close Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
