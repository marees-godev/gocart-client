'use client'

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Title from './Title'
import ProductCard from './ProductCard'
import { graphqlRequest } from '@/lib/apiClient'
import { GET_RECENTLY_VIEWED_PRODUCTS_QUERY } from '@/lib/graphql/personalization'

export default function RecentlyViewed() {
    const products = useSelector((state) => state.product.list || [])
    const { isAuthenticated } = useSelector((state) => state.auth)
    const [recentProducts, setRecentProducts] = useState([])

    useEffect(() => {
        if (!products || products.length === 0) return

        const sessionId =
            typeof window !== 'undefined'
                ? localStorage.getItem('gocart_session_id') || 'guest-session'
                : undefined

        graphqlRequest(GET_RECENTLY_VIEWED_PRODUCTS_QUERY, {
            sessionId: isAuthenticated ? undefined : sessionId,
            limit: 8,
            offset: 0,
        })
            .then((res) => {
                const list = res?.recentlyViewedProducts?.products || []
                if (list.length > 0) {
                    const matched = list
                        .map((item) => products.find((p) => String(p.id) === String(item.productId)))
                        .filter(Boolean)
                    setRecentProducts(matched)
                }
            })
            .catch(() => {
                // ignore silently if personalization service is unavailable
            })
    }, [products, isAuthenticated])

    if (recentProducts.length === 0) return null

    return (
        <div className="px-6 my-16 max-w-6xl mx-auto">
            <Title
                title="Recently Viewed"
                description="Pick up right where you left off"
                href="/shop"
            />
            <div className="mt-8 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between">
                {recentProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}
