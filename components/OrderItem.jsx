'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import Rating from './Rating'
import RatingModal from './RatingModal'
import { useCurrency } from '@/lib/features/currency/useCurrency'
import { addToCart, setCart } from '@/lib/features/cart/cartSlice'
import { graphqlRequest } from '@/lib/apiClient'
import { ADD_TO_CART_MUTATION } from '@/lib/graphql/cart'
import { CANCEL_ORDER_MUTATION } from '@/lib/graphql/order'
import { GET_DELIVERY_BY_ORDER_QUERY } from '@/lib/graphql/delivery'
import { RETURN_ORDERS_BY_ORDER_QUERY, REQUEST_RETURN_MUTATION, REQUEST_REPLACEMENT_MUTATION } from '@/lib/graphql/return'
import { useDialog } from './DialogProvider'
import toast from 'react-hot-toast'
import {
    Package,
    Calendar,
    MapPin,
    CreditCard,
    Star,
    CheckCircle2,
    ShoppingBag,
    Truck,
    Copy,
    Check,
    FileText,
    ArrowRight,
    X,
    Printer,
    AlertCircle,
    RotateCcw
} from 'lucide-react'

// Lifecycle progression steps configuration
const LIFECYCLE_STEPS = [
    { key: 'CREATED', label: 'Placed', icon: ShoppingBag, description: 'Order placed & awaiting confirmation' },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, description: 'Order confirmed by merchant' },
    { key: 'PROCESSING', label: 'Processing', icon: Package, description: 'Items being packed & prepared' },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck, description: 'Out for delivery to your address' },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, description: 'Package successfully delivered' },
]

const STATUS_CONFIG = {
    CREATED: {
        label: 'Order Placed',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200/80',
        dot: 'bg-blue-500',
    },
    CONFIRMED: {
        label: 'Confirmed',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200/80',
        dot: 'bg-amber-500',
    },
    PROCESSING: {
        label: 'Processing',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-200/80',
        dot: 'bg-indigo-500',
    },
    SHIPPED: {
        label: 'Shipped',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200/80',
        dot: 'bg-purple-500',
    },
    DELIVERED: {
        label: 'Delivered',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200/80',
        dot: 'bg-emerald-500',
    },
    CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200/80',
        dot: 'bg-rose-500',
    },
}

