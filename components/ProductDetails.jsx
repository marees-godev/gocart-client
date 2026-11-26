'use client'

import { addToCart, setCart } from "@/lib/features/cart/cartSlice"
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon, Sparkles, MapPin, Truck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Counter from "./Counter"
import ExchangeModal from "./ExchangeModal"
import { useDispatch, useSelector } from "react-redux"
import toast from "react-hot-toast"
import { assets } from "@/assets/assets"
import { useCurrency } from "@/lib/features/currency/useCurrency"
import { graphqlRequest } from "@/lib/apiClient"
import { ADD_TO_CART_MUTATION } from "@/lib/graphql/cart"
import { GET_PRODUCT_RATINGS_QUERY } from "@/lib/graphql/rating"
import { GET_STOCK_QUERY } from "@/lib/graphql/inventory"
import { GET_LOCATION_BY_PINCODE_QUERY } from "@/lib/graphql/address"

const ProductDetails = ({ product }) => {
    const productId = product.id
    const { formatPrice } = useCurrency()

    const cart = useSelector((state) => state.cart.cartItems)
    const { isAuthenticated } = useSelector((state) => state.auth)
    const dispatch = useDispatch()
    const router = useRouter()

    const images = (Array.isArray(product?.images) && product.images.length > 0)
        ? product.images
        : (product?.imageUrl ? [product.imageUrl] : [assets.product_img1])

    const [mainImage, setMainImage] = useState(images[0])
    const [mainLoaded, setMainLoaded] = useState(false)
    const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null)

    // Safety fallback: auto-clear loading state if browser already has image in cache
    useEffect(() => {
        const timer = setTimeout(() => {
            setMainLoaded(true)
        }, 400)
        return () => clearTimeout(timer)
    }, [mainImage])

    useEffect(() => {
        if (images.length > 0 && images[0] !== mainImage) {
            setMainImage(images[0])
            setMainLoaded(false)
        }
        if (product?.variants?.length > 0) {
            setSelectedVariant(product.variants[0])
        }
    }, [product])

    // Restore pending cart item if user just returned from login
    useEffect(() => {
        if (isAuthenticated && typeof window !== 'undefined') {
            const pendingItem = localStorage.getItem('pendingCartItem')
            if (pendingItem === productId) {
                dispatch(addToCart({ productId }))
                localStorage.removeItem('pendingCartItem')
                toast.success('Product added to your cart!')
            }
        }
    }, [isAuthenticated, productId, dispatch])

    const addToCartHandler = async () => {
        // Optimistically add to cart for both guests and authenticated users
        dispatch(addToCart({ productId }))
        toast.success('Added to cart')

        if (isAuthenticated) {
            try {
                const res = await graphqlRequest(ADD_TO_CART_MUTATION, {
                    input: {
                        productId: String(productId),
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
    }

    const [realRatings, setRealRatings] = useState({ total: 0, averageRating: 0 })
    const [liveStock, setLiveStock] = useState(null)
    const [stockLoading, setStockLoading] = useState(false)

    useEffect(() => {
        if (!productId) return
        graphqlRequest(GET_PRODUCT_RATINGS_QUERY, { productId: String(productId), limit: 1, offset: 0 })
            .then(data => {
                if (data?.productRatings) {
                    setRealRatings({
                        total: data.productRatings.total || 0,
                        averageRating: data.productRatings.averageRating || 0,
                    })
                }
            })
            .catch(() => {})

        // Query authoritative real-time stock from inventory-service
        setStockLoading(true)
        graphqlRequest(GET_STOCK_QUERY, { productId: String(productId) })
            .then(data => {
                if (data?.stock) {
                    setLiveStock(data.stock)
                }
            })
            .catch(() => {
                // If inventory-service has no record, fallback to product data
            })
            .finally(() => {
                setStockLoading(false)
            })
    }, [productId])

    // Determine stock availability
    const availableStock = liveStock?.availableQuantity ?? selectedVariant?.stock ?? product?.stock ?? null
    const isOutOfStock = liveStock !== null
        ? liveStock.availableQuantity <= 0
        : (product.status === 'OUT_OF_STOCK' || (availableStock !== null && availableStock <= 0))
    const isLowStock = availableStock !== null && availableStock > 0 && availableStock <= 5

    // Pincode lookup state for delivery estimation
    const [pincodeInput, setPincodeInput] = useState('')
    const [checkingPincode, setCheckingPincode] = useState(false)
    const [pincodeLocation, setPincodeLocation] = useState(null)
    const [pincodeError, setPincodeError] = useState(null)
    const [showExchangeModal, setShowExchangeModal] = useState(false)
    const [lockedQuote, setLockedQuote] = useState(null)

    const handleCheckPincode = async (e) => {
        e?.preventDefault()
        const cleanPin = pincodeInput.trim()
        if (!cleanPin || cleanPin.length < 5) {
            setPincodeError('Please enter a valid 6-digit postal PIN code')
            return
        }

        setCheckingPincode(true)
        setPincodeError(null)
        try {
            const data = await graphqlRequest(GET_LOCATION_BY_PINCODE_QUERY, {
                pincode: cleanPin,
                country: 'IN'
            })

            if (data?.locationByPincode) {
                setPincodeLocation(data.locationByPincode)
            } else {
                setPincodeError('Pincode not found or delivery unavailable')
            }
        } catch (err) {
            setPincodeError(err.message || 'Delivery check unavailable for this PIN')
        } finally {
            setCheckingPincode(false)
        }
    }

    const averageRating = realRatings.total > 0
        ? realRatings.averageRating
        : (Array.isArray(product?.rating) && product.rating.length > 0
            ? (product.rating.reduce((acc, item) => acc + (item.rating || 0), 0) / product.rating.length)
            : 0)

    const reviewCount = realRatings.total > 0
        ? realRatings.total
        : (Array.isArray(product?.rating) && product.rating.length > 0 ? product.rating.length : 0)

    const activePrice = selectedVariant?.price || product.price || 0
    const activeMrp = selectedVariant?.mrp || (product.mrp && product.mrp > activePrice ? product.mrp : activePrice)
    const discount = activeMrp > activePrice ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0

    return (
        <div className="flex max-lg:flex-col gap-12">
            {/* Gallery Images */}
            <div className="flex max-sm:flex-col-reverse gap-4">
                <div className="flex sm:flex-col gap-3 max-h-[520px] overflow-y-auto no-scrollbar py-1">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                if (mainImage !== image) {
                                    setMainImage(image)
                                    setMainLoaded(false)
                                }
                            }}
                            className={`bg-white flex items-center justify-center size-20 sm:size-22 rounded-2xl group cursor-pointer border-2 p-2 transition-all duration-200 overflow-hidden ${
                                mainImage === image 
                                    ? 'border-green-600 ring-2 ring-green-600/20 shadow-md scale-102' 
                                    : 'border-slate-200/80 hover:border-slate-400 hover:shadow-xs'
                            }`}
                        >
                            <Image
                                src={image}
                                className="group-hover:scale-110 transition-transform duration-200 object-contain max-h-16 w-auto mix-blend-multiply"
                                alt=""
                                width={70}
                                height={70}
                                unoptimized
                            />
                        </div>
                    ))}
                </div>
                <div className="relative flex justify-center items-center w-full min-h-[380px] sm:size-118 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/90 rounded-3xl p-8 border border-slate-200/80 shadow-xs overflow-hidden">
                    {/* Ambient studio backdrop */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,rgba(241,245,249,0.6)_100%)] pointer-events-none" />

                    {/* Background shimmer shown while main image loads */}
                    {!mainLoaded && (
                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
                            <div className="w-full h-full bg-slate-100/90 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                            </div>
                        </div>
                    )}
                    <Image
                        key={typeof mainImage === 'string' ? mainImage : 'main-img'}
                        src={mainImage || assets.product_img1}
                        alt={product.name || "Product"}
                        width={420}
                        height={420}
                        unoptimized
                        priority
                        onLoad={() => setMainLoaded(true)}
                        onError={() => setMainLoaded(true)}
                        className="relative z-10 object-contain max-h-[360px] sm:max-h-[400px] w-auto mix-blend-multiply drop-shadow-xl hover:scale-105 transition-transform duration-300 ease-out"
                    />
                </div>
            </div>

            {/* Info and Actions */}
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                {averageRating > 0 ? (
                    <div className='flex items-center mt-2.5 gap-2'>
                        <div className='flex items-center gap-0.5'>
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon
                                    key={index}
                                    size={14}
                                    className='text-transparent mt-0.5'
                                    fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{averageRating.toFixed(1)}</span>
                        <span className="text-slate-300">•</span>
                        <p className="text-xs text-slate-500 font-medium">{reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}</p>
                    </div>
                ) : (
                    <div className='inline-flex items-center gap-2 mt-2.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs'>
                        <Sparkles size={13} className='text-emerald-600' />
                        <span>Brand New Arrival • Be the first verified buyer to review!</span>
                    </div>
                )}

                {/* Pricing */}
                <div className="flex items-baseline my-6 gap-3">
                    <span className="text-3xl font-bold text-slate-800">{formatPrice(activePrice)}</span>
                    {activeMrp > activePrice && (
                        <span className="text-xl text-slate-400 line-through">{formatPrice(activeMrp)}</span>
                    )}
                </div>

                {discount > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                        <TagIcon size={13} className="text-rose-600" />
                        <span>Save {discount}% ({formatPrice(activeMrp - activePrice)} OFF)</span>
                    </div>
                )}

                {/* Authoritative Live Stock Badge */}
                <div className="mt-3">
                    {isOutOfStock ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="size-1.5 rounded-full bg-rose-600"></span>
                            Out of Stock
                        </div>
                    ) : isLowStock ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="size-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            Only {availableStock} left in stock - order soon!
                        </div>
                    ) : availableStock !== null ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="size-1.5 rounded-full bg-emerald-600"></span>
                            In Stock ({availableStock} available)
                        </div>
                    ) : null}
                </div>

                {/* Variants Selector (if backend provides variants) */}
                {Array.isArray(product.variants) && product.variants.length > 1 && (
                    <div className="mt-6">
                        <p className="text-sm font-medium text-slate-700 mb-2">Options / Variants:</p>
                        <div className="flex flex-wrap gap-2">
                            {product.variants.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setSelectedVariant(v)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                        selectedVariant?.id === v.id
                                            ? 'border-slate-800 bg-slate-800 text-white shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                                    }`}
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add to Cart Actions */}
                <div className="flex items-end gap-5 mt-8">
                    {cart[productId] && (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-slate-600 font-medium">Quantity</p>
                            <Counter productId={productId} />
                        </div>
                    )}
                    <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                            if (isOutOfStock) return
                            !cart[productId] ? addToCartHandler() : router.push('/cart')
                        }}
                        className={`px-10 py-3 text-sm font-semibold rounded-xl transition shadow-sm ${
                            isOutOfStock
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                        }`}
                    >
                        {isOutOfStock ? 'Out of Stock' : !cart[productId] ? 'Add to Cart' : 'View Cart'}
                    </button>
                </div>

                {/* Exchange Eligibility Banner */}
                {(product.isExchangeEligible || product.maxExchangeDiscount > 0) && (
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3">
                        <div className="text-xs">
                            <p className="font-bold text-emerald-900">
                                Trade-In &amp; Exchange Available
                                {product.maxExchangeDiscount > 0 && ` (Up to ${formatPrice(product.maxExchangeDiscount)} off)`}
                            </p>
                            <p className="text-emerald-700 mt-0.5">
                                {lockedQuote
                                    ? `Locked Quote #${lockedQuote.id.slice(0, 8)} — ${formatPrice(lockedQuote.finalDiscount)} discount`
                                    : 'Get instant valuation for your old device'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowExchangeModal(true)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                        >
                            {lockedQuote ? 'View Quote' : 'Check Exchange'}
                        </button>
                    </div>
                )}

                {/* Delivery & Pincode Serviceability Check */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Truck size={16} className="text-emerald-600" />
                        <span>Delivery Availability & Pincode Check</span>
                    </div>

                    <form onSubmit={handleCheckPincode} className="flex gap-2">
                        <div className="relative flex-1">
                            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                maxLength={6}
                                value={pincodeInput}
                                onChange={(e) => {
                                    setPincodeInput(e.target.value)
                                    if (pincodeError) setPincodeError(null)
                                }}
                                placeholder="Enter 6-digit PIN code (e.g. 400001)"
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={checkingPincode || !pincodeInput.trim()}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                            {checkingPincode ? <Loader2 size={13} className="animate-spin" /> : 'Check'}
                        </button>
                    </form>

                    {pincodeLocation && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1 animate-in fade-in">
                            <p className="font-semibold flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                Available for Express Delivery to {pincodeLocation.district}, {pincodeLocation.state}
                            </p>
                            <p className="text-[11px] text-emerald-700">
                                Estimated delivery within 2 - 3 business days • Free Shipping on orders over ₹500
                            </p>
                        </div>
                    )}

                    {pincodeError && (
                        <p className="text-xs text-rose-600 flex items-center gap-1 font-medium animate-in fade-in">
                            <AlertCircle size={13} /> {pincodeError}
                        </p>
                    )}
                </div>

                <hr className="border-gray-200 my-8" />
                <div className="flex flex-col gap-3 text-sm text-slate-500">
                    <p className="flex items-center gap-3">
                        <EarthIcon size={18} className="text-slate-400" /> Free shipping worldwide
                    </p>
                    <p className="flex items-center gap-3">
                        <CreditCardIcon size={18} className="text-slate-400" /> 100% Secured Payment
                    </p>
                    <p className="flex items-center gap-3">
                        <UserIcon size={18} className="text-slate-400" /> Verified Merchant Guarantee
                    </p>
                </div>
            </div>

            {showExchangeModal && (
                <ExchangeModal
                    product={product}
                    onClose={() => setShowExchangeModal(false)}
                    onQuoteLocked={(q) => setLockedQuote(q)}
                />
            )}
        </div>
    )
}

export default ProductDetails
