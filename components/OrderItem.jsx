'use client'
import Image from "next/image";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";
import { useCurrency } from "@/lib/features/currency/useCurrency";
import { Package, Calendar, MapPin, CreditCard, Star } from "lucide-react";

const STATUS_CONFIG = {
    CREATED: {
        label: 'Created',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
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
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        border: 'border-sky-200/80',
        dot: 'bg-sky-500',
    },
    SHIPPED: {
        label: 'Shipped',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-200/80',
        dot: 'bg-indigo-500',
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
};

const OrderItem = ({ order, onRatingSubmitted }) => {
    const { formatPrice } = useCurrency();
    const [ratingModal, setRatingModal] = useState(null);

    const products = useSelector(state => state.product?.list || []);
    const { ratings } = useSelector(state => state.rating || { ratings: [] });

    // 1. Normalize items from backend (order.items or fallback order.orderItems)
    const items = (order.items || order.orderItems || []).map(item => {
        const catalogProduct = products.find(p => String(p.id) === String(item.productId));
        const thumbnail = catalogProduct?.images?.[0] || catalogProduct?.imageUrl || '/favicon.ico';
        const name = item.productName || catalogProduct?.name || (item.product?.name) || 'Product';
        const unitPrice = item.unitPrice ?? item.price ?? catalogProduct?.price ?? 0;
        const quantity = item.quantity || 1;
        const totalPrice = item.totalPrice ?? (unitPrice * quantity);

        return {
            id: item.id,
            productId: item.productId || item.product?.id,
            productName: name,
            thumbnail,
            unitPrice,
            quantity,
            totalPrice,
        };
    });

    // 2. Real Order Number or truncated id
    const displayOrderNumber = order.orderNumber 
        ? order.orderNumber 
        : (order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : 'Order');

    // 3. Lifecycle Status Normalization
    const rawStatus = (order.orderStatus || order.status || 'CONFIRMED').toUpperCase();
    const statusConfig = STATUS_CONFIG[rawStatus] || {
        label: rawStatus.replace(/_/g, ' '),
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
    };

    // 4. Address Normalization
    let address = null;
    if (order.shippingAddress) {
        if (typeof order.shippingAddress === 'object') {
            address = order.shippingAddress;
        } else {
            try {
                address = JSON.parse(order.shippingAddress);
            } catch {
                address = { street: order.shippingAddress };
            }
        }
    } else if (order.address) {
        address = order.address;
    }

    // 5. Total Price
    const totalAmount = order.totalAmount ?? order.total ?? 0;

    // 6. Created Date
    const formattedDate = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Recent';

    return (
        <>
            <tr className="bg-white rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition duration-150 align-top">
                {/* 1. Order Header & Items */}
                <td className="p-5 text-left rounded-l-2xl">
                    <div className="flex flex-col gap-4">
                        {/* Order Meta Header */}
                        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 text-xs">
                            <span className="font-bold text-slate-800 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-md">
                                {displayOrderNumber}
                            </span>
                            <div className="flex items-center gap-1 text-slate-400">
                                <Calendar size={13} />
                                <span>{formattedDate}</span>
                            </div>
                            {order.paymentStatus && (
                                <span className="ml-auto text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 max-md:hidden">
                                    Payment: <span className="text-slate-700">{order.paymentStatus}</span>
                                </span>
                            )}
                        </div>

                        {/* Order Items Rows */}
                        <div className="space-y-4">
                            {items.map((item, index) => {
                                const existingRating = ratings?.find(
                                    r => (r.orderId === order.id || r.orderItemId === item.id) && String(r.productId) === String(item.productId)
                                );

                                return (
                                    <div key={item.id || index} className="flex items-center gap-4">
                                        <div className="size-16 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-200/80 p-1 flex items-center justify-center shadow-2xs">
                                            <Image
                                                className="w-full h-full object-contain mix-blend-multiply animate-[img-fade_0.4s_ease-out]"
                                                src={item.thumbnail}
                                                alt={item.productName}
                                                width={64}
                                                height={64}
                                                unoptimized
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{item.productName}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {formatPrice(item.unitPrice)} × {item.quantity}
                                                <span className="font-semibold text-slate-700 ml-2">({formatPrice(item.totalPrice)})</span>
                                            </p>

                                            {/* Rating Flow for DELIVERED orders */}
                                            <div className="mt-1.5">
                                                {existingRating ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Rating value={existingRating.rating} />
                                                        <span className="text-[11px] text-emerald-600 font-medium">Rated</span>
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
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                                                    >
                                                        <Star size={12} className="fill-emerald-600" /> Rate Product
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </td>

                {/* 2. Total Authoritative Price */}
                <td className="p-5 text-center font-bold text-slate-900 text-base max-md:hidden align-middle">
                    {formatPrice(totalAmount)}
                </td>

                {/* 3. Shipping Address */}
                <td className="p-5 text-left text-xs text-slate-600 max-md:hidden align-middle max-w-[220px]">
                    {address ? (
                        <div className="space-y-0.5">
                            {address.name && <p className="font-semibold text-slate-800">{address.name}</p>}
                            {address.street && <p className="text-slate-600 line-clamp-2">{address.street}</p>}
                            <p className="text-slate-500">
                                {[address.city, address.state].filter(Boolean).join(', ')} {address.postal_code || address.zip || ''}
                            </p>
                            {address.phone && <p className="text-slate-400 text-[11px]">Ph: {address.phone}</p>}
                        </div>
                    ) : (
                        <span className="text-slate-400 italic">No address recorded</span>
                    )}
                </td>

                {/* 4. Lifecycle Status Badge */}
                <td className="p-5 text-center max-md:hidden align-middle rounded-r-2xl">
                    <div className="flex flex-col items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
                            {statusConfig.label}
                        </span>
                    </div>
                </td>
            </tr>

            {/* Mobile Card Summary Row */}
            <tr className="md:hidden bg-slate-50 border-b border-slate-200">
                <td colSpan={4} className="p-4 pt-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Total:</span>
                        <span className="text-sm font-bold text-slate-900">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Status:</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
                            {statusConfig.label}
                        </span>
                    </div>
                    {address && (
                        <div className="text-slate-500 pt-1 border-t border-slate-200/60">
                            <span className="font-medium text-slate-700">Ship to: </span>
                            {address.name ? `${address.name}, ` : ''}{address.street || ''}, {address.city || ''}
                        </div>
                    )}
                </td>
            </tr>

            {/* Rating Modal */}
            {ratingModal && (
                <RatingModal 
                    ratingModal={ratingModal} 
                    setRatingModal={setRatingModal} 
                    onRatingSuccess={(res) => {
                        if (onRatingSubmitted) onRatingSubmitted(res);
                    }}
                />
            )}
        </>
    );
};

export default OrderItem;
