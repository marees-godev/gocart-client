'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import {
    StarIcon,
    ShoppingCart,
    ArrowRight,
    SlidersHorizontal,
    Plus,
    Minus
} from 'lucide-react'
import { assets } from '@/assets/assets'
import { useCurrency } from '@/lib/features/currency/useCurrency'
import { addToCart, removeFromCart, setCart } from '@/lib/features/cart/cartSlice'
import { graphqlRequest } from '@/lib/apiClient'
import { ADD_TO_CART_MUTATION, REMOVE_FROM_CART_MUTATION } from '@/lib/graphql/cart'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
    const router = useRouter()
    const { formatPrice } = useCurrency()
    const dispatch = useDispatch()
    const { isAuthenticated, user } = useSelector((state) => state.auth)
    const cartQty = useSelector((state) => state.cart.cartItems[product.id] || 0)
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef(null)

    // Authentic rating calculation from actual user reviews / product data
    const rating = typeof product?.avgRating === 'number' && product.avgRating > 0
        ? product.avgRating
        : (Array.isArray(product?.rating) && product.rating.length > 0
            ? (product.rating.reduce((acc, curr) => acc + (curr.rating || 0), 0) / product.rating.length)
            : 0)

    // Authentic price & discount calculation
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0
    const mrp = typeof product.mrp === 'number' ? product.mrp : parseFloat(product.mrp) || 0
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

    // Calculate total stock from variants or product stock (verifiable directly from API data)
    const totalStock = useMemo(() => {
        if (Array.isArray(product?.variants) && product.variants.length > 0) {
            return product.variants.reduce((acc, v) => acc + (typeof v.stock === 'number' ? v.stock : (parseInt(v.stock, 10) || 0)), 0)
        }
        if (typeof product?.stock === 'number') {
            return product.stock
        }
        return null
    }, [product?.variants, product?.stock])

    // Authentic shopper signal derived strictly from verified API data (no unproven marketing claims)
    const proofTag = useMemo(() => {
        const isOutOfStock = product.status === 'OUT_OF_STOCK' || (totalStock !== null && totalStock <= 0)

        if (isOutOfStock) {
            return {
                text: 'Out of Stock',
                className: 'text-rose-700 bg-rose-50/90 border-rose-200/70',
                dotClassName: 'bg-rose-500',
            }
        }

        // 1. Verifiable low inventory urgency from variants stock
        if (totalStock !== null && totalStock > 0 && totalStock <= 5) {
            return {
                text: `Only ${totalStock} left in stock`,
                className: 'text-amber-800 bg-amber-50/90 border-amber-200/70',
                dotClassName: 'bg-amber-500 animate-pulse',
            }
        }

        // 2. Verifiable variant options count if multiple exist
        if (Array.isArray(product?.variants) && product.variants.length > 1) {
            return {
                text: `In Stock • ${product.variants.length} Options`,
                className: 'text-emerald-800 bg-emerald-50/90 border-emerald-200/70',
                dotClassName: 'bg-emerald-500',
            }
        }

        // 3. Verifiable in-stock signal
        return {
            text: 'In Stock',
            className: 'text-emerald-800 bg-emerald-50/90 border-emerald-200/70',
            dotClassName: 'bg-emerald-500',
        }
    }, [totalStock, product?.status, product?.variants])

    // Resolve product image safely
    const imageSrc = (Array.isArray(product?.images) && product.images[0]) || product?.imageUrl || assets.product_img1

    useEffect(() => {
        if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
            setLoaded(true)
            return
        }

        const timer = setTimeout(() => {
            setLoaded(true)
        }, 600)
        return () => clearTimeout(timer)
    }, [imageSrc])

    const handleQuickAddToCart = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart({ productId: product.id, quantity: 1 }))
        toast.success(`Added ${product.name} to cart!`)

        if (isAuthenticated) {
            try {
                const res = await graphqlRequest(ADD_TO_CART_MUTATION, {
                    input: {
                        productId: String(product.id),
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

    const handleIncrementQty = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart({ productId: product.id, quantity: 1 }))

        if (isAuthenticated) {
            try {
                const res = await graphqlRequest(ADD_TO_CART_MUTATION, {
                    input: {
                        productId: String(product.id),
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

    const handleDecrementQty = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        const currentQty = cartQty
        dispatch(removeFromCart({ productId: product.id, quantity: 1 }))

        if (isAuthenticated) {
            try {
                const res = await graphqlRequest(REMOVE_FROM_CART_MUTATION, {
                    productId: String(product.id),
                    userId: user?.id ? String(user.id) : undefined,
                })
                if (res?.removeFromCart) {
                    dispatch(setCart(res.removeFromCart))
                }
            } catch (err) {
                console.warn('Backend removeFromCart notice:', err)
            }
        }
    }

    return (
        <div className='group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden select-none w-full'>
            {/* Top Media Showcase Container */}
            <div className='relative aspect-square w-full overflow-hidden bg-slate-100'>
                <Link href={`/product/${product.id}`} className='block w-full h-full'>
                    {/* Shimmer background placeholder */}
                    {!loaded && (
                        <div className='absolute inset-0 pointer-events-none z-0'>
                            <div className='w-full h-full bg-slate-100 relative overflow-hidden'>
                                <div className='absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent' />
                            </div>
                        </div>
                    )}

                    <Image
                        ref={(node) => {
                            imgRef.current = node
                            if (node && node.complete && node.naturalWidth > 0) {
                                setLoaded(true)
                            }
                        }}
                        key={typeof imageSrc === 'string' ? imageSrc : 'card-img'}
                        width={600}
                        height={600}
                        unoptimized
                        onLoad={() => setLoaded(true)}
                        onError={() => setLoaded(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        src={imageSrc}
                        alt={product.name || "Product"}
                    />
                </Link>

                {/* Vibrant Modern Discount Badge */}
                {discount > 0 && (
                    <div className='absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-tight bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 text-white shadow-md shadow-rose-600/30 ring-1 ring-white/30 backdrop-blur-xs select-none pointer-events-none transition-transform group-hover:scale-105 duration-200'>
                        <span>{discount}% OFF</span>
                    </div>
                )}

                {/* Sleek Floating Action Bar on Hover */}
                <div
                    className="absolute inset-x-2.5 bottom-2.5 z-20 flex items-center gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    {cartQty > 0 ? (
                        <div className="flex-1 flex items-center justify-between bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md">
                            <button
                                type="button"
                                onClick={handleDecrementQty}
                                className="size-6 sm:size-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-90 transition font-bold text-xs cursor-pointer"
                                title="Decrease quantity"
                            >
                                <Minus size={11} strokeWidth={2.5} />
                            </button>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-800">
                                {cartQty} in cart
                            </span>
                            <button
                                type="button"
                                onClick={handleIncrementQty}
                                className="size-6 sm:size-7 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white active:scale-90 transition font-bold text-xs shadow-xs cursor-pointer"
                                title="Increase quantity"
                            >
                                <Plus size={11} strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleQuickAddToCart}
                            className="flex-1 py-1.5 sm:py-2 px-2.5 bg-white/95 hover:bg-white text-slate-900 border border-slate-200/90 hover:border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition backdrop-blur-md cursor-pointer"
                        >
                            <ShoppingCart size={13} className="text-emerald-600" />
                            <span>Add</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            router.push(`/product/${product.id}`)
                        }}
                        className="py-1.5 sm:py-2 px-2 bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center shadow-md active:scale-95 transition backdrop-blur-md cursor-pointer shrink-0"
                        title="View details"
                    >
                        <ArrowRight size={13} />
                    </button>
                </div>
            </div>

            {/* Product Meta & Pricing */}
            <div className='p-3 sm:p-4 flex flex-col flex-1 justify-between gap-3'>
                <div className='space-y-1.5'>
                    {/* Authentic Verification Pill / Rating */}
                    {rating > 0 ? (
                        <div className='flex items-center gap-1.5'>
                            <div className='flex items-center gap-0.5'>
                                {Array(5).fill('').map((_, index) => (
                                    <StarIcon
                                        key={index}
                                        size={11}
                                        className='text-transparent'
                                        fill={Math.round(rating) >= index + 1 ? "#00C950" : "#D1D5DB"}
                                    />
                                ))}
                            </div>
                            <span className='text-[11px] font-semibold text-slate-500'>
                                ({rating.toFixed(1)})
                            </span>
                        </div>
                    ) : proofTag ? (
                        <div className='flex items-center'>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${proofTag.className}`}>
                                <span className={`size-1.5 rounded-full ${proofTag.dotClassName}`} />
                                {proofTag.text}
                            </span>
                        </div>
                    ) : null}

                    {/* Product Name (2-line clamp for full legibility) */}
                    <Link href={`/product/${product.id}`} className='block group-hover:text-emerald-600 transition-colors'>
                        <h3 className='font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug' title={product.name}>
                            {product.name}
                        </h3>
                    </Link>
                </div>

                {/* Price Row */}
                <div className='pt-2 border-t border-slate-100 flex items-baseline justify-between gap-2 flex-wrap'>
                    <div className='flex items-baseline gap-1.5 flex-wrap'>
                        <span className='font-bold text-slate-900 text-sm sm:text-base'>
                            {formatPrice(product.price)}
                        </span>
                        {discount > 0 && (
                            <span className='text-[11px] text-slate-400 line-through'>
                                {formatPrice(mrp)}
                            </span>
                        )}
                    </div>
                    {discount > 0 && (
                        <span className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs'>
                            Save {formatPrice(mrp - price)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductCard
