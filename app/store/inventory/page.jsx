'use client'

import { useEffect, useState, useMemo } from "react"
import { toast } from "react-hot-toast"
import Link from "next/link"
import Image from "next/image"
import {
    Boxes,
    Package,
    RefreshCw,
    Search,
    AlertTriangle,
    ArrowUpRight,
    PlusCircle,
    CheckCircle2,
    SlidersHorizontal,
    Plus,
    X,
    Clock,
    Lock,
    ShieldCheck,
    Layers
} from "lucide-react"
import Loading from "@/components/Loading"
import { graphqlRequest } from "@/lib/apiClient"
import { GET_PRODUCTS_QUERY } from "@/lib/graphql/product"
import {
    GET_INVENTORY_QUERY,
    CREATE_INVENTORY_MUTATION,
    UPDATE_STOCK_MUTATION,
    RESTOCK_INVENTORY_MUTATION
} from "@/lib/graphql/inventory"
import { useStore } from "@/components/store/StoreLayout"
import { assets } from "@/assets/assets"

export default function StoreInventoryPage() {
    const { storeInfo } = useStore()

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [products, setProducts] = useState([])
    const [inventoryMap, setInventoryMap] = useState({}) // key: productId or `${productId}_${variantId}`
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL") // "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNINITIALIZED"

    // Modal State
    const [restockModalItem, setRestockModalItem] = useState(null)
    const [restockQuantity, setRestockQuantity] = useState(10)
    const [restockNotes, setRestockNotes] = useState("Standard merchant restock")
    const [restockReferenceId, setRestockReferenceId] = useState("")
    const [isRestocking, setIsRestocking] = useState(false)

    // Adjust Stock Modal State
    const [adjustModalItem, setAdjustModalItem] = useState(null)
    const [adjustQuantity, setAdjustQuantity] = useState(0)
    const [isAdjusting, setIsAdjusting] = useState(false)

    // Load products and their inventory records
    const fetchInventoryData = async () => {
        if (!storeInfo?.id) {
            setLoading(false)
            setRefreshing(false)
            return
        }

        try {
            // 1. Fetch store products
            const prodRes = await graphqlRequest(GET_PRODUCTS_QUERY, {
                storeId: storeInfo.id,
                limit: 100
            })

            const activeProducts = (prodRes?.products?.products || []).filter(p => !p.deletedAt)
            setProducts(activeProducts)

            // 2. Fetch inventory records for products
            const newInvMap = {}

            await Promise.allSettled(
                activeProducts.map(async (prod) => {
                    // Fetch for main product
                    try {
                        const invData = await graphqlRequest(GET_INVENTORY_QUERY, {
                            productId: prod.id
                        })
                        if (invData?.inventory) {
                            newInvMap[prod.id] = invData.inventory
                        }
                    } catch {
                        // Inventory record might not yet be initialized in inventory-service
                    }

                    // If product has variants, also fetch variant inventories
                    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
                        for (const variant of prod.variants) {
                            try {
                                const varInvData = await graphqlRequest(GET_INVENTORY_QUERY, {
                                    productId: prod.id,
                                    variantId: variant.id
                                })
                                if (varInvData?.inventory) {
                                    newInvMap[`${prod.id}_${variant.id}`] = varInvData.inventory
                                }
                            } catch {}
                        }
                    }
                })
            )

            setInventoryMap(newInvMap)
        } catch (err) {
            console.error("Failed to load inventory:", err)
            toast.error("Failed to load store inventory")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchInventoryData()
    }, [storeInfo?.id])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchInventoryData()
    }

    // Initialize inventory for an uninitialized product/variant
    const handleInitializeInventory = async (product, variant = null) => {
        const key = variant ? `${product.id}_${variant.id}` : product.id
        const toastId = toast.loading(`Initializing inventory for ${product.name}...`)

        try {
            const input = {
                productId: product.id,
                variantId: variant?.id || null,
                sku: variant?.sku || product.sku || `SKU-${Date.now().toString().slice(-6)}`,
                initialQuantity: variant?.stock ?? (typeof product.stock === 'number' ? product.stock : 10),
                lowStockThreshold: 5
            }

            const res = await graphqlRequest(CREATE_INVENTORY_MUTATION, { input })
            if (res?.createInventory) {
                setInventoryMap(prev => ({
                    ...prev,
                    [key]: res.createInventory
                }))
                toast.success(`Inventory initialized with ${input.initialQuantity} units!`, { id: toastId })
            } else {
                throw new Error("Empty response from inventory service")
            }
        } catch (err) {
            console.error("Failed to initialize inventory:", err)
            toast.error(err.message || "Failed to initialize inventory", { id: toastId })
        }
    }

    // Restock Inventory
    const submitRestock = async () => {
        if (!restockModalItem || restockQuantity <= 0) {
            toast.error("Please enter a valid restock quantity greater than 0")
            return
        }

        setIsRestocking(true)
        const toastId = toast.loading("Restocking inventory...")

        try {
            const { product, variant, inv } = restockModalItem
            const key = variant ? `${product.id}_${variant.id}` : product.id

            const input = {
                inventoryId: inv?.inventoryId || undefined,
                productId: product.id,
                variantId: variant?.id || undefined,
                quantity: parseInt(restockQuantity, 10),
                notes: restockNotes.trim() || "Merchant manual restock",
                referenceId: restockReferenceId.trim() || `RESTOCK-${Date.now().toString().slice(-6)}`
            }

            const res = await graphqlRequest(RESTOCK_INVENTORY_MUTATION, { input })

            if (res?.restockInventory?.success && res.restockInventory.inventory) {
                setInventoryMap(prev => ({
                    ...prev,
                    [key]: res.restockInventory.inventory
                }))
                toast.success(`Successfully added ${restockQuantity} units to stock!`, { id: toastId })
                setRestockModalItem(null)
            } else {
                throw new Error("Restock returned unsuccessful response")
            }
        } catch (err) {
            console.error("Failed to restock:", err)
            toast.error(err.message || "Restock failed", { id: toastId })
        } finally {
            setIsRestocking(false)
        }
    }

    // Directly Update/Set Stock count
    const submitAdjustStock = async () => {
        if (!adjustModalItem || adjustQuantity < 0) {
            toast.error("Stock quantity cannot be negative")
            return
        }

        setIsAdjusting(true)
        const toastId = toast.loading("Updating stock level...")

        try {
            const { product, variant, inv } = adjustModalItem
            const key = variant ? `${product.id}_${variant.id}` : product.id

            const res = await graphqlRequest(UPDATE_STOCK_MUTATION, {
                inventoryId: inv?.inventoryId || undefined,
                productId: product.id,
                variantId: variant?.id || undefined,
                quantity: parseInt(adjustQuantity, 10)
            })

            if (res?.updateStock) {
                setInventoryMap(prev => {
                    const current = prev[key] || {}
                    return {
                        ...prev,
                        [key]: {
                            ...current,
                            availableQuantity: res.updateStock.availableQuantity,
                            reservedQuantity: res.updateStock.reservedQuantity,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })
                toast.success(`Stock level updated to ${adjustQuantity} units!`, { id: toastId })
                setAdjustModalItem(null)
            } else {
                throw new Error("Update stock failed")
            }
        } catch (err) {
            console.error("Failed to adjust stock:", err)
            toast.error(err.message || "Failed to update stock", { id: toastId })
        } finally {
            setIsAdjusting(false)
        }
    }

    // Flatten items for listing: each product and its variants
    const allInventoryRows = useMemo(() => {
        const rows = []
        for (const prod of products) {
            const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0

            if (hasVariants) {
                for (const variant of prod.variants) {
                    const key = `${prod.id}_${variant.id}`
                    const inv = inventoryMap[key] || null
                    rows.push({
                        key,
                        product: prod,
                        variant,
                        sku: variant.sku || prod.sku,
                        name: `${prod.name} (${variant.name})`,
                        inv
                    })
                }
            } else {
                const key = prod.id
                const inv = inventoryMap[key] || null
                rows.push({
                    key,
                    product: prod,
                    variant: null,
                    sku: prod.sku,
                    name: prod.name,
                    inv
                })
            }
        }
        return rows
    }, [products, inventoryMap])

    // Compute aggregate metrics
    const metrics = useMemo(() => {
        let totalTracked = allInventoryRows.length
        let totalAvailable = 0
        let totalReserved = 0
        let lowStockCount = 0
        let outOfStockCount = 0
        let uninitializedCount = 0

        for (const row of allInventoryRows) {
            if (!row.inv) {
                uninitializedCount++
                continue
            }
            const avail = row.inv.availableQuantity || 0
            const reserved = row.inv.reservedQuantity || 0
            const threshold = row.inv.lowStockThreshold || 5

            totalAvailable += avail
            totalReserved += reserved

            if (avail === 0) {
                outOfStockCount++
            } else if (avail <= threshold) {
                lowStockCount++
            }
        }

        return {
            totalTracked,
            totalAvailable,
            totalReserved,
            lowStockCount,
            outOfStockCount,
            uninitializedCount
        }
    }, [allInventoryRows])

    // Filtered rows
    const filteredRows = useMemo(() => {
        return allInventoryRows.filter(row => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchesName = row.name.toLowerCase().includes(q)
                const matchesSku = (row.sku || "").toLowerCase().includes(q)
                if (!matchesName && !matchesSku) return false
            }

            // Status filter
            if (statusFilter === "ALL") return true
            if (statusFilter === "UNINITIALIZED") return !row.inv
            if (!row.inv) return false

            const avail = row.inv.availableQuantity || 0
            const threshold = row.inv.lowStockThreshold || 5

            if (statusFilter === "OUT_OF_STOCK") return avail === 0
            if (statusFilter === "LOW_STOCK") return avail > 0 && avail <= threshold
            if (statusFilter === "IN_STOCK") return avail > threshold

            return true
        })
    }, [allInventoryRows, searchQuery, statusFilter])

    if (loading) {
        return (
            <Loading
                variant="merchant"
                title="Loading Inventory Service"
                subtitle="Retrieving real-time SKU inventory, warehouse stocks & reservations..."
            />
        )
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Boxes className="text-emerald-600 size-7" /> Real-time Inventory Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Authoritative SKU-level stock, warehouse tracking, and automatic reservation management.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-98 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin text-emerald-600" : ""} />
                        Refresh
                    </button>
                    <Link
                        href="/store/add-product"
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 active:scale-98 transition shadow-xs cursor-pointer"
                    >
                        <Plus size={14} /> Add Product
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Available Stock</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <Package size={18} />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {metrics.totalAvailable.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Across all tracked products</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Reserved in Orders</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <Lock size={18} />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {metrics.totalReserved.toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-600 font-medium mt-1">Active checkout holds</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Warnings</span>
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-rose-600">
                        {metrics.lowStockCount}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">At or below threshold</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Tracked Catalog</span>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <Layers size={18} />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {metrics.totalTracked}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Total active SKUs</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                        { id: "ALL", label: "All Items" },
                        { id: "IN_STOCK", label: "In Stock" },
                        { id: "LOW_STOCK", label: `Low Stock (${metrics.lowStockCount})` },
                        { id: "OUT_OF_STOCK", label: `Out of Stock (${metrics.outOfStockCount})` },
                        { id: "UNINITIALIZED", label: `Unlinked (${metrics.uninitializedCount})` }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                                statusFilter === tab.id
                                    ? "bg-slate-900 text-white shadow-2xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-5 py-3.5">Product & SKU</th>
                                <th className="px-4 py-3.5 text-center">Status</th>
                                <th className="px-4 py-3.5 text-right">Available Stock</th>
                                <th className="px-4 py-3.5 text-right">Reserved</th>
                                <th className="px-4 py-3.5 text-right">Threshold</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                        <Package size={36} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                        <p className="font-medium text-slate-600">No inventory records found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or status filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => {
                                    const { key, product, variant, sku, name, inv } = row
                                    const available = inv ? inv.availableQuantity : null
                                    const reserved = inv ? inv.reservedQuantity : 0
                                    const threshold = inv ? inv.lowStockThreshold : 5

                                    const isOut = available !== null && available === 0
                                    const isLow = available !== null && available > 0 && available <= threshold
                                    const isHealthy = available !== null && available > threshold

                                    return (
                                        <tr key={key} className="hover:bg-slate-50/70 transition">
                                            {/* Product Info */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                        <Image
                                                            src={product.imageUrl || product.images?.[0] || assets.product_img1}
                                                            alt={name}
                                                            width={44}
                                                            height={44}
                                                            className="object-contain size-full p-1"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 text-xs truncate max-w-xs" title={name}>
                                                            {name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                SKU: {sku || "N/A"}
                                                            </span>
                                                            {variant && (
                                                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-100">
                                                                    Variant
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-3.5 text-center">
                                                {!inv ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        Not Initialized
                                                    </span>
                                                ) : isOut ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                        Out of Stock
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>

                                            {/* Available Quantity */}
                                            <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                                                {inv !== null ? (
                                                    <span className={isOut ? "text-rose-600 font-bold" : isLow ? "text-amber-600 font-bold" : "text-emerald-700"}>
                                                        {available}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-normal italic">—</span>
                                                )}
                                            </td>

                                            {/* Reserved Quantity */}
                                            <td className="px-4 py-3.5 text-right text-slate-600">
                                                {reserved > 0 ? (
                                                    <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                                        {reserved}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>

                                            {/* Low Stock Threshold */}
                                            <td className="px-4 py-3.5 text-right text-slate-500 font-mono">
                                                {inv ? threshold : "5"}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                {!inv ? (
                                                    <button
                                                        onClick={() => handleInitializeInventory(product, variant)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-2xs active:scale-98 transition cursor-pointer"
                                                    >
                                                        <PlusCircle size={13} /> Link Service
                                                    </button>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setRestockModalItem({ product, variant, inv })
                                                                setRestockQuantity(10)
                                                                setRestockNotes("Standard restock")
                                                                setRestockReferenceId(`RESTOCK-${Date.now().toString().slice(-6)}`)
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg active:scale-98 transition cursor-pointer"
                                                        >
                                                            Restock
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setAdjustModalItem({ product, variant, inv })
                                                                setAdjustQuantity(inv.availableQuantity || 0)
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg active:scale-98 transition cursor-pointer"
                                                        >
                                                            Set Count
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Restock Modal */}
            {restockModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <PlusCircle className="text-emerald-600 size-5" /> Restock Inventory
                            </h3>
                            <button
                                onClick={() => setRestockModalItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">Product</p>
                            <p className="text-sm font-semibold text-slate-800">{restockModalItem.product.name}</p>
                            {restockModalItem.variant && (
                                <p className="text-xs text-emerald-600 font-medium">Variant: {restockModalItem.variant.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Additional Units to Add <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={restockQuantity}
                                onChange={(e) => setRestockQuantity(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Restock Notes</label>
                            <input
                                type="text"
                                value={restockNotes}
                                onChange={(e) => setRestockNotes(e.target.value)}
                                placeholder="e.g., Weekly supplier batch"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / PO #</label>
                            <input
                                type="text"
                                value={restockReferenceId}
                                onChange={(e) => setRestockReferenceId(e.target.value)}
                                placeholder="Optional PO or Batch ID"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setRestockModalItem(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isRestocking}
                                onClick={submitRestock}
                                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs active:scale-98 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isRestocking ? "Restocking..." : "Confirm Restock"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Stock / Adjust Modal */}
            {adjustModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <SlidersHorizontal className="text-slate-800 size-5" /> Set Authoritative Stock
                            </h3>
                            <button
                                onClick={() => setAdjustModalItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">Product</p>
                            <p className="text-sm font-semibold text-slate-800">{adjustModalItem.product.name}</p>
                            {adjustModalItem.variant && (
                                <p className="text-xs text-emerald-600 font-medium">Variant: {adjustModalItem.variant.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Exact Available Quantity <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={adjustQuantity}
                                onChange={(e) => setAdjustQuantity(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 outline-none"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                                Directly sets available stock in inventory-service.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setAdjustModalItem(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isAdjusting}
                                onClick={submitAdjustStock}
                                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs active:scale-98 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isAdjusting ? "Updating..." : "Save Stock Level"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
