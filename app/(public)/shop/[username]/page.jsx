'use client'

import React, { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useSelector } from "react-redux"
import {
    Store,
    MapPin,
    Mail,
    Phone,
    ShieldCheck,
    Star,
    Share2,
    Heart,
    Search,
    SlidersHorizontal,
    CheckCircle2,
    Package,
    Truck,
    RotateCcw,
    Lock,
    Sparkles,
    Clock,
    X,
    Filter
} from "lucide-react"
import toast from "react-hot-toast"
import ProductCard from "@/components/ProductCard"
import Loading from "@/components/Loading"
import { dummyStoreData, assets } from "@/assets/assets"
import { graphqlRequest } from "@/lib/apiClient"
import { GET_PRODUCTS_QUERY } from "@/lib/graphql/product"
import { GET_ALL_STORES_QUERY } from "@/lib/graphql/store"
import { normalizeProduct } from "@/lib/features/product/productSlice"

export default function StoreShop() {
    const { username } = useParams()
    const reduxProducts = useSelector((state) => state.product.list)

    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isFollowed, setIsFollowed] = useState(false)

    // Filtering, Search & Sorting state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('ALL')
    const [sortBy, setSortBy] = useState('FEATURED')
    const [onlyInStock, setOnlyInStock] = useState(false)

    useEffect(() => {
        let isMounted = true

        const fetchStoreAndProducts = async () => {
            setLoading(true)
            const cleanUsername = String(username || '').trim()

            let resolvedStore = null
            let resolvedProducts = []

            // 1. Try to fetch matching store record from backend
            try {
                const storesData = await graphqlRequest(GET_ALL_STORES_QUERY, { limit: 100 }).catch(() => null)
                const allStores = storesData?.stores?.stores || []

                // Match by slug, ID, or case-insensitive slugified name
                resolvedStore = allStores.find(
                    (s) =>
                        (s.slug && s.slug.toLowerCase() === cleanUsername.toLowerCase()) ||
                        (s.id && s.id === cleanUsername) ||
                        (s.name && s.name.toLowerCase().replace(/\s+/g, '-') === cleanUsername.toLowerCase())
                )
            } catch (err) {
                console.warn("Could not query stores from backend:", err)
            }

            // 2. Fetch products for this store
            const targetStoreId = resolvedStore?.id || cleanUsername
            try {
                const prodData = await graphqlRequest(GET_PRODUCTS_QUERY, {
                    storeId: targetStoreId,
                    limit: 100
                }).catch(() => null)

                const backendList = prodData?.products?.products
                if (Array.isArray(backendList) && backendList.length > 0) {
                    resolvedProducts = backendList.map(normalizeProduct)
                }
            } catch (err) {
                console.warn("Could not query store products by storeId:", err)
            }

            // 3. Fallback: match against Redux products
            if (resolvedProducts.length === 0 && reduxProducts.length > 0) {
                const matchedInRedux = reduxProducts.filter(
                    (p) =>
                        p.storeId === cleanUsername ||
                        p.store?.id === cleanUsername ||
                        p.store?.slug === cleanUsername ||
                        p.store?.username === cleanUsername
                )

                if (matchedInRedux.length > 0) {
                    resolvedProducts = matchedInRedux
                    if (!resolvedStore) {
                        resolvedStore = matchedInRedux[0]?.store
                    }
                }
            }

            // 4. If store still not found but products exist or vice versa
            if (isMounted) {
                const fallbackName = cleanUsername
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')

                setStoreInfo({
                    ...dummyStoreData,
                    ...resolvedStore,
                    name: resolvedStore?.name || fallbackName || dummyStoreData.name,
                    description: resolvedStore?.description || dummyStoreData.description || "Official seller featuring verified catalog products with prompt door delivery.",
                    logo: resolvedStore?.logoUrl || resolvedStore?.logo || dummyStoreData.logo,
                    address: resolvedStore?.address || dummyStoreData.address,
                    email: resolvedStore?.businessEmail || dummyStoreData.email,
                    phone: resolvedStore?.businessPhone || dummyStoreData.phone,
                })

                // If no specific store products exist, fallback gracefully to Redux products
                setProducts(resolvedProducts.length > 0 ? resolvedProducts : reduxProducts)
                setLoading(false)
            }
        }

        fetchStoreAndProducts()

        return () => {
            isMounted = false
        }
    }, [username, reduxProducts])

    // Extract dynamic category pills from store products
    const availableCategories = useMemo(() => {
        const catMap = new Map()
        products.forEach((p) => {
            const catName = p.category?.name || p.category || 'General'
            catMap.set(catName, (catMap.get(catName) || 0) + 1)
        })

        return Array.from(catMap.entries()).map(([name, count]) => ({
            name,
            count
        }))
    }, [products])

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        return products
            .filter((p) => {
                // Search query match
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase()
                    const matchName = (p.name || '').toLowerCase().includes(q)
                    const matchDesc = (p.description || '').toLowerCase().includes(q)
                    const matchSku = (p.sku || '').toLowerCase().includes(q)
                    if (!matchName && !matchDesc && !matchSku) return false
                }

                // Category filter
                if (selectedCategory !== 'ALL') {
                    const prodCat = p.category?.name || p.category || 'General'
                    if (prodCat.toLowerCase() !== selectedCategory.toLowerCase()) return false
                }

                // In stock filter
                if (onlyInStock) {
                    if (p.status === 'OUT_OF_STOCK' || p.inStock === false) return false
                }

                return true
            })
            .sort((a, b) => {
                const priceA = parseFloat(a.price) || 0
                const priceB = parseFloat(b.price) || 0
                const ratingA = parseFloat(a.avgRating) || 0
                const ratingB = parseFloat(b.avgRating) || 0

                if (sortBy === 'PRICE_ASC') return priceA - priceB
                if (sortBy === 'PRICE_DESC') return priceB - priceA
                if (sortBy === 'RATING') return ratingB - ratingA
                return 0 // 'FEATURED' keeps default order
            })
    }, [products, searchQuery, selectedCategory, sortBy, onlyInStock])

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href)
            toast.success('Store link copied to clipboard!')
        }
    }

    const handleToggleFollow = () => {
        setIsFollowed((prev) => {
            const next = !prev
            toast.success(next ? `Following ${storeInfo?.name || 'Store'}!` : `Unfollowed store.`)
            return next
        })
    }

    if (loading) {
        return <Loading variant="merchant" title="Connecting to Storefront" subtitle="Loading verified merchant inventory & showcase catalog..." />
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-28">
            {/* 1. Modern Storefront Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
                {/* Decorative background grid pattern */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
                        backgroundSize: '24px 24px'
                    }}
                />

                <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Store Avatar Logo */}
                        <div className="relative group shrink-0">
                            <div className="size-28 sm:size-36 rounded-3xl overflow-hidden border-4 border-white/20 bg-white shadow-2xl flex items-center justify-center p-2 backdrop-blur-xs">
                                <Image
                                    src={storeInfo?.logo || assets.happy_store || assets.gs_logo}
                                    alt={storeInfo?.name || "Merchant Store"}
                                    className="size-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-300"
                                    width={180}
                                    height={180}
                                    unoptimized
                                />
                            </div>
                            <div
                                className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900"
                                title="Verified GoCart Merchant"
                            >
                                <CheckCircle2 size={18} />
                            </div>
                        </div>

                        {/* Store Info & Credentials */}
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <Sparkles size={13} /> Official Merchant
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <Star size={13} className="fill-amber-400 text-amber-400" /> 4.9 Rating (120+ reviews)
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    <Clock size={13} /> Fast Dispatch &bull; 24h SLA
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                                {storeInfo?.name}
                            </h1>

                            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                                {storeInfo?.description}
                            </p>

                            {/* Contact & Location Chips */}
                            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
                                {storeInfo?.address && (
                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                                        <MapPin size={14} className="text-emerald-400" />
                                        <span>{storeInfo.address}</span>
                                    </div>
                                )}
                                {storeInfo?.email && (
                                    <a
                                        href={`mailto:${storeInfo.email}`}
                                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-xs transition"
                                    >
                                        <Mail size={14} className="text-blue-400" />
                                        <span>{storeInfo.email}</span>
                                    </a>
                                )}
                                {storeInfo?.phone && (
                                    <a
                                        href={`tel:${storeInfo.phone}`}
                                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-xs transition"
                                    >
                                        <Phone size={14} className="text-amber-400" />
                                        <span>{storeInfo.phone}</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex md:flex-col gap-3 shrink-0 self-center md:self-start">
                            <button
                                type="button"
                                onClick={handleToggleFollow}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer shadow-md ${
                                    isFollowed
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                        : 'bg-white hover:bg-slate-100 text-slate-900'
                                }`}
                            >
                                <Heart size={15} className={isFollowed ? 'fill-white' : ''} />
                                {isFollowed ? 'Following' : 'Follow Store'}
                            </button>

                            <button
                                type="button"
                                onClick={handleShare}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs border border-white/20 transition cursor-pointer shadow-sm"
                                title="Share store URL"
                            >
                                <Share2 size={15} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Interactive Store Explorer, Search & Filter Bar */}
            <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Search in Store */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-3.5 text-slate-400 size-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search inside ${storeInfo?.name || 'this store'}...`}
                                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Controls: In-Stock Toggle & Sort */}
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer select-none transition">
                                <input
                                    type="checkbox"
                                    checked={onlyInStock}
                                    onChange={(e) => setOnlyInStock(e.target.checked)}
                                    className="accent-emerald-600 rounded"
                                />
                                In Stock Only
                            </label>

                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={15} className="text-slate-400" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                    <option value="FEATURED">Featured Items</option>
                                    <option value="PRICE_ASC">Price: Low to High</option>
                                    <option value="PRICE_DESC">Price: High to Low</option>
                                    <option value="RATING">Highest Rated</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    {availableCategories.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('ALL')}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                                    selectedCategory === 'ALL'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                All Products ({products.length})
                            </button>
                            {availableCategories.map((cat) => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.name)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer ${
                                        selectedCategory === cat.name
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat.name} ({cat.count})
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Product Catalog Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Package className="text-emerald-600" size={22} />
                            Store Catalog
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                {filteredProducts.length} items
                            </span>
                        </h2>

                        {(searchQuery || selectedCategory !== 'ALL' || onlyInStock) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('')
                                    setSelectedCategory('ALL')
                                    setOnlyInStock(false)
                                    setSortBy('FEATURED')
                                }}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-sm">
                            <div className="size-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                <Search size={28} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-800">No Products Matched</h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto">
                                    We couldn&apos;t find any products in this store matching your search criteria.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSearchQuery('')
                                    setSelectedCategory('ALL')
                                    setOnlyInStock(false)
                                }}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                View All Store Products
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Trust & Buyer Guarantee Section */}
                <div className="pt-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                                <Truck size={22} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Fast Doorstep Dispatch</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Managed via verified GoCart logistics carriers with doorstep tracking.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">100% Genuine Guaranteed</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    All items shipped directly from verified merchant warehouses.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                <RotateCcw size={22} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Doorstep Return Pickups</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Eligible products qualify for hassle-free doorstep return inspections.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                                <Lock size={22} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Secure Payment Checkout</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Protected payments encrypted end-to-end via Razorpay gateway.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
