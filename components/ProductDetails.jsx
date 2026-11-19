'use client'

import { addToCart, setCart } from "@/lib/features/cart/cartSlice"
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Counter from "./Counter"
import { useDispatch, useSelector } from "react-redux"
import toast from "react-hot-toast"
import { assets } from "@/assets/assets"
import { useCurrency } from "@/lib/features/currency/useCurrency"
import { graphqlRequest } from "@/lib/apiClient"
import { ADD_TO_CART_MUTATION } from "@/lib/graphql/cart"

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
    const mainImgRef = useRef(null)

    // Check if image is already cached/complete, or auto-resolve with safety timeout
    useEffect(() => {
        if (mainImgRef.current && mainImgRef.current.complete && mainImgRef.current.naturalWidth > 0) {
            setMainLoaded(true)
            return
        }

        // Safety fallback: prevents infinite shimmer if browser loaded without dispatching onLoad
        const timer = setTimeout(() => {
            setMainLoaded(true)
        }, 800)

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

    const averageRating = typeof product?.avgRating === 'number' && product.avgRating > 0
        ? product.avgRating
        : (Array.isArray(product?.rating) && product.rating.length > 0
            ? (product.rating.reduce((acc, item) => acc + (item.rating || 0), 0) / product.rating.length)
            : 5)

    const reviewCount = Array.isArray(product?.rating) && product.rating.length > 0
        ? product.rating.length
        : (product?.avgRating ? 8 : 0)

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

                    {/* Shimmer shown while main image loads */}
                    {!mainLoaded && (
                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-20">
                            <div className="w-full h-full bg-slate-200/80 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                            </div>
                        </div>
                    )}
                    <Image
                        ref={(node) => {
                            mainImgRef.current = node
                            if (node && node.complete && node.naturalWidth > 0) {
                                setMainLoaded(true)
                            }
                        }}
                        src={mainImage || assets.product_img1}
                        alt={product.name || "Product"}
                        width={420}
                        height={420}
                        unoptimized
                        onLoad={() => setMainLoaded(true)}
                        onError={() => setMainLoaded(true)}
                        className={`relative z-10 object-contain max-h-[360px] sm:max-h-[400px] w-auto mix-blend-multiply drop-shadow-xl hover:scale-105 transition-all duration-500 ease-out ${mainLoaded ? 'opacity-100 animate-[img-fade_0.4s_ease-out]' : 'opacity-0'}`}
                    />
                </div>
            </div>

            {/* Info and Actions */}
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon
                            key={index}
                            size={14}
                            className='text-transparent mt-0.5'
                            fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"}
                        />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{reviewCount} Reviews</p>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline my-6 gap-3">
                    <span className="text-3xl font-bold text-slate-800">{formatPrice(activePrice)}</span>
                    {activeMrp > activePrice && (
                        <span className="text-xl text-slate-400 line-through">{formatPrice(activeMrp)}</span>
                    )}
                </div>

                {discount > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <TagIcon size={13} />
                        <span>Save {discount}% right now</span>
                    </div>
                )}

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
                        onClick={() => !cart[productId] ? addToCartHandler() : router.push('/cart')}
                        className="bg-slate-900 text-white px-10 py-3 text-sm font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-sm"
                    >
                        {!cart[productId] ? 'Add to Cart' : 'View Cart'}
                    </button>
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
        </div>
    )
}

export default ProductDetails
