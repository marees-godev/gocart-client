'use client'

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Link from "next/link"
import {
    Plus,
    Package,
    RefreshCw,
    PlusCircle,
    Trash2,
    ExternalLink,
    Edit3,
    X,
    CheckCircle2,
    Scale,
    ArrowLeftRight,
    Tag,
    DollarSign,
    Save
} from "lucide-react"
import Loading from "@/components/Loading"
import { graphqlRequest } from "@/lib/apiClient"
import {
    GET_PRODUCTS_QUERY,
    UPDATE_PRODUCT_MUTATION,
    DELETE_PRODUCT_MUTATION,
    GET_CATEGORIES_QUERY
} from "@/lib/graphql/product"
import { useStore } from "@/components/store/StoreLayout"
import { useCurrency } from "@/lib/features/currency/useCurrency"
import { useDialog } from "@/components/DialogProvider"

const PRODUCT_STATUSES = [
    { value: 'PUBLISHED', label: 'Published (Live)' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'IN_STOCK', label: 'In Stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
]

export default function StoreManageProducts() {
    const { formatPrice } = useCurrency()
    const { storeInfo } = useStore()
    const { confirm: confirmDialog } = useDialog()

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [deletingId, setDeletingId] = useState(null)

    // Edit Product Modal State
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        price: '',
        mrp: '',
        tax: '',
        weight: '',
        status: 'PUBLISHED',
        isExchangeEligible: false,
        maxExchangeDiscount: '',
        categoryId: ''
    })
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    const fetchCategories = async () => {
        try {
            const data = await graphqlRequest(GET_CATEGORIES_QUERY, { limit: 100 })
            if (data?.categories?.categories) {
                setCategories(data.categories.categories)
            }
        } catch {
            // Silently fallback
        }
    }

    const fetchProducts = async () => {
        if (!storeInfo?.id) {
            setLoading(false)
            setRefreshing(false)
            return
        }

        try {
            const data = await graphqlRequest(GET_PRODUCTS_QUERY, {
                storeId: storeInfo.id,
                limit: 100
            })
            if (data?.products?.products) {
                // Filter out soft-deleted products
                const activeProducts = data.products.products.filter(p => !p.deletedAt)
                setProducts(activeProducts)
            } else {
                setProducts([])
            }
        } catch (err) {
            console.error("Failed to load products from API:", err)
            setProducts([])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [storeInfo?.id])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchProducts()
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setEditForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            mrp: product.mrp?.toString() || '',
            tax: (product.tax ?? '0.00').toString(),
            weight: (product.weight ?? '0.50').toString(),
            status: product.status || 'PUBLISHED',
            isExchangeEligible: Boolean(product.isExchangeEligible),
            maxExchangeDiscount: (product.maxExchangeDiscount ?? '0.00').toString(),
            categoryId: product.categoryId || ''
        })
    }

    const handleSaveEdit = async (e) => {
        e.preventDefault()
        if (!editingProduct?.id) return

        if (!editForm.name.trim()) {
            toast.error('Product Name is required')
            return
        }
        if (!editForm.price || isNaN(parseFloat(editForm.price))) {
            toast.error('Valid Offer Price is required')
            return
        }
        if (!editForm.mrp || isNaN(parseFloat(editForm.mrp))) {
            toast.error('Valid MRP is required')
            return
        }
        if (!editForm.weight || isNaN(parseFloat(editForm.weight)) || parseFloat(editForm.weight) <= 0) {
            toast.error('Valid weight in kg is required for shipping calculations')
            return
        }

        setIsSavingEdit(true)
        const toastId = toast.loading('Saving product updates...')

        const input = {
            name: editForm.name.trim(),
            description: editForm.description.trim() || null,
            price: parseFloat(editForm.price),
            mrp: parseFloat(editForm.mrp),
            tax: editForm.tax ? parseFloat(editForm.tax) : 0,
            weight: parseFloat(editForm.weight) || 0.5,
            status: editForm.status,
            isExchangeEligible: Boolean(editForm.isExchangeEligible),
            maxExchangeDiscount: editForm.isExchangeEligible ? (parseFloat(editForm.maxExchangeDiscount) || 0) : 0,
            categoryId: editForm.categoryId || undefined
        }

        try {
            const data = await graphqlRequest(UPDATE_PRODUCT_MUTATION, {
                id: editingProduct.id,
                input
            })

            if (data?.updateProduct) {
                setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data.updateProduct } : p))
                toast.success(`Product "${input.name}" updated successfully!`, { id: toastId })
                setEditingProduct(null)
            }
        } catch (err) {
            console.error("Failed to update product:", err)
            toast.error(err.message || 'Failed to update product', { id: toastId })
        } finally {
            setIsSavingEdit(false)
        }
    }

    const toggleStock = async (productId) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        const currentInStock = product.status === 'IN_STOCK' || product.status === 'PUBLISHED' || product.inStock !== false
        const nextStatus = currentInStock ? 'OUT_OF_STOCK' : 'IN_STOCK'

        // Optimistic UI update
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return { ...p, status: nextStatus, inStock: !currentInStock }
            }
            return p
        }))

        try {
            await graphqlRequest(UPDATE_PRODUCT_MUTATION, {
                id: productId,
                input: { status: nextStatus }
            })
            toast.success(`Product marked as ${nextStatus === 'IN_STOCK' ? 'in stock' : 'out of stock'}`)
        } catch (err) {
            console.error("Failed to update product stock:", err)
            // Revert on error
            setProducts(prev => prev.map(p => {
                if (p.id === productId) {
                    return { ...p, status: product.status, inStock: currentInStock }
                }
                return p
            }))
            toast.error(err.message || "Failed to update product status on server")
        }
    }

    const handleDeleteProduct = async (productId, productName) => {
        const confirmed = await confirmDialog({
            title: 'Delete Product',
            description: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
            confirmText: 'Delete Product',
            variant: 'danger',
        })
        if (!confirmed) {
            return
        }

        setDeletingId(productId)
        try {
            await graphqlRequest(DELETE_PRODUCT_MUTATION, { id: productId })
            setProducts(prev => prev.filter(p => p.id !== productId))
            toast.success(`Product "${productName}" deleted successfully`)
        } catch (err) {
            console.error("Failed to delete product:", err)
            toast.error(err.message || "Failed to delete product from server")
        } finally {
            setDeletingId(null)
        }
    }

    if (loading) return <Loading variant="merchant" title="Loading Product Catalog" subtitle="Retrieving store inventory, variant matrix & stock status..." />

    return (
        <div className="w-full text-slate-700 pb-20 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="text-emerald-600" size={24} />
                        Manage Products
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Catalog inventory for <span className="font-semibold text-slate-800">{storeInfo?.name || "your store"}</span> ({products.length} items)
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        title="Refresh catalog"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    </button>
                    <Link
                        href="/store/add-product"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-sm cursor-pointer"
                    >
                        <Plus size={16} /> Add Product
                    </Link>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Package size={32} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-slate-800">No Products Listed Yet</h2>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            Your store catalog is currently empty. Add your first item with custom pricing, variants, and stock counts.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link
                            href="/store/add-product"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition active:scale-95 cursor-pointer"
                        >
                            <PlusCircle size={16} /> Add Your First Product
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3.5">Product</th>
                                    <th className="px-4 py-3.5 hidden md:table-cell">SKU</th>
                                    <th className="px-4 py-3.5">Weight / Tax</th>
                                    <th className="px-4 py-3.5 hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3.5">MRP</th>
                                    <th className="px-4 py-3.5">Offer Price</th>
                                    <th className="px-4 py-3.5 hidden lg:table-cell">Exchange</th>
                                    <th className="px-4 py-3.5 text-center">In Stock</th>
                                    <th className="px-4 py-3.5 text-center">Actions</th>
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
                                            <td className="px-4 py-4 text-xs space-y-0.5">
                                                <div className="font-medium text-slate-700 flex items-center gap-1">
                                                    <Scale size={13} className="text-slate-400" />
                                                    {product.weight ? `${product.weight} kg` : '0.50 kg'}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    Tax: {formatPrice(product.tax || 0)}
                                                </div>
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
                                                {formatPrice(product.mrp)}
                                            </td>
                                            <td className="px-4 py-4 font-semibold text-slate-900">
                                                {formatPrice(product.price)}
                                            </td>
                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                {product.isExchangeEligible ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                                        <ArrowLeftRight size={11} /> Eligible
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">
                                                        No return
                                                    </span>
                                                )}
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
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                                        title="Edit product details, pricing, weight & policy"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <Link
                                                        href={`/product/${product.id}`}
                                                        target="_blank"
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                                        title="View on store"
                                                    >
                                                        <ExternalLink size={15} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id, product.name)}
                                                        disabled={deletingId === product.id}
                                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                                                        title="Delete product"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Edit3 size={20} className="text-emerald-600" /> Edit Product Catalog Entry
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Update SKU details, pricing, delivery weight & exchange policies.
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-5 text-sm">
                            {/* Product Name */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 text-sm font-semibold"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 text-xs resize-y"
                                />
                            </div>

                            {/* Pricing & Logistics Matrix */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                        Offer Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={editForm.price}
                                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                        MRP ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={editForm.mrp}
                                        onChange={(e) => setEditForm({ ...editForm, mrp: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                        Tax ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editForm.tax}
                                        onChange={(e) => setEditForm({ ...editForm, tax: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                        Weight (kg) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={editForm.weight}
                                        onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs font-bold text-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Status & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Product Status
                                    </label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none text-xs text-slate-800"
                                    >
                                        {PRODUCT_STATUSES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {categories.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Category
                                        </label>
                                        <select
                                            value={editForm.categoryId}
                                            onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none text-xs text-slate-800"
                                        >
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Exchange Policy */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                            <ArrowLeftRight size={14} className="text-blue-600" /> Doorstep Return & Exchange Eligibility
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Enable customer doorstep returns and logistics exchange pickups
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.isExchangeEligible}
                                            onChange={(e) => setEditForm({ ...editForm, isExchangeEligible: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {editForm.isExchangeEligible && (
                                    <div className="pt-2 border-t border-slate-200/80 animate-in fade-in">
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Max Exchange Discount ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editForm.maxExchangeDiscount}
                                            onChange={(e) => setEditForm({ ...editForm, maxExchangeDiscount: e.target.value })}
                                            placeholder="5.00"
                                            className="w-full sm:w-1/2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 outline-none text-xs font-semibold"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {isSavingEdit ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <Save size={14} />
                                    )}
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
