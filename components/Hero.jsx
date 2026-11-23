'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { ArrowRight, ChevronRight, Sparkles, ShieldCheck, Zap, Truck, Star } from 'lucide-react'
import { assets } from '@/assets/assets'
import CategoriesMarquee from './CategoriesMarquee'
import { useCurrency } from '@/lib/features/currency/useCurrency'

const Hero = () => {
    const { formatPrice } = useCurrency()
    const products = useSelector((state) => state.product?.list || [])

    // Real dynamic catalog pricing & discounts derived directly from verified products
    const { minPrice, maxDiscount, topRatedStartingPrice } = useMemo(() => {
        if (!Array.isArray(products) || products.length === 0) {
            return { minPrice: null, maxDiscount: null, topRatedStartingPrice: null }
        }

        const validPrices = products
            .map(p => typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0)
            .filter(p => p > 0)

        const minP = validPrices.length > 0 ? Math.min(...validPrices) : null

        const validDiscounts = products.map(p => {
            const pPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0
            const pMrp = typeof p.mrp === 'number' ? p.mrp : parseFloat(p.mrp) || 0
            return pMrp > pPrice ? Math.round(((pMrp - pPrice) / pMrp) * 100) : 0
        }).filter(d => d > 0)

        const maxD = validDiscounts.length > 0 ? Math.max(...validDiscounts) : null

        const topRated = products.filter(p => (typeof p.avgRating === 'number' && p.avgRating > 0) || (Array.isArray(p.rating) && p.rating.length > 0))
        const topRatedPrices = (topRated.length > 0 ? topRated : products)
            .map(p => typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0)
            .filter(p => p > 0)
        const topRatedMin = topRatedPrices.length > 0 ? Math.min(...topRatedPrices) : minP

        return { minPrice: minP, maxDiscount: maxD, topRatedStartingPrice: topRatedMin }
    }, [products])

    return (
        <div className='mx-4 sm:mx-6'>
            <div className='flex max-xl:flex-col gap-6 max-w-7xl mx-auto my-8'>
                {/* Main Hero Showcase Banner */}
                <div className='relative flex-1 flex flex-col justify-between bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-12 xl:min-h-[460px] shadow-2xl overflow-hidden group'>
                    {/* Ambient Glow Orbs */}
                    <div className='absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none' />
                    <div className='absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none' />

                    {/* Top Content */}
                    <div className='relative z-10 max-w-lg'>
                        {/* News/Offer Badge */}
                        <div className='inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md text-emerald-200 border border-white/20 pr-4 p-1 rounded-full text-xs font-semibold shadow-xs hover:bg-white/15 transition'>
                            <span className='bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider'>
                                Offer
                            </span>
                            Free Express Shipping on Orders Above {formatPrice(499)}! 
                            <ChevronRight size={14} className='group-hover:translate-x-1 transition-transform' />
                        </div>

                        {/* High-Impact Headline */}
                        <h1 className='text-3xl sm:text-5xl font-extrabold leading-[1.15] mt-4 mb-3 tracking-tight text-white drop-shadow-xs'>
                            Gadgets you'll love. <br />
                            <span className='bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent'>
                                Prices you'll trust.
                            </span>
                        </h1>

                        <p className='text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-md'>
                            Discover handpicked electronics, premium timepieces, and lifestyle gear backed by verified buyer guarantees.
                        </p>

                        {/* Trust Highlights */}
                        <div className='flex items-center gap-4 text-xs text-emerald-200/90 mt-5 flex-wrap font-medium'>
                            <span className='flex items-center gap-1.5'>
                                <ShieldCheck size={15} className='text-emerald-300' /> 100% Genuine
                            </span>
                            <span className='flex items-center gap-1.5'>
                                <Truck size={15} className='text-emerald-300' /> Same-Day Dispatch
                            </span>
                            <span className='flex items-center gap-1.5'>
                                <Zap size={15} className='text-amber-300' /> 7-Day Easy Returns
                            </span>
                        </div>

                        {/* Pricing & CTA Row */}
                        <div className='flex items-center gap-6 mt-8 flex-wrap'>
                            <div>
                                <span className='text-xs uppercase tracking-wider text-emerald-300/80 font-medium block'>
                                    Starts from
                                </span>
                                <div className='flex items-baseline gap-2'>
                                    <span className='text-3xl font-extrabold text-white'>
                                        {minPrice !== null ? formatPrice(minPrice) : formatPrice(80)}
                                    </span>
                                    {maxDiscount ? (
                                        <span className='text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/30'>
                                            Up to {maxDiscount}% OFF
                                        </span>
                                    ) : (
                                        <span className='text-xs font-bold text-emerald-300 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-300/30'>
                                            Best Value
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Link 
                                href='/shop' 
                                className='inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-3 px-8 rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 active:scale-95 transition-all'
                            >
                                Shop Catalog <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Floating Model Image */}
                    <div className='relative sm:absolute bottom-0 right-0 md:right-8 w-full sm:max-w-md pointer-events-none z-10 max-sm:mt-8 flex justify-center'>
                        <Image 
                            className='w-full max-w-xs sm:max-w-sm drop-shadow-2xl group-hover:scale-102 transition-transform duration-500' 
                            src={assets.hero_model_img} 
                            alt="GoCart Premium Shopping" 
                            priority 
                        />
                    </div>
                </div>

                {/* Right Side Cards */}
                <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm'>
                    {/* Card 1: Best Selling Spotlight */}
                    <Link 
                        href='/best-selling' 
                        className='flex-1 flex items-center justify-between w-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white rounded-3xl p-6 px-8 relative overflow-hidden shadow-lg group hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer'
                    >
                        <div className='space-y-2 z-10'>
                            <span className='inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20'>
                                <Star size={11} className='fill-amber-200 text-amber-200' /> Best Sellers
                            </span>
                            <h3 className='text-2xl font-bold tracking-tight'>Top Rated Gear</h3>
                            <p className='text-xs text-amber-100'>
                                Starting at {topRatedStartingPrice !== null ? formatPrice(topRatedStartingPrice) : (minPrice !== null ? formatPrice(minPrice) : formatPrice(80))}
                            </p>
                            <span className='inline-flex items-center gap-1.5 text-xs font-bold text-white pt-2 group-hover:translate-x-1.5 transition-transform'>
                                View collection <ArrowRight size={14} />
                            </span>
                        </div>
                        <Image 
                            className='w-32 group-hover:scale-110 transition-transform duration-300 drop-shadow-xl' 
                            src={assets.hero_product_img1} 
                            alt="Best Sellers" 
                        />
                    </Link>

                    {/* Card 2: Flash Discounts Spotlight */}
                    <Link 
                        href='/shop' 
                        className='flex-1 flex items-center justify-between w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white rounded-3xl p-6 px-8 relative overflow-hidden shadow-lg group hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer'
                    >
                        <div className='space-y-2 z-10'>
                            <span className='inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20'>
                                <Sparkles size={11} className='text-cyan-200' /> Flash Deals
                            </span>
                            <h3 className='text-2xl font-bold tracking-tight'>
                                {maxDiscount ? `Up to ${maxDiscount}% Off` : 'Flash Deals'}
                            </h3>
                            <p className='text-xs text-blue-100'>Top audio & smart gear</p>
                            <span className='inline-flex items-center gap-1.5 text-xs font-bold text-white pt-2 group-hover:translate-x-1.5 transition-transform'>
                                Claim discount <ArrowRight size={14} />
                            </span>
                        </div>
                        <Image 
                            className='w-32 group-hover:scale-110 transition-transform duration-300 drop-shadow-xl' 
                            src={assets.hero_product_img2} 
                            alt="Flash Discounts" 
                        />
                    </Link>
                </div>
            </div>

            {/* Categories Marquee Carousel */}
            <CategoriesMarquee />
        </div>
    )
}

export default Hero