const OrderItem = ({ order, onRatingSubmitted }) => {
    const { formatPrice } = useCurrency()
    const { prompt: promptDialog } = useDialog()
    const dispatch = useDispatch()
    const { isAuthenticated, user } = useSelector(state => state.auth)
    const products = useSelector(state => state.product?.list || [])
    const { ratings } = useSelector(state => state.rating || { ratings: [] })

    const [ratingModal, setRatingModal] = useState(null)
    const [showInvoice, setShowInvoice] = useState(false)
    const [copied, setCopied] = useState(false)
    const [addingItemId, setAddingItemId] = useState(null)
    const [deliveryInfo, setDeliveryInfo] = useState(null)
    const [loadingTracking, setLoadingTracking] = useState(false)
    const [showTracking, setShowTracking] = useState(false)
    const [orderReturns, setOrderReturns] = useState([])
    const [returnModal, setReturnModal] = useState(null) // { mode: 'RETURN' | 'REPLACEMENT', item }
    const [returnReason, setReturnReason] = useState('')
    const [submittingReturn, setSubmittingReturn] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [localStatus, setLocalStatus] = useState(null)

    const handleToggleTracking = async () => {
        if (showTracking) {
            setShowTracking(false)
            return
        }
        setShowTracking(true)
        if (deliveryInfo !== null) return
        setLoadingTracking(true)
        try {
            const [delRes, retRes] = await Promise.allSettled([
                graphqlRequest(GET_DELIVERY_BY_ORDER_QUERY, { orderId: String(order.id) }),
                graphqlRequest(RETURN_ORDERS_BY_ORDER_QUERY, { orderId: String(order.id) }),
            ])
            if (delRes.status === 'fulfilled' && delRes.value?.deliveryByOrder) {
                setDeliveryInfo(delRes.value.deliveryByOrder)
            }
            if (retRes.status === 'fulfilled' && Array.isArray(retRes.value?.returnOrdersByOrder)) {
                setOrderReturns(retRes.value.returnOrdersByOrder)
            }
        } catch {
            // silent fallback
        } finally {
            setLoadingTracking(false)
        }
    }

    const handleCancelOrder = async () => {
        const reason = await promptDialog({
            title: 'Cancel Order',
            description: 'Tell us why you want to cancel this order.',
            label: 'Cancellation reason',
            placeholder: 'e.g. Ordered by mistake, Delivery taking too long...',
            suggestions: ['Ordered by mistake', 'Found a better price', 'Delivery taking too long', 'Change of address'],
            confirmText: 'Cancel Order',
            variant: 'danger',
        })
        if (!reason) return
        setCancelling(true)
        const toastId = toast.loading('Cancelling order...')
        try {
            const res = await graphqlRequest(CANCEL_ORDER_MUTATION, { id: String(order.id), reason })
            if (res?.cancelOrder) {
                setLocalStatus('CANCELLED')
                toast.success('Order cancelled successfully', { id: toastId })
            }
        } catch (err) {
            toast.error(err.message || 'Could not cancel order', { id: toastId })
        } finally {
            setCancelling(false)
        }
    }

    const handleSubmitReturn = async (e) => {
        e.preventDefault()
        if (!returnModal || !returnReason.trim()) {
            toast.error('Please enter a reason')
            return
        }
        setSubmittingReturn(true)
        const isReplacement = returnModal.mode === 'REPLACEMENT'
        const toastId = toast.loading(isReplacement ? 'Submitting replacement request...' : 'Submitting return request...')
        try {
            const input = {
                orderId: String(order.id),
                orderItemId: returnModal.item?.id ? String(returnModal.item.id) : undefined,
                reason: returnReason.trim(),
                ...(isReplacement ? {} : { type: 'RETURN' }),
            }
            const res = await graphqlRequest(
                isReplacement ? REQUEST_REPLACEMENT_MUTATION : REQUEST_RETURN_MUTATION,
                { input }
            )
            const created = isReplacement ? res?.requestReplacement : res?.requestReturn
            if (created) {
                setOrderReturns(prev => [created, ...prev])
                setShowTracking(true)
                toast.success(isReplacement ? 'Replacement requested!' : 'Return requested!', { id: toastId })
                setReturnModal(null)
                setReturnReason('')
            }
        } catch (err) {
            toast.error(err.message || 'Request failed', { id: toastId })
        } finally {
            setSubmittingReturn(false)
        }
    }

    // Normalize order items
    const items = (order.items || order.orderItems || []).map(item => {
        const catalogProduct = products.find(p => String(p.id) === String(item.productId))
        const thumbnail = catalogProduct?.images?.[0] || catalogProduct?.imageUrl || item.thumbnail || '/favicon.ico'
        const name = item.productName || catalogProduct?.name || item.product?.name || 'Product'
        const unitPrice = item.unitPrice ?? item.price ?? catalogProduct?.price ?? 0
        const quantity = item.quantity || 1
        const lineTotal = unitPrice * quantity
        const totalPrice = item.totalPrice ?? lineTotal

        return {
            id: item.id,
            productId: item.productId || item.product?.id,
            productName: name,
            thumbnail,
            unitPrice,
            quantity,
            lineTotal,
            totalPrice,
        }
    })

    const displayOrderNumber = order.orderNumber 
        ? order.orderNumber 
        : (order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : 'Order')

    const rawStatus = (localStatus || order.orderStatus || order.status || 'CONFIRMED').toUpperCase()
    const statusConfig = STATUS_CONFIG[rawStatus] || {
        label: rawStatus.replace(/_/g, ' '),
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
    }

    // Address normalization
    let address = null
    if (order.shippingAddress) {
        if (typeof order.shippingAddress === 'object') {
            address = order.shippingAddress
        } else {
            try {
                address = JSON.parse(order.shippingAddress)
            } catch {
                address = { street: order.shippingAddress }
            }
        }
    } else if (order.address) {
        address = order.address
    }

    const totalAmount = order.totalAmount ?? order.total ?? 0

    const formattedDate = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Recent'

    // Compute stepper progress index
    const currentStepIndex = LIFECYCLE_STEPS.findIndex(step => step.key === rawStatus)
    const isCancelled = rawStatus === 'CANCELLED'

    const handleCopyOrderNumber = () => {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(displayOrderNumber)
            setCopied(true)
            toast.success('Order number copied!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleBuyAgain = async (item) => {
        if (!item.productId) return
        setAddingItemId(item.id)
        dispatch(addToCart({ productId: item.productId, quantity: 1 }))
        toast.success(`Added ${item.productName} to your cart!`)

        if (isAuthenticated) {
            try {
                const res = await graphqlRequest(ADD_TO_CART_MUTATION, {
                    input: {
                        productId: String(item.productId),
                        quantity: 1,
                    },
                })
                if (res?.addToCart) {
                    dispatch(setCart(res.addToCart))
                }
            } catch (err) {
                console.warn('Backend addToCart notice:', err)
            }
        }
        setAddingItemId(null)
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* 1. Modern Card Header */}
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm tracking-tight">
                            {displayOrderNumber}
                        </span>
                        <button
                            type="button"
                            onClick={handleCopyOrderNumber}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                            title="Copy Order Number"
                        >
                            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar size={13} className="text-slate-400" />
                        <span>Placed on {formattedDate}</span>
                    </div>

                    {order.paymentStatus && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            order.paymentStatus.toUpperCase() === 'PAID' || order.paymentStatus.toUpperCase() === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : order.paymentStatus.toUpperCase() === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                            <span className="size-1.5 rounded-full bg-current" />
                            Payment: {order.paymentStatus}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Total Paid</span>
                        <span className="text-base font-bold text-slate-900 tracking-tight">
                            {formatPrice(totalAmount)}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleToggleTracking}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-2xs transition cursor-pointer"
                    >
                        <Truck size={13} />
                        <span className="max-sm:hidden">{showTracking ? 'Hide Tracking' : 'Track Delivery'}</span>
                    </button>

                    {(rawStatus === 'CREATED' || rawStatus === 'CONFIRMED' || rawStatus === 'PROCESSING') && (
                        <button
                            type="button"
                            disabled={cancelling}
                            onClick={handleCancelOrder}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                        >
                            <span>{cancelling ? 'Cancelling...' : 'Cancel'}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowInvoice(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer"
                    >
                        <FileText size={13} className="text-slate-500" />
                        <span className="max-sm:hidden">View Receipt</span>
                    </button>
                </div>
            </div>

            {/* 2. Visual Order Lifecycle Stepper / Progress Bar */}
            <div className="px-5 py-4 bg-white border-b border-slate-100">
                {isCancelled ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                        <AlertCircle size={15} />
                        <span>This order was cancelled. If you were charged, your refund will be processed within 3-5 business days.</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <span className={`size-2 rounded-full ${statusConfig.dot} animate-pulse`} />
                                Status: <span className="text-slate-900 font-bold">{statusConfig.label}</span>
                            </span>
                            <span className="text-slate-400 text-[11px]">
                                {LIFECYCLE_STEPS[currentStepIndex]?.description || 'Order processing'}
                            </span>
                        </div>

                        {/* Responsive Stepper */}
                        <div className="relative pt-1 pb-1">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                            <div 
                                className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                                style={{
                                    width: currentStepIndex >= 0 
                                        ? `${(currentStepIndex / (LIFECYCLE_STEPS.length - 1)) * 100}%` 
                                        : '0%'
                                }}
                            />

                            <div className="relative z-10 flex items-center justify-between">
                                {LIFECYCLE_STEPS.map((step, idx) => {
                                    const isCompleted = idx < currentStepIndex
                                    const isCurrent = idx === currentStepIndex
                                    const StepIcon = step.icon

                                    return (
                                        <div key={step.key} className="flex flex-col items-center">
                                            <div className={`size-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                isCompleted
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : isCurrent
                                                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                                                        : 'bg-white border-2 border-slate-200 text-slate-400'
                                            }`}>
                                                {isCompleted ? (
                                                    <Check size={12} strokeWidth={3} />
                                                ) : (
                                                    <StepIcon size={12} strokeWidth={2.5} />
                                                )}
                                            </div>
                                            <span className={`text-[10px] mt-1.5 font-bold transition-colors ${
                                                isCurrent 
                                                    ? 'text-emerald-700 font-extrabold' 
                                                    : isCompleted 
                                                        ? 'text-slate-700' 
                                                        : 'text-slate-400 max-sm:hidden'
                                            }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Product Items List */}
            <div className="p-5 divide-y divide-slate-100">
                {items.map((item, index) => {
                    const existingRating = ratings?.find(
                        r => (r.orderId === order.id || r.orderItemId === item.id) && String(r.productId) === String(item.productId)
                    )

                    return (
                        <div key={item.id || index} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                <Link 
                                    href={item.productId ? `/product/${item.productId}` : '#'} 
                                    className="size-16 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 hover:border-slate-300 transition overflow-hidden group/thumb"
                                >
                                    <Image
                                        className="w-full h-full object-contain mix-blend-multiply group-hover/thumb:scale-105 transition-transform duration-200"
                                        src={item.thumbnail}
                                        alt={item.productName}
                                        width={64}
                                        height={64}
                                        unoptimized
                                    />
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <Link 
                                        href={item.productId ? `/product/${item.productId}` : '#'}
                                        className="font-semibold text-slate-800 text-sm hover:text-emerald-600 transition-colors line-clamp-1 block"
                                        title={item.productName}
                                    >
                                        {item.productName}
                                    </Link>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                        <span>Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                                        <span>•</span>
                                        <span>Unit: {formatPrice(item.unitPrice)}</span>
                                        <span>•</span>
                                        <span className="font-bold text-slate-900">{formatPrice(item.lineTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Item Actions */}
                            <div className="flex items-center gap-2.5 sm:self-center shrink-0 flex-wrap">
                                {existingRating ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                                        <Rating value={existingRating.rating} />
                                        <span className="text-[11px] text-emerald-700 font-bold">Rated</span>
                                    </div>
                                ) : rawStatus === 'DELIVERED' ? (
                                    <button
                                        type="button"
                                        onClick={() => setRatingModal({
                                            orderId: order.id,
                                            orderItemId: item.id,
                                            productId: item.productId,
                                            productName: item.productName,
                                        })}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                                    >
                                        <Star size={12} className="fill-emerald-600 text-emerald-600" />
                                        <span>Rate Product</span>
                                    </button>
                                ) : null}

                                {rawStatus === 'DELIVERED' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setReturnModal({ mode: 'RETURN', item })}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                                        >
                                            <span>Return</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReturnModal({ mode: 'REPLACEMENT', item })}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                                        >
                                            <span>Replace</span>
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleBuyAgain(item)}
                                    disabled={addingItemId === item.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                >
                                    <RotateCcw size={12} className="text-slate-500" />
                                    <span>Buy Again</span>
                                </button>

                                {item.productId && (
                                    <Link
                                        href={`/product/${item.productId}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                                        title="View product details"
                                    >
                                        <span>View</span>
                                        <ArrowRight size={12} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* 4. Footer Summary & Shipping Info Grid */}
            <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Shipping Details */}
                <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0 mt-0.5">
                        <MapPin size={13} className="text-emerald-600" />
                    </div>
                    <div>
                        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                            Delivery Address
                        </span>
                        {address ? (
                            <div className="text-slate-600 mt-0.5 leading-relaxed">
                                {address.name && <span className="font-semibold text-slate-800">{address.name} — </span>}
                                <span>{[address.street, address.city, address.state, address.postal_code || address.zip].filter(Boolean).join(', ')}</span>
                                {address.phone && <span className="block text-slate-400 text-[11px] mt-0.5">Contact: {address.phone}</span>}
                            </div>
                        ) : (
                            <span className="text-slate-400 italic">No delivery address recorded</span>
                        )}
                    </div>
                </div>

                {/* Payment & Security */}
                <div className="flex items-start gap-2.5 md:border-l md:border-slate-200/80 md:pl-4">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0 mt-0.5">
                        <CreditCard size={13} className="text-emerald-600" />
                    </div>
                    <div>
                        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                            Payment & Order Info
                        </span>
                        <div className="text-slate-600 mt-0.5 leading-relaxed space-y-0.5">
                            <p>Status: <strong className="text-slate-800">{order.paymentStatus || 'Processed'}</strong> • {items.length} {items.length === 1 ? 'item' : 'items'}</p>
                            <p className="text-[11px] text-slate-500">Need help? Contact support with order #{displayOrderNumber}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Delivery Tracking & Return Status Drawer */}
            {showTracking && (
                <div className="px-5 py-3.5 bg-emerald-50/40 border-t border-emerald-100 space-y-2.5 text-xs">
                    {loadingTracking ? (
                        <p className="text-slate-500">Loading delivery & return details...</p>
                    ) : deliveryInfo ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-emerald-200/70">
                            <div>
                                <span className="text-[10px] text-slate-400 block">Delivery Partner</span>
                                <span className="font-bold text-slate-800">{deliveryInfo.deliveryPartner || 'Assigned Carrier'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block">Tracking #</span>
                                <span className="font-mono font-bold text-slate-800">{deliveryInfo.trackingNumber || 'Pending'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block">Shipment Status</span>
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {deliveryInfo.status}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block">
                                    {deliveryInfo.deliveredAt ? 'Delivered On' : 'Est. Delivery'}
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {deliveryInfo.deliveredAt
                                        ? new Date(deliveryInfo.deliveredAt).toLocaleDateString()
                                        : deliveryInfo.estimatedDeliveryAt
                                            ? new Date(deliveryInfo.estimatedDeliveryAt).toLocaleDateString()
                                            : 'In Progress'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">Shipment dispatch details are not yet generated for this order.</p>
                    )}

                    {orderReturns.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Return / Replacement Requests</span>
                            {orderReturns.map((ret) => (
                                <div key={ret.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                                    <div>
                                        <span className="font-bold text-slate-800">{ret.type}</span>
                                        <span className="text-slate-500 ml-2">"{ret.reason}"</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                        {ret.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 5. Rating Modal */}
            {ratingModal && (
                <RatingModal 
                    ratingModal={ratingModal} 
                    setRatingModal={setRatingModal} 
                    onRatingSuccess={(res) => {
                        if (onRatingSubmitted) onRatingSubmitted(res)
                    }}
                />
            )}

            {/* Return / Replacement Modal */}
            {returnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800">
                                {returnModal.mode === 'REPLACEMENT' ? 'Request Replacement' : 'Request Return'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setReturnModal(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitReturn} className="space-y-3 text-xs">
                            <p className="text-slate-600">
                                Item: <strong className="text-slate-800">{returnModal.item?.productName}</strong>
                            </p>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="Describe the issue (e.g., damaged item, wrong size, defective)..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReturnModal(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReturn}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                                >
                                    {submittingReturn ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 6. Printable Invoice Modal */}
            {showInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-[fade-in_0.2s_ease-out]">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between pb-5 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="text-emerald-600">gocart.</span> Receipt
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Order ID: {displayOrderNumber}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                                    title="Print Invoice"
                                >
                                    <Printer size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInvoice(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="py-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Order Date</span>
                                    <span className="font-semibold text-slate-800">{formattedDate}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Payment Status</span>
                                    <span className="font-semibold text-slate-800">{order.paymentStatus || 'Verified'}</span>
                                </div>
                                {address && (
                                    <div className="col-span-2">
                                        <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Shipped To</span>
                                        <p className="text-slate-700 mt-0.5">
                                            {address.name && <strong>{address.name}, </strong>}
                                            {[address.street, address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Itemized Table */}
                            {(() => {
                                const computedSubtotal = items.reduce((acc, it) => acc + it.lineTotal, 0)
                                const orderSubtotal = (typeof order.subtotal === 'number' && order.subtotal > 0) ? order.subtotal : computedSubtotal
                                const shippingFee = typeof order.shippingFee === 'number' ? order.shippingFee : (parseFloat(order.shippingFee) || 0)
                                const platformFee = typeof order.platformFee === 'number' ? order.platformFee : (order.platformFee !== undefined && order.platformFee !== null ? (parseFloat(order.platformFee) || 0) : 7.00)
                                const discountAmount = typeof order.discountAmount === 'number' ? order.discountAmount : (parseFloat(order.discountAmount) || 0)
                                const finalOrderTotal = typeof order.totalAmount === 'number' ? order.totalAmount : (parseFloat(order.totalAmount) || order.total || (orderSubtotal + shippingFee + platformFee - discountAmount))
                                const taxAmount = (typeof order.taxAmount === 'number' && order.taxAmount > 0)
                                    ? order.taxAmount
                                    : Math.max(0, Math.round((finalOrderTotal - orderSubtotal - shippingFee - platformFee + discountAmount) * 100) / 100)

                                return (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                                <tr>
                                                    <th className="p-3">Product</th>
                                                    <th className="p-3 text-center">Qty</th>
                                                    <th className="p-3 text-right">Price</th>
                                                    <th className="p-3 text-right">Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-3 font-medium text-slate-800">{item.productName}</td>
                                                        <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                                                        <td className="p-3 text-right text-slate-600">{formatPrice(item.unitPrice)}</td>
                                                        <td className="p-3 text-right font-bold text-slate-900">{formatPrice(item.lineTotal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
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
                                                <tr className="border-t border-slate-200 font-bold text-slate-900 bg-slate-100/60">
                                                    <td colSpan={3} className="px-3 py-2.5 text-right">Order Grand Total:</td>
                                                    <td className="px-3 py-2.5 text-right text-emerald-600 text-sm">{formatPrice(finalOrderTotal)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )
                            })()}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <span>Thank you for shopping with GoCart!</span>
                            <button
                                type="button"
                                onClick={() => setShowInvoice(false)}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OrderItem
