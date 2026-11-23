'use client'

import React, { useState, useEffect, useRef } from "react"
import { ArrowRight, StarIcon, CheckCircle2, ShieldCheck, Loader2, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { assets } from "@/assets/assets"
import { graphqlRequest } from "@/lib/apiClient"
import { GET_PRODUCT_RATINGS_QUERY } from "@/lib/graphql/rating"

const ProductDescription = ({ product }) => {
    const [selectedTab, setSelectedTab] = useState('Description')
    const [storeLogoLoaded, setStoreLogoLoaded] = useState(false)
    const logoRef = useRef(null)

    const store = product?.store || {}
    const storeLogo = store.logo || store.logoUrl || assets.happy_store || assets.gs_logo
    const storeName = store.name || "Verified Store"
    const storeUsername = store.username || store.id || null

    useEffect(() => {
        if (logoRef.current && logoRef.current.complete && logoRef.current.naturalWidth > 0) {
            setStoreLogoLoaded(true)
            return
        }
        const timer = setTimeout(() => {
            setStoreLogoLoaded(true)
        }, 800)
        return () => clearTimeout(timer)
    }, [storeLogo])

    const [ratingsData, setRatingsData] = useState({
        total: 0,
        averageRating: 0,
        stars: { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 },
        ratings: [],
    })
    const [isLoadingRatings, setIsLoadingRatings] = useState(false)

    useEffect(() => {
        if (!product?.id) return
        let isCancelled = false

        const fetchRatings = async () => {
            setIsLoadingRatings(true)
            try {
                const res = await graphqlRequest(GET_PRODUCT_RATINGS_QUERY, {
                    productId: String(product.id),
                    limit: 50,
                    offset: 0,
                })
                if (!isCancelled && res?.productRatings) {
                    setRatingsData(res.productRatings)
                }
            } catch (err) {
                console.warn('Could not fetch product ratings from backend:', err)
            } finally {
                if (!isCancelled) {
                    setIsLoadingRatings(false)
                }
            }
        }

        fetchRatings()

        return () => {
            isCancelled = true
        }
    }, [product?.id])

    const totalReviews = ratingsData.total || 0
    const avgRating = ratingsData.averageRating || 0
    const stars = ratingsData.stars || { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 }

    const starBreakdown = [
        { label: '5 Star', count: stars.fiveStar || 0 },
        { label: '4 Star', count: stars.fourStar || 0 },
        { label: '3 Star', count: stars.threeStar || 0 },
        { label: '2 Star', count: stars.twoStar || 0 },
        { label: '1 Star', count: stars.oneStar || 0 },
    ]

    return (
        <div className="my-14 text-sm text-slate-600">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', 'Reviews'].map((tab) => (
                    <button
                        key={tab}
                        className={`${
                            tab === selectedTab ? 'border-b-2 border-slate-900 font-semibold text-slate-900' : 'text-slate-400 hover:text-slate-600'
                        } px-4 py-2.5 font-medium transition cursor-pointer`}
                        onClick={() => setSelectedTab(tab)}
                    >
                        {tab} {tab === 'Reviews' && totalReviews > 0 && `(${totalReviews})`}
                    </button>
                ))}
            </div>

            {/* Description Tab */}
            {selectedTab === "Description" && (
                <div className="max-w-3xl space-y-4 text-slate-600 leading-relaxed">
                    <p>{product?.description || "No detailed description provided for this product."}</p>
                </div>
            )}

            {/* Reviews Tab */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-6 mt-6 max-w-2xl">
                    {isLoadingRatings ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 size={24} className="animate-spin text-green-600" />
                            <p className="text-xs">Loading customer reviews...</p>
                        </div>
                    ) : totalReviews > 0 ? (
                        <>
                            {/* Verified Buyer Ratings Aggregate Card */}
                            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                                <div className="text-center sm:border-r sm:border-slate-200 sm:pr-6 shrink-0">
                                    <div className="text-4xl font-black text-slate-900 leading-tight">
                                        {avgRating.toFixed(1)}
                                    </div>
                                    <div className="flex items-center justify-center gap-1 my-1.5">
                                        {Array(5).fill('').map((_, i) => (
                                            <StarIcon
                                                key={i}
                                                size={15}
                                                className={i < Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                                    </p>
                                </div>

                                {/* Star Percentage Bars */}
                                <div className="w-full space-y-1.5 flex-1">
                                    {starBreakdown.map((b) => {
                                        const pct = totalReviews > 0 ? Math.round((b.count / totalReviews) * 100) : 0
                                        return (
                                            <div key={b.label} className="flex items-center gap-3 text-xs">
                                                <span className="w-12 text-slate-500 shrink-0">{b.label}</span>
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="w-8 text-right text-slate-400 font-mono text-[11px]">{pct}%</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-4">
                                {ratingsData.ratings.map((item, index) => (
                                    <div key={item.id || index} className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                {Array(5).fill('').map((_, starIdx) => (
                                                    <StarIcon
                                                        key={starIdx}
                                                        size={14}
                                                        className={starIdx < (item.rating || 5) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                                <ShieldCheck size={12} /> Verified Buyer
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-700 leading-relaxed">{item.review}</p>

                                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 border-t border-slate-100">
                                            <span>Purchased customer</span>
                                            <span>•</span>
                                            <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Verified Order'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 sm:p-10 text-center bg-gradient-to-b from-emerald-50/50 via-white to-slate-50/60 rounded-2xl border border-emerald-100 shadow-2xs">
                            <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-100/80 text-emerald-700 mb-3">
                                <Sparkles size={22} />
                            </div>
                            <h4 className="text-base font-semibold text-slate-800 mb-1">Be the First Verified Buyer to Review!</h4>
                            <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
                                Experience guaranteed quality direct from verified merchants. Complete your purchase today and share your verified experience to help the community!
                            </p>
                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white px-3.5 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs">
                                <ShieldCheck size={14} className="text-emerald-600" /> 100% Buyer Protection & Guaranteed Authenticity
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Store Information */}
            <div className="flex items-center gap-3.5 mt-12 p-4 rounded-2xl bg-white border border-slate-200/80 max-w-md shadow-xs">
                <div className="size-12 rounded-xl overflow-hidden ring-1 ring-slate-200 shrink-0 relative bg-slate-100">
                    {!storeLogoLoaded && (
                        <div className="absolute inset-0 bg-slate-200 overflow-hidden pointer-events-none z-0">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        </div>
                    )}
                    <Image
                        key={typeof storeLogo === 'string' ? storeLogo : 'logo'}
                        src={storeLogo}
                        alt={storeName}
                        className="relative z-10 w-full h-full object-cover"
                        width={48}
                        height={48}
                        unoptimized
                        onLoad={() => setStoreLogoLoaded(true)}
                        onError={() => setStoreLogoLoaded(true)}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Sold by</p>
                    <p className="font-semibold text-slate-800 truncate">{storeName}</p>
                    {storeUsername ? (
                        <Link href={`/shop/${storeUsername}`} className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium mt-0.5">
                            Visit Store <ArrowRight size={12} />
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default ProductDescription
