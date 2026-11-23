'use client'

import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import ProductCardSkeleton from './ProductCardSkeleton'
import { useSelector } from 'react-redux'

const BestSelling = () => {
    const displayQuantity = 8
    const products = useSelector(state => state.product.list)
    const loading = useSelector(state => state.product.loading)

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 my-10 sm:my-14 select-none'>
            <Title 
                title='Most Popular & Best Sellers' 
                description='Top-ordered products chosen by thousands of satisfied customers across our marketplace.' 
                href='/best-selling' 
            />
            <div className='mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
                {products.length === 0 && loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : (
                    products
                        .slice()
                        .sort((a, b) => (b.price || 0) - (a.price || 0))
                        .slice(0, displayQuantity)
                        .map((product, index) => (
                            <ProductCard key={product.id || index} product={product} />
                        ))
                )}
            </div>
        </div>
    )
}

export default BestSelling
