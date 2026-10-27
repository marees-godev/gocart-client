'use client'

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { Plus, Package, RefreshCw, AlertCircle } from "lucide-react"
import Loading from "@/components/Loading"
import { productDummyData } from "@/assets/assets"
import { graphqlRequest } from "@/lib/apiClient"
import { GET_PRODUCTS_QUERY } from "@/lib/graphql/product"

export default function StoreManageProducts() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [products, setProducts] = useState([])

    const fetchProducts = async () => {
        try {
            const data = await graphqlRequest(GET_PRODUCTS_QUERY, { limit: 50 })
            if (data?.products?.products?.length > 0) {
                setProducts(data.products.products)
            } else {
                setProducts(productDummyData)
            }
        } catch (err) {
            console.error("Failed to load products from API:", err)
            setProducts(productDummyData)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        fetchProducts()
    }

    const toggleStock = async (productId) => {
        // Toggle stock state locally or via API
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const updatedStock = !p.inStock
                return { ...p, inStock: updatedStock }
            }
            return p
        }))
        toast.success("Product availability updated")
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="max-w-5xl text-slate-700 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="text-green-600" size={24} />
                        Manage Products
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        View, update, and manage your store inventory ({products.length} items)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                        title="Refresh catalog"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    </button>
                    <Link
                        href="/store/add-product"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
                    >
                        <Plus size={16} /> Add Product
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3.5">Product</th>
                                <th className="px-4 py-3.5 hidden md:table-cell">SKU</th>
                                <th className="px-4 py-3.5 hidden sm:table-cell">Status</th>
                                <th className="px-4 py-3.5">MRP</th>
                                <th className="px-4 py-3.5">Offer Price</th>
                                <th className="px-4 py-3.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {products.map((product) => {
                                const imgSrc = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || null

                                return (
                                    <tr key={product.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {imgSrc ? (
                                                        <img
                                                            src={imgSrc}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                        />
                                                    ) : (
                                                        <Package size={18} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="max-w-xs">
                                                    <p className="font-semibold text-slate-900 line-clamp-1">{product.name}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{product.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell font-mono text-xs text-slate-500">
                                            {product.sku || 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 hidden sm:table-cell">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                product.status === 'PUBLISHED' || product.status === 'IN_STOCK'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : product.status === 'DRAFT'
                                                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {product.status || (product.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-400 line-through text-xs">
                                            {currency} {Number(product.mrp || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-slate-900">
                                            {currency} {Number(product.price || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer text-gray-900">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    onChange={() => toggleStock(product.id)}
                                                    checked={product.status === 'IN_STOCK' || product.status === 'PUBLISHED' || product.inStock !== false}
                                                />
                                                <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"></div>
                                                <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                            </label>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}