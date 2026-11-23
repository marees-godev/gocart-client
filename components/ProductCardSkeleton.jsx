'use client'

/**
 * Reusable skeleton placeholder matching the shape of <ProductCard />.
 * Drop-in replacement for the animate-pulse grey box used in product grids.
 */
const ProductCardSkeleton = () => {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 flex flex-col gap-3">
            {/* Image area */}
            <div className="aspect-square w-full bg-slate-100 rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>

            {/* Text area */}
            <div className="space-y-2 pt-1">
                {/* Product status / pill */}
                <div className="h-3 bg-slate-100 rounded-full w-20 overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite_100ms] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
                {/* Product name */}
                <div className="h-4 bg-slate-100 rounded-md w-3/4 overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite_200ms] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
                {/* Price */}
                <div className="h-4 bg-slate-100 rounded-md w-1/3 overflow-hidden relative pt-2">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite_300ms] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
            </div>
        </div>
    )
}

export default ProductCardSkeleton

