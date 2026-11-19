'use client'

import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'
import { assets } from '@/assets/assets'
import { useCurrency } from '@/lib/features/currency/useCurrency'

const ProductCard = ({ product }) => {
    const { formatPrice } = useCurrency()
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef(null)

    // Calculate rating safely
    const rating = typeof product?.avgRating === 'number' && product.avgRating > 0
        ? Math.round(product.avgRating)
        : Array.isArray(product?.rating) && product.rating.length > 0
        ? Math.round(product.rating.reduce((acc, curr) => acc + (curr.rating || 0), 0) / product.rating.length)
        : 5

    // Resolve product image safely
    const imageSrc = (Array.isArray(product?.images) && product.images[0]) || product?.imageUrl || assets.product_img1

    useEffect(() => {
        if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
            setLoaded(true)
            return
        }

        // Safety fallback: prevents infinite shimmer if browser loaded without dispatching onLoad
        const timer = setTimeout(() => {
            setLoaded(true)
        }, 800)

        return () => clearTimeout(timer)
    }, [imageSrc])

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto block transition-transform duration-300 hover:-translate-y-1'>
            <div className='relative bg-gradient-to-b from-slate-50/70 via-white to-slate-50/90 h-44 sm:w-60 sm:h-64 rounded-2xl flex items-center justify-center p-4 border border-slate-200/80 group-hover:border-slate-300 shadow-2xs group-hover:shadow-lg transition-all duration-300 overflow-hidden'>
                {/* Ambient radial glow */}
                <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,rgba(241,245,249,0.4)_100%)] pointer-events-none' />

                {/* Shimmer placeholder */}
                {!loaded && (
                    <div className='absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-20'>
                        <div className='w-full h-full bg-slate-200/80 relative overflow-hidden'>
                            <div className='absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent' />
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
                    width={500}
                    height={500}
                    unoptimized
                    onLoad={() => setLoaded(true)}
                    onError={() => setLoaded(true)}
                    className={`relative z-10 w-full h-full max-h-36 sm:max-h-52 object-contain mix-blend-multiply drop-shadow-md group-hover:scale-108 group-hover:drop-shadow-xl transition-all duration-300 ${loaded ? 'opacity-100 animate-[img-fade_0.4s_ease-out]' : 'opacity-0'}`}
                    src={imageSrc}
                    alt={product.name || "Product"}
                />
            </div>
            <div className='flex justify-between gap-3 text-sm text-slate-800 pt-2.5 max-w-60'>
                <div className='min-w-0 flex-1'>
                    <p className='truncate font-semibold text-slate-800 group-hover:text-green-700 transition-colors' title={product.name}>{product.name}</p>
                    <div className='flex items-center gap-0.5 mt-0.5'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={13} className='text-transparent' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                </div>
                <p className='font-bold text-slate-900 shrink-0'>{formatPrice(product.price)}</p>
            </div>
        </Link>
    )
}

export default ProductCard
