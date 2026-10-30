'use client'

import { useEffect, useState, useRef } from "react"
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
    RefreshCw,
    UploadCloud,
    Upload,
    X,
    Loader2,
    Check,
    ImagePlus
} from "lucide-react"

import { graphqlRequest } from "@/lib/apiClient"
import { CREATE_PRODUCT_MUTATION, GET_CATEGORIES_QUERY } from "@/lib/graphql/product"
import {
    GET_USER_STORE_QUERY,
    GET_MERCHANT_STORES_QUERY,
    GENERATE_STORE_UPLOAD_URL_MUTATION
} from "@/lib/graphql/store"

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

    // Stores & Categories fetched from backend
    const [categories, setCategories] = useState([])
    const [stores, setStores] = useState([])
    const [activeStore, setActiveStore] = useState(null)

    // Device upload state
    const [uploadingMain, setUploadingMain] = useState(false)
    const [uploadingGallery, setUploadingGallery] = useState(false)
    const [mainDragActive, setMainDragActive] = useState(false)
    const [imageInputMode, setImageInputMode] = useState('device') // 'device' | 'url'
    const mainFileInputRef = useRef(null)
    const galleryFileInputRef = useRef(null)

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
        images: [],
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

    // Load Categories & Merchant's Stores on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setFetchingInitial(true)
            try {
                // 1. Fetch categories
                const catRes = await graphqlRequest(GET_CATEGORIES_QUERY, { limit: 100 }).catch(() => null)
                if (catRes?.categories?.categories?.length > 0) {
                    setCategories(catRes.categories.categories)
                    setFormData(prev => ({ ...prev, categoryId: catRes.categories.categories[0].id }))
                }

                // 2. Extract merchantId from JWT token
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                let merchantId = null
                if (token) {
                    try {
                        const base64Url = token.split('.')[1]
                        if (base64Url) {
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                            const payload = JSON.parse(atob(base64))
                            merchantId = payload.merchant_id || payload.user_id || payload.sub
                        }
                    } catch {}
                }

                // 3. Fetch stores for the merchant
                const storesMap = new Map()

                // Query myStore
                const storeRes = await graphqlRequest(GET_USER_STORE_QUERY).catch(() => null)
                if (storeRes?.myStore?.id) {
                    storesMap.set(storeRes.myStore.id, storeRes.myStore)
                    if (!merchantId && storeRes.myStore.merchantId) {
                        merchantId = storeRes.myStore.merchantId
                    }
                }

                // Query stores by merchantId
                if (merchantId) {
                    const merchantStoresRes = await graphqlRequest(
                        GET_MERCHANT_STORES_QUERY,
                        { merchantId, limit: 100 }
                    ).catch(() => null)

                    if (merchantStoresRes?.stores?.stores?.length > 0) {
                        merchantStoresRes.stores.stores.forEach(st => {
                            if (st && st.id) storesMap.set(st.id, st)
                        })
                    }
                }

                const loadedStores = Array.from(storesMap.values())
                setStores(loadedStores)

                if (loadedStores.length > 0) {
                    const defaultStore = loadedStores[0]
                    setActiveStore(defaultStore)
                    setFormData(prev => ({ ...prev, storeId: defaultStore.id }))
                } else {
                    setActiveStore(null)
                    setFormData(prev => ({ ...prev, storeId: '' }))
                }
            } catch (err) {
                console.error('Error fetching initial data for add-product:', err)
            } finally {
                setFetchingInitial(false)
            }
        }

        fetchInitialData()
    }, [])

    // Handler when user selects a store from dropdown
    const handleStoreSelect = (storeId) => {
        const found = stores.find(s => s.id === storeId) || null
        setActiveStore(found)
        setFormData(prev => ({ ...prev, storeId }))
    }

    // Helper: Upload a file from device (tries presigned S3 URL, falls back to base64 Data URL)
    const uploadFileFromDevice = async (file) => {
        if (!file) return null

        if (!file.type.startsWith('image/')) {
            toast.error(`${file.name} is not a valid image file`)
            return null
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error(`Image ${file.name} exceeds 10MB limit`)
            return null
        }

        // Try presigned upload via backend
        try {
            const presignRes = await graphqlRequest(GENERATE_STORE_UPLOAD_URL_MUTATION, {
                input: {
                    imageType: 'product',
                    filename: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
                    contentType: file.type || 'image/jpeg'
                }
            })

            const uploadPayload = presignRes?.generateStoreUploadUrl
            if (uploadPayload?.uploadUrl && uploadPayload?.publicUrl) {
                const putRes = await fetch(uploadPayload.uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type || 'image/jpeg' },
                    body: file
                })

                if (putRes.ok) {
                    return uploadPayload.publicUrl
                }
            }
        } catch (uploadErr) {
            // Presigned upload error or project paused; seamlessly fall back to Data URL
        }

        // Fallback: Read file as Data URL
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result || null)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(file)
        })
    }

    // Handle Primary Image upload from device
    const handleMainImageUpload = async (file) => {
        if (!file) return
        setUploadingMain(true)
        try {
            const resultUrl = await uploadFileFromDevice(file)
            if (resultUrl) {
                setFormData(prev => {
                    const currentImages = [...prev.images]
                    if (currentImages.length > 0) {
                        currentImages[0] = resultUrl
                    } else {
                        currentImages.push(resultUrl)
                    }
                    return {
                        ...prev,
                        imageUrl: resultUrl,
                        images: currentImages
                    }
                })
                toast.success('Main product image uploaded from device!')
            }
        } catch (err) {
            console.error('Failed to upload main image:', err)
            toast.error('Failed to upload image from device')
        } finally {
            setUploadingMain(false)
        }
    }

    // Handle Additional Gallery Images upload from device
    const handleGalleryImagesUpload = async (fileList) => {
        if (!fileList || fileList.length === 0) return
        const files = Array.from(fileList)

        setUploadingGallery(true)
        let successCount = 0
        try {
            const uploadedUrls = []
            for (const file of files) {
                const url = await uploadFileFromDevice(file)
                if (url) {
                    uploadedUrls.push(url)
                    successCount++
                }
            }

            if (uploadedUrls.length > 0) {
                setFormData(prev => {
                    const currentImages = [...prev.images].filter(Boolean)
                    // If main imageUrl was empty, set the first uploaded image as main
                    const primaryUrl = prev.imageUrl || uploadedUrls[0]
                    return {
                        ...prev,
                        imageUrl: primaryUrl,
                        images: [...currentImages, ...uploadedUrls]
                    }
                })
                toast.success(`Uploaded ${successCount} image${successCount > 1 ? 's' : ''} from device!`)
            }
        } catch (err) {
            console.error('Failed to upload gallery images:', err)
            toast.error('Failed to upload some gallery images')
        } finally {
            setUploadingGallery(false)
        }
    }

    // Drag and drop handlers for main image
    const handleMainDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setMainDragActive(true)
        } else if (e.type === 'dragleave') {
            setMainDragActive(false)
        }
    }

    const handleMainDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setMainDragActive(false)
        if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
            handleMainImageUpload(e.dataTransfer.files[0])
        }
    }

    // Remove an image from the list
    const handleRemoveImage = (index) => {
        const updated = formData.images.filter((_, i) => i !== index)
        setFormData(prev => ({
            ...prev,
            images: updated,
            imageUrl: updated[0] || ''
        }))
    }

    // Set an image as primary
    const handleSetPrimary = (index) => {
        const targetImage = formData.images[index]
        if (!targetImage) return
        const updated = [targetImage, ...formData.images.filter((_, i) => i !== index)]
        setFormData(prev => ({
            ...prev,
            imageUrl: targetImage,
            images: updated
        }))
        toast.success('Primary product image updated!')
    }

    // Image URL list handler
    const handleAddImageUrl = (url) => {
        if (!url || !url.trim()) return
        const trimmed = url.trim()
        setFormData(prev => ({
            ...prev,
            imageUrl: prev.imageUrl || trimmed,
            images: [...prev.images, trimmed]
        }))
    }

    // Quick fill with sample data
    const handleFillSample = () => {
        const sampleCatId = categories.length > 0
            ? categories[0].id
            : 'bf62f1a4-10f5-4822-bded-4cfd5dfc0089'

        const chosenStore = activeStore || (stores.length > 0 ? stores[0] : null)

        if (!chosenStore) {
            toast.error('You do not have a registered store yet. Please create one at /create-store first.', {
                duration: 5000,
            })
        }

        setFormData({
            storeId: chosenStore?.id || '',
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

        if (chosenStore) {
            toast.success(`Filled sample data for store "${chosenStore.name}"!`)
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
            toast.error('Please select a store from the dropdown')
            return
        }
        if (!formData.categoryId?.trim()) {
            toast.error('Category is required. Please select or enter a Category.')
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
        const validImages = formData.images.map(img => (img || '').trim()).filter(Boolean)
        const primaryImageUrl = formData.imageUrl?.trim() || validImages[0] || ''

        if (!primaryImageUrl && validImages.length === 0) {
            toast.error('Please upload at least one product image from your device or provide an image URL.')
            return
        }


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

            {stores.length === 0 && !fetchingInitial && (
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

                        {/* Store Selection Dropdown (No ID displayed) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Store <span className="text-rose-500">*</span>
                                </label>
                                <Link
                                    href="/create-store"
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                                >
                                    + Add new store
                                </Link>
                            </div>

                            <select
                                required
                                value={formData.storeId}
                                onChange={e => handleStoreSelect(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm bg-white text-slate-900 cursor-pointer font-medium"
                            >
                                <option value="">-- Choose Store --</option>
                                {stores.map(st => (
                                    <option key={st.id} value={st.id}>
                                        {st.name} {st.approvalStatus ? `(${st.approvalStatus})` : ''}
                                    </option>
                                ))}
                            </select>

                            {activeStore && (
                                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-emerald-600 shrink-0" />
                                        <span className="font-semibold text-slate-800">{activeStore.name}</span>
                                        {activeStore.slug && (
                                            <span className="text-slate-400 font-mono">@{activeStore.slug}</span>
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        activeStore.approvalStatus === 'APPROVED'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {activeStore.approvalStatus || 'Active'}
                                    </span>
                                </div>
                            )}

                            <p className="text-[11px] text-slate-500 mt-1">
                                {stores.length > 1
                                    ? `You have ${stores.length} registered stores. Select which store will sell this product.`
                                    : "Select which of your merchant stores will offer this product."}
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

                {/* 3. Media & Images Section (Upload from user device) */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="text-blue-600" size={22} />
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Product Images</h2>
                                <p className="text-xs text-slate-500">Upload high quality product photos directly from your device</p>
                            </div>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setImageInputMode('device')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                    imageInputMode === 'device'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <UploadCloud size={13} className="inline mr-1" /> Upload from Device
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageInputMode('url')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                    imageInputMode === 'url'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Tag size={13} className="inline mr-1" /> Paste URL
                            </button>
                        </div>
                    </div>

                    {/* Hidden File Inputs */}
                    <input
                        type="file"
                        ref={mainFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                            if (e.target.files?.[0]) {
                                handleMainImageUpload(e.target.files[0])
                                e.target.value = ''
                            }
                        }}
                    />
                    <input
                        type="file"
                        ref={galleryFileInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                            if (e.target.files?.length) {
                                handleGalleryImagesUpload(e.target.files)
                                e.target.value = ''
                            }
                        }}
                    />

                    {/* SECTION A: Primary Product Image */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                            Main Product Image <span className="text-rose-500">*</span>
                        </label>

                        {!formData.imageUrl ? (
                            /* Drag & Drop Upload Zone */
                            <div
                                onDragEnter={handleMainDrag}
                                onDragLeave={handleMainDrag}
                                onDragOver={handleMainDrag}
                                onDrop={handleMainDrop}
                                onClick={() => mainFileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                                    mainDragActive
                                        ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/10'
                                        : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
                                }`}
                            >
                                {uploadingMain ? (
                                    <div className="py-6 flex flex-col items-center gap-2">
                                        <Loader2 size={36} className="animate-spin text-blue-600" />
                                        <p className="text-sm font-semibold text-slate-800">Processing image from device...</p>
                                        <p className="text-xs text-slate-400">Optimizing and preparing for listing</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mb-3 shadow-sm">
                                            <UploadCloud size={28} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800">
                                            Click to browse or drag and drop image here
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                            Upload your primary product photo directly from your computer or phone.
                                        </p>
                                        <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 transition">
                                            <Upload size={14} /> Choose Image from Device
                                        </span>
                                        <p className="text-[11px] text-slate-400 mt-2">
                                            Supported: PNG, JPG, JPEG, WEBP (Max 10MB)
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            /* Primary Image Preview Card */
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-24 h-24 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-sm">
                                        <img
                                            src={formData.imageUrl}
                                            alt="Main Product Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=Preview+Error' }}
                                        />
                                    </div>
                                    <div className="space-y-1 text-left flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                Primary Photo
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Check size={12} className="text-emerald-600" /> Ready
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 truncate max-w-xs font-mono">
                                            {formData.imageUrl.startsWith('data:') ? 'Image uploaded from user device' : formData.imageUrl}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Displayed as main storefront thumbnail
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        disabled={uploadingMain}
                                        onClick={() => mainFileInputRef.current?.click()}
                                        className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
                                    >
                                        {uploadingMain ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                        Replace Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                imageUrl: '',
                                                images: prev.images.filter((_, idx) => idx !== 0)
                                            }))
                                        }}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION B: Additional Gallery Images */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                                    Additional Gallery Photos
                                </label>
                                <p className="text-xs text-slate-400">
                                    Add multiple photos from your device to showcase angles, features, and packaging.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={uploadingGallery}
                                    onClick={() => galleryFileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {uploadingGallery ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <ImagePlus size={14} />
                                    )}
                                    <span>Upload Photos from Device</span>
                                </button>
                            </div>
                        </div>

                        {/* Gallery Thumbnails Grid */}
                        {formData.images.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {formData.images.map((imgUrl, index) => {
                                    const isPrimary = formData.imageUrl === imgUrl || index === 0
                                    return (
                                        <div
                                            key={index}
                                            className={`relative group rounded-xl border overflow-hidden aspect-square bg-slate-50 flex items-center justify-center transition-all ${
                                                isPrimary
                                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`Gallery photo ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200?text=Preview' }}
                                            />

                                            {/* Badges & Actions Overlay */}
                                            {isPrimary && (
                                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-600 text-white shadow-sm">
                                                    Primary
                                                </span>
                                            )}

                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                                {!isPrimary && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetPrimary(index)}
                                                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 text-[10px] font-bold rounded-lg shadow-sm transition active:scale-95"
                                                    >
                                                        Set Primary
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition active:scale-95"
                                                    title="Remove Image"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Add more tile */}
                                <button
                                    type="button"
                                    onClick={() => galleryFileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl aspect-square flex flex-col items-center justify-center p-2 text-slate-400 hover:text-blue-600 transition cursor-pointer bg-slate-50/50 hover:bg-slate-50"
                                >
                                    <Plus size={20} className="mb-1" />
                                    <span className="text-[11px] font-semibold text-center">Add Photo</span>
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => galleryFileInputRef.current?.click()}
                                className="border border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:bg-slate-50 transition"
                            >
                                <p className="text-xs text-slate-500">
                                    No gallery images uploaded yet. Click to select additional photos from your device.
                                </p>
                            </div>
                        )}

                        {/* Optional URL input toggle */}
                        {imageInputMode === 'url' && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                                <label className="text-xs font-semibold text-slate-700 block">
                                    Or Add Image via Public URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        id="manualImageUrlInput"
                                        placeholder="https://example.com/product-image.jpg"
                                        className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddImageUrl(e.currentTarget.value)
                                                e.currentTarget.value = ''
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const inputEl = document.getElementById('manualImageUrlInput')
                                            if (inputEl?.value) {
                                                handleAddImageUrl(inputEl.value)
                                                inputEl.value = ''
                                            }
                                        }}
                                        className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                                    >
                                        Add URL
                                    </button>
                                </div>
                            </div>
                        )}
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