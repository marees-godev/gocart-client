'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
    Star,
    MessageSquare,
    Send,
    Filter,
    Search,
    CheckCircle,
    CornerDownRight
} from 'lucide-react'
import { useStore } from '@/components/store/StoreLayout'
import { graphqlRequest } from '@/lib/apiClient'
import { GET_PRODUCTS_QUERY } from '@/lib/graphql/product'
import { useEffect } from 'react'

export default function MerchantReviews() {
    const { storeInfo } = useStore()
    const [reviews, setReviews] = useState([])
    const [filterStar, setFilterStar] = useState('ALL')
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyText, setReplyText] = useState('')

    useEffect(() => {
        const fetchReviews = async () => {
            if (!storeInfo?.id) return
            try {
                const prodRes = await graphqlRequest(GET_PRODUCTS_QUERY, {
                    storeId: storeInfo.id,
                    limit: 100
                }).catch(() => null)

                const storeProducts = prodRes?.products?.products || []
                const collectedRatings = []
                storeProducts.forEach(p => {
                    if (Array.isArray(p.ratings)) {
                        p.ratings.forEach(r => {
                            collectedRatings.push({ ...r, product: p })
                        })
                    }
                })
                setReviews(collectedRatings)
            } catch {
                setReviews([])
            }
        }
        fetchReviews()
    }, [storeInfo?.id])

    // Filter reviews
    const filteredReviews = reviews.filter((r) => {
        if (filterStar === 'ALL') return true
        return Math.floor(r.rating) === Number(filterStar)
    })

    const handleSendReply = (reviewId) => {
        // TODO: Insert your reply API handler logic
        console.log('Replied to review:', reviewId, replyText)
        setReplyingTo(null)
        setReplyText('')
    }

    return (
        <div className="text-slate-600 mb-28 max-w-5xl space-y-8">
            
            {/* Page Header */}
            <div>
                <h1 className="text-2xl text-slate-500">
                    Customer <span className="text-slate-800 font-medium">Reviews & Ratings</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Manage buyer feedback, respond to customer inquiries, and track product ratings.
                </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
                {['ALL', '5', '4', '3', '2', '1'].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setFilterStar(star)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                            filterStar === star
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {star === 'ALL' ? (
                            'All Ratings'
                        ) : (
                            <>
                                <span>{star} Stars</span>
                                <Star size={12} fill="#EAB308" className="text-amber-500" />
                            </>
                        )}
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                        No reviews found for this rating filter.
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Reviewer Info */}
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={review.user?.image}
                                        alt={review.user?.name}
                                        width={42}
                                        height={42}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                                    />
                                    <div>
                                        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                                            {review.user?.name}
                                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                                Verified Buyer
                                            </span>
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            {new Date(review.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Star rating chip */}
                                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80 w-fit">
                                    <div className="flex items-center">
                                        {Array(5)
                                            .fill('')
                                            .map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={13}
                                                    fill={review.rating >= i + 1 ? '#F59E0B' : '#E2E8F0'}
                                                    className={review.rating >= i + 1 ? 'text-amber-500' : 'text-slate-200'}
                                                />
                                            ))}
                                    </div>
                                    <span className="text-xs font-bold text-amber-900 ml-1">
                                        {review.rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Review Content */}
                            <p className="text-sm text-slate-700 leading-relaxed">{review.review}</p>

                            {/* Product Mention Badge */}
                            {review.product && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                                    <span className="text-slate-400">Product:</span>
                                    <span className="font-medium text-slate-800">{review.product.name}</span>
                                    <span className="text-slate-400">&bull; {review.product.category}</span>
                                </div>
                            )}

                            {/* Reply Action */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                                >
                                    <CornerDownRight size={14} />
                                    {replyingTo === review.id ? 'Cancel Reply' : 'Public Merchant Response'}
                                </button>
                            </div>

                            {/* Inline Reply Box */}
                            {replyingTo === review.id && (
                                <div className="mt-3 pl-4 border-l-2 border-green-500 space-y-2">
                                    <textarea
                                        rows={2}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a helpful, courteous response from your store..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-slate-800 outline-none text-xs text-slate-800 resize-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSendReply(review.id)}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition"
                                    >
                                        <Send size={12} /> Post Store Reply
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
