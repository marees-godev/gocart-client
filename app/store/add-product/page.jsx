'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-hot-toast"
import {
    Package,
    Plus,
    Trash2,
    Sparkles,
    Layers,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Image as ImageIcon,
    Tag,
    Building2,
    Info,
    RefreshCw
} from "lucide-react"

import { graphqlRequest } from "@/lib/apiClient"
import { CREATE_PRODUCT_MUTATION, GET_CATEGORIES_QUERY } from "@/lib/graphql/product"
import { GET_USER_STORE_QUERY } from "@/lib/graphql/store"

const PRODUCT_STATUSES = [
    { value: 'DRAFT', label: 'Draft', desc: 'Saved privately, not visible on storefront' },
    { value: 'PUBLISHED', label: 'Published', desc: 'Live and ready for shoppers' },
    { value: 'IN_STOCK', label: 'In Stock', desc: 'Available for immediate orders' },
    { value: 'LOW_STOCK', label: 'Low Stock', desc: 'Flagged with low inventory notice' },
]

export default function StoreAddProduct() {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [fetchingInitial, setFetchingInitial] = useState(true)

    // Store & Categories fetched from backend
    const [categories, setCategories] = useState([])
    const [activeStore, setActiveStore] = useState(null)

    // Form State
    const [formData, setFormData] = useState({
        storeId: '',
        categoryId: '',
        sku: '',
        name: '',
        description: '',
        price: '',
        mrp: '',
        tax: '0.00',
        status: 'DRAFT',
        imageUrl: '',
        images: [''],
    })

    // Variants State
    const [enableVariants, setEnableVariants] = useState(false)
    const [variants, setVariants] = useState([
        {
            sku: '',
            name: 'Default Variant',
            price: '',
            mrp: '',
            stock: 10,
            color: 'Black',
            size: 'M',
        }
    ])

    // Load Categories & Merchant's Store on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setFetchingInitial(true)
            try {
                // 1. Fetch categories
                const catRes = await graphqlRequest(GET_CATEGORIES_QUERY, { limit: 100 }).catch(() => null)
                if (catRes?.categories?.categories?.length > 0) {
                    setCategories(catRes.categories.categories)
                    // Preselect first category
                    setFormData(prev => ({ ...prev, categoryId: catRes.categories.categories[0].id }))
                }

                // 2. Fetch merchant store
                const storeRes = await graphqlRequest(GET_USER_STORE_QUERY).catch(() => null)
                if (storeRes?.myStore?.id) {
                    setActiveStore(storeRes.myStore)
                    setFormData(prev => ({ ...prev, storeId: storeRes.myStore.id }))
                } else {
                    setActiveStore(null)
                    setFormData(prev => ({ ...prev, storeId: '' }))
                }
            } catch (err) {
                console.error('Error fetching initial data:', err)
            } finally {
                setFetchingInitial(false)
            }
        }

        fetchInitialData()
    }, [])

    // Quick fill with sample data
    const handleFillSample = () => {
        const sampleCatId = categories.length > 0
            ? categories[0].id
            : 'bf62f1a4-10f5-4822-bded-4cfd5dfc0089'

        if (!activeStore?.id) {
            toast.error('You do not have a registered store yet. Please create one at /create-store first.', {
                duration: 5000,
            })
        }

        setFormData({
            storeId: activeStore?.id || '',
            categoryId: sampleCatId,
            sku: 'TSHIRT-BLK-001',
            name: 'Classic Crewneck T-Shirt',
            description: '100% combed cotton everyday crewneck.',
            price: '24.99',
            mrp: '29.99',
            tax: '1.50',
            status: 'DRAFT',
            imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
            images: [
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
            ],
        })

        setEnableVariants(true)
        setVariants([
            {
                sku: 'TSHIRT-BLK-001-M',
                name: 'Medium',
                price: '24.99',
                mrp: '29.99',
                stock: 50,
                color: 'Black',
                size: 'M',
            }
        ])

        if (activeStore?.id) {
            toast.success(`Filled sample data for your store "${activeStore.name}"!`)
        }
    }

    // Auto-generate SKU from name
    const handleGenerateSku = () => {
        if (!formData.name.trim()) {
            toast.error('Enter a product name first to generate SKU')
            return
        }
        const cleanName = formData.name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '-')
            .substring(0, 10)
        const rand = Math.floor(100 + Math.random() * 900)
        const generated = `${cleanName}-${rand}`
        setFormData(prev => ({ ...prev, sku: generated }))

        if (enableVariants && variants.length > 0) {
            setVariants(prev => prev.map((v, idx) => ({
                ...v,
                sku: `${generated}-${v.name ? v.name.substring(0, 3).toUpperCase() : `V${idx + 1}`}`
            })))
        }

        toast.success(`Generated SKU: ${generated}`)
    }

    // Image URL list handlers
    const handleAddImageField = () => {
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, '']
        }))
    }

    const handleUpdateImage = (index, value) => {
        const updated = [...formData.images]
        updated[index] = value
        setFormData(prev => ({
            ...prev,
            images: updated,
            imageUrl: index === 0 ? value : prev.imageUrl
        }))
    }

    const handleRemoveImage = (index) => {
        const updated = formData.images.filter((_, i) => i !== index)
        setFormData(prev => ({
            ...prev,
            images: updated.length ? updated : [''],
            imageUrl: updated[0] || ''
        }))
    }

    // Variant handlers
    const handleAddVariant = () => {
        const newSku = formData.sku ? `${formData.sku}-V${variants.length + 1}` : ''
        setVariants(prev => [
            ...prev,
            {
                sku: newSku,
                name: `Variant ${prev.length + 1}`,
                price: formData.price || '',
                mrp: formData.mrp || '',
                stock: 10,
                color: '',
                size: '',
            }
        ])
    }

    const handleUpdateVariant = (index, field, value) => {
        setVariants(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    const handleRemoveVariant = (index) => {
        setVariants(prev => prev.filter((_, i) => i !== index))
    }

    // Submit handler
    const onSubmitHandler = async (e) => {
        e.preventDefault()

        // 1. Basic Validations
        if (!formData.storeId?.trim()) {
            toast.error('Store ID is required. Please check your merchant account or enter a valid Store ID.')
            return
        }
        if (!formData.categoryId?.trim()) {
            toast.error('Category is required. Please select or enter a Category ID.')
            return
        }
        if (!formData.sku?.trim()) {
            toast.error('SKU is required.')
            return
        }
        if (!formData.name?.trim()) {
            toast.error('Product Name is required.')
            return
        }
        if (!formData.price || isNaN(parseFloat(formData.price))) {
            toast.error('Valid Offer Price is required.')
            return
        }
        if (!formData.mrp || isNaN(parseFloat(formData.mrp))) {
            toast.error('Valid MRP is required.')
            return
        }

        // 2. Build clean images array
        const validImages = formData.images.map(img => img.trim()).filter(Boolean)
        const primaryImageUrl = formData.imageUrl.trim() || validImages[0] || ''

        // 3. Build variants payload
        let formattedVariants = []
        if (enableVariants && variants.length > 0) {
            for (let i = 0; i < variants.length; i++) {
                const v = variants[i]
                if (!v.sku?.trim()) {
                    toast.error(`Variant #${i + 1} requires a SKU`)
                    return
                }
                if (!v.name?.trim()) {
                    toast.error(`Variant #${i + 1} requires a Name`)
                    return
                }

                // Build attributes JSON
                const attrObj = {}
                if (v.color?.trim()) attrObj.color = v.color.trim()
                if (v.size?.trim()) attrObj.size = v.size.trim()

                formattedVariants.push({
                    sku: v.sku.trim(),
                    name: v.name.trim(),
                    price: parseFloat(v.price) || parseFloat(formData.price),
                    mrp: parseFloat(v.mrp) || parseFloat(formData.mrp),
                    stock: parseInt(v.stock, 10) || 0,
                    attributesJson: JSON.stringify(attrObj),
                })
            }
        }

        // 4. Construct CreateProductInput matching GraphQL schema
        const input = {
            storeId: formData.storeId.trim(),
            categoryId: formData.categoryId.trim(),
            sku: formData.sku.trim(),
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            price: parseFloat(formData.price),
            mrp: parseFloat(formData.mrp),
            tax: formData.tax ? parseFloat(formData.tax) : 0,
            status: formData.status,
            imageUrl: primaryImageUrl || null,
            images: validImages.length > 0 ? validImages : null,
            variants: formattedVariants.length > 0 ? formattedVariants : null,
        }

        setLoading(true)
        try {
            const response = await graphqlRequest(CREATE_PRODUCT_MUTATION, { input })

            if (response?.createProduct?.id) {
                const createdProduct = response.createProduct
                toast.success(`Product "${createdProduct.name}" created successfully!`)

                // Redirect to Manage Products or reset
                setTimeout(() => {
                    router.push('/store/manage-product')
                }, 1200)
            } else {
                toast.success('Product created successfully!')
                router.push('/store/manage-product')
            }
        } catch (err) {
            console.error('Failed to create product:', err)
            toast.error(err.message || 'Failed to create product. Please check your inputs.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto pb-24 text-slate-700">
            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/store/manage-product"
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            title="Back to products"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Package className="text-green-600" size={26} />
                            Add New Product
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 pl-8">
                        Configure product details, pricing, variants, and publish to your store.
                    </p>
                </div>

                <div className="flex items-center gap-3 pl-8 md:pl-0">
                    <button
                        type="button"
                        onClick={handleFillSample}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition shadow-sm"
                    >
                        <Sparkles size={14} className="text-emerald-600" />
                        Fill Sample Data
                    </button>
                    <Link
                        href="/store/manage-product"
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
                    >
                        Manage Catalog
                    </Link>
                </div>
            </div>

            {!activeStore && !fetchingInitial && (
                <div className="mt-6 p-5 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={22} />
                        <div>
                            <p className="font-bold text-sm">No Store Linked to Your Merchant Account</p>
                            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                                You can only add products to a store that your account owns. If you haven't created your store yet, please submit your store registration first.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/create-store"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition shadow-sm"
                    >
                        Create Your Store
                    </Link>
                </div>
            )}

            <form onSubmit={onSubmitHandler} className="mt-8 space-y-8">
                {/* 1. Basic Info Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                        <Tag className="text-indigo-600" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900">General Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Product Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Classic Crewneck T-Shirt"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm text-slate-900"
                            />
                        </div>

                        {/* SKU + Auto-generate */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateSku}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                                >
                                    <Sparkles size={12} /> Auto Generate
                                </button>
                            </div>
                            <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                placeholder="e.g. TSHIRT-BLK-001"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm font-mono uppercase text-slate-900"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.categoryId}
                                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm bg-white text-slate-900 cursor-pointer"
                            >
                                <option value="">-- Select Category --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} {cat.isActive === false ? '(Inactive)' : ''}
                                    </option>
                                ))}
                            </select>
                            {categories.length === 0 && !fetchingInitial && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} /> No categories found. You can enter a category UUID manually below.
                                </p>
                            )}
                        </div>

                        {/* Store Selection / ID */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Store ID <span className="text-rose-500">*</span>
                                </label>
                                {!activeStore && (
                                    <Link
                                        href="/create-store"
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                                    >
                                        Create a store &rarr;
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={formData.storeId}
                                    onChange={e => setFormData({ ...formData, storeId: e.target.value })}
                                    placeholder={activeStore ? activeStore.id : "e.g. your store UUID"}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm font-mono text-slate-900"
                                />
                                {activeStore && (
                                    <span className="absolute right-3 top-3 text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Building2 size={12} /> {activeStore.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {activeStore
                                    ? `Linked to your verified store "${activeStore.name}".`
                                    : "Must be a store UUID created by and owned by your merchant account."}
                            </p>
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Publication Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm bg-white text-slate-900 cursor-pointer font-medium"
                            >
                                {PRODUCT_STATUSES.map(st => (
                                    <option key={st.value} value={st.value}>
                                        {st.label} — {st.desc}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Write a compelling, detailed description of your product..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm text-slate-900 resize-y"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Pricing & Tax Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                        <DollarSign className="text-emerald-600" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900">Pricing & Tax</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Offer Price */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Offer Price ($) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3 text-slate-400 font-semibold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="24.99"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm text-slate-900 font-semibold"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Customer selling price</p>
                        </div>

                        {/* MRP */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Actual MRP ($) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3 text-slate-400 font-semibold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.mrp}
                                    onChange={e => setFormData({ ...formData, mrp: e.target.value })}
                                    placeholder="29.99"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm text-slate-900 font-semibold"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Maximum Retail Price</p>
                        </div>

                        {/* Tax */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                Tax ($)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3 text-slate-400 font-semibold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.tax}
                                    onChange={e => setFormData({ ...formData, tax: e.target.value })}
                                    placeholder="1.50"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm text-slate-900"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Tax included or surcharge</p>
                        </div>
                    </div>
                </div>

                {/* 3. Media & Images Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="text-blue-600" size={20} />
                            <h2 className="text-lg font-semibold text-slate-900">Product Images</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddImageField}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Another URL
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.images.map((imgUrl, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                                    {imgUrl ? (
                                        <img
                                            src={imgUrl}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                        />
                                    ) : (
                                        <ImageIcon className="text-slate-300" size={18} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        value={imgUrl}
                                        onChange={e => handleUpdateImage(index, e.target.value)}
                                        placeholder={index === 0 ? "Main image URL (https://...)" : "Additional gallery image URL"}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-slate-900"
                                    />
                                </div>
                                {formData.images.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                        title="Remove image"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Variants Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <Layers className="text-purple-600" size={20} />
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Product Variants</h2>
                                <p className="text-xs text-slate-500">Optional: Sizes, Colors, and Specific Inventory</p>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={enableVariants}
                                onChange={e => setEnableVariants(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                            />
                            <span className="text-xs font-semibold text-slate-700">Enable Variants</span>
                        </label>
                    </div>

                    {enableVariants && (
                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div key={index} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                            Variant #{index + 1}
                                        </span>
                                        {variants.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariant(index)}
                                                className="text-xs text-rose-500 hover:text-rose-700 inline-flex items-center gap-1"
                                            >
                                                <Trash2 size={12} /> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                                        {/* Variant Name */}
                                        <div className="lg:col-span-2">
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                Variant Name *
                                            </label>
                                            <input
                                                type="text"
                                                required={enableVariants}
                                                value={variant.name}
                                                onChange={e => handleUpdateVariant(index, 'name', e.target.value)}
                                                placeholder="e.g. Medium / Black"
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>

                                        {/* Variant SKU */}
                                        <div className="lg:col-span-2">
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                Variant SKU *
                                            </label>
                                            <input
                                                type="text"
                                                required={enableVariants}
                                                value={variant.sku}
                                                onChange={e => handleUpdateVariant(index, 'sku', e.target.value.toUpperCase())}
                                                placeholder="e.g. TSHIRT-BLK-001-M"
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono uppercase focus:outline-none focus:border-purple-500"
                                            />
                                        </div>

                                        {/* Stock */}
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                Stock
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={variant.stock}
                                                onChange={e => handleUpdateVariant(index, 'stock', e.target.value)}
                                                placeholder="50"
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                Price ($)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={variant.price}
                                                onChange={e => handleUpdateVariant(index, 'price', e.target.value)}
                                                placeholder={formData.price || '0.00'}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>

                                        {/* Color Attribute */}
                                        <div className="lg:col-span-3">
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                Color Attribute
                                            </label>
                                            <input
                                                type="text"
                                                value={variant.color}
                                                onChange={e => handleUpdateVariant(index, 'color', e.target.value)}
                                                placeholder="e.g. Black"
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>

                                        {/* Size Attribute */}
                                        <div className="lg:col-span-3">
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                Size Attribute
                                            </label>
                                            <input
                                                type="text"
                                                value={variant.size}
                                                onChange={e => handleUpdateVariant(index, 'size', e.target.value)}
                                                placeholder="e.g. M, L, XL"
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddVariant}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition border border-purple-200"
                            >
                                <Plus size={14} /> Add Another Variant
                            </button>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <Link
                        href="/store/manage-product"
                        className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="animate-spin" size={16} />
                                Creating Product...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Create Product
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}