'use client'

import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useSelector } from "react-redux"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import {
    CREATE_STORE_MUTATION,
    GET_USER_STORE_QUERY,
    SUBMIT_STORE_MUTATION
} from "@/lib/graphql/store"
import { graphqlRequest } from "@/lib/apiClient"
import DraftStoreReviewCard from "@/components/store/DraftStoreReviewCard"
import {
    Store as StoreIcon,
    Send,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    ArrowRight,
    Settings,
    LayoutDashboard,
    Sparkles,
    Wand2,
    RotateCcw
} from "lucide-react"

const SMART_PRESETS = [
    {
        label: "Tech & Audio",
        icon: "💻",
        data: {
            name: "Apex Audio & Tech Hub",
            username: "apex-tech-hub",
            description: "Authorized seller of high-performance wireless audio, studio monitors, computing peripherals, and modern tech accessories.",
            email: "contact@apextech.local",
            contact: "+1 (555) 382-9104",
            address: "742 Evergreen Terrace, Suite 400, Springfield, OR 97477",
            image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&auto=format&fit=crop&q=80"
        }
    },
    {
        label: "Fashion & Apparel",
        icon: "👕",
        data: {
            name: "Nordic Threads & Co.",
            username: "nordic-threads",
            description: "Modern Scandinavian lifestyle brand crafting minimalist streetwear, sustainable organic cotton apparel, and handcrafted accessories.",
            email: "hello@nordicthreads.local",
            contact: "+1 (555) 749-2184",
            address: "108 Mercer Street, Soho Design District, New York, NY 10012",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80"
        }
    },
    {
        label: "Home & Living",
        icon: "🌿",
        data: {
            name: "EcoNest Home Essentials",
            username: "econest-living",
            description: "Curated eco-friendly home decor, artisan ceramics, organic kitchenware, and zero-waste everyday essentials.",
            email: "support@econesthome.local",
            contact: "+1 (555) 612-8943",
            address: "452 Pine Valley Boulevard, Suite 12B, Boulder, CO 80302",
            image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80"
        }
    }
]

export default function CreateStore() {
    const router = useRouter()
    const user = useSelector((state) => state.auth?.user)

    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [existingStore, setExistingStore] = useState(null)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState("")

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        image: ""
    })

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const handleSmartFill = (presetIndex = 0) => {
        const preset = SMART_PRESETS[presetIndex] || SMART_PRESETS[0]
        const businessEmail = user?.email || preset.data.email
        setStoreInfo({
            ...preset.data,
            email: businessEmail
        })
        toast.success(`Smart filled with "${preset.label}" details!`, {
            icon: '✨'
        })
    }

    const handleClearForm = () => {
        setStoreInfo({
            name: "",
            username: "",
            description: "",
            email: "",
            contact: "",
            address: "",
            image: ""
        })
        toast("Form fields cleared", { icon: "🧹" })
    }

    const fetchSellerStatus = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            if (!token) {
                router.push('/login?redirect=/create-store')
                return
            }

            const data = await graphqlRequest(GET_USER_STORE_QUERY).catch(() => null)
            let store = data?.myStore

            // Fallback: If myStore did not return a store, query stores by merchantId from decoded token
            if (!store || !store.id) {
                try {
                    const base64Url = token.split('.')[1]
                    if (base64Url) {
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                        const payload = JSON.parse(atob(base64))
                        const merchantId = payload.merchant_id || payload.user_id || payload.sub
                        if (merchantId) {
                            const fallbackRes = await graphqlRequest(
                                `query GetStoresByMerchant($merchantId: ID) {
                                    stores(merchantId: $merchantId, limit: 1) {
                                        stores {
                                            id
                                            merchantId
                                            name
                                            slug
                                            approvalStatus
                                            rejectionReason
                                            businessEmail
                                            businessPhone
                                            description
                                            logoUrl
                                            address
                                            isVacationMode
                                            isPublished
                                            kycStatus
                                            gstin
                                            avgStoreRating
                                            createdAt
                                            updatedAt
                                        }
                                    }
                                }`,
                                { merchantId }
                            ).catch(() => null)

                            const fallbackStore = fallbackRes?.stores?.stores?.[0]
                            if (fallbackStore) {
                                store = fallbackStore
                            }
                        }
                    }
                } catch (fallbackErr) {
                    console.warn("Fallback query stores error in create-store:", fallbackErr)
                }
            }

            if (store) {
                setAlreadySubmitted(true)
                setExistingStore(store)
                const currentStatus = store.approvalStatus || store.status || 'DRAFT'
                setStatus(currentStatus)

                if (currentStatus === 'DRAFT' || currentStatus === 'draft') {
                    setMessage("Your store is currently saved as DRAFT. Please submit your application so our admin team can review and approve it.")
                } else if (currentStatus === 'PENDING' || currentStatus === 'pending') {
                    setMessage("Your store application is currently under review by our admin team.")
                } else if (currentStatus === 'APPROVED' || currentStatus === 'approved') {
                    setMessage("Congratulations, your store is approved and active!")
                } else if (currentStatus === 'REJECTED' || currentStatus === 'rejected') {
                    setMessage(`Your store application was rejected: ${store.rejectionReason || "Please review your details and re-submit."}`)
                } else {
                    setMessage(`Your store status: ${currentStatus}`)
                }
            }
        } catch (error) {
            console.log("No existing store or not logged in yet:", error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitDraftStore = async (storeId) => {
        const idToSubmit = storeId || existingStore?.id
        if (!idToSubmit) return

        setSubmitting(true)
        try {
            const res = await graphqlRequest(SUBMIT_STORE_MUTATION, { id: idToSubmit })
            const updatedApproval = res?.submitStore?.approvalStatus || 'PENDING'
            setStatus(updatedApproval)
            if (existingStore) {
                setExistingStore({ ...existingStore, approvalStatus: updatedApproval })
            }
            setMessage("Your store application has been submitted for review! Our admin team can now review and approve it.")
            toast.success("Store submitted for admin review successfully!")
        } catch (error) {
            console.error('Failed to submit draft store:', error)
            toast.error(error.message || "Failed to submit store for review")
        } finally {
            setSubmitting(false)
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const cleanSlug = (storeInfo.username || storeInfo.name)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')

            const response = await graphqlRequest(CREATE_STORE_MUTATION, {
                input: {
                    name: storeInfo.name.trim(),
                    slug: cleanSlug,
                    description: storeInfo.description.trim(),
                    businessEmail: storeInfo.email.trim(),
                    businessPhone: storeInfo.contact.trim(),
                    address: storeInfo.address.trim(),
                    logoUrl: typeof storeInfo.image === 'string' ? storeInfo.image : "",
                }
            })

            const createdStore = response?.createStore
            if (!createdStore?.id) {
                throw new Error("Store creation did not return a valid store record")
            }

            setExistingStore(createdStore)
            setAlreadySubmitted(true)

            // Submit store for admin review immediately so it doesn't get stuck in DRAFT
            try {
                const submitRes = await graphqlRequest(SUBMIT_STORE_MUTATION, { id: createdStore.id })
                const finalApproval = submitRes?.submitStore?.approvalStatus || 'PENDING'
                setStatus(finalApproval)
                setMessage("Your store application has been submitted and is currently under review by our admin team.")
                toast.success("Store created and submitted for admin review!")
            } catch (subErr) {
                console.warn("Auto-submit encountered error:", subErr)
                setStatus('DRAFT')
                setMessage("Your store was created as a DRAFT. Please click 'Submit for Review' below so administrators can approve it.")
                toast.success("Store created as draft. Please submit for review!")
            }
        } catch (error) {
            console.error('Failed to create store:', error)
            toast.error(error.message || "Failed to submit store")
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        fetchSellerStatus()
    }, [])

    return !loading ? (
        <>
            {!alreadySubmitted ? (
                <div className="mx-6 min-h-[70vh] my-16">
                    <form
                        onSubmit={onSubmitHandler}
                        className="max-w-4xl mx-auto flex flex-col items-start gap-5 text-slate-500 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
                    >
                        {/* Title & Smart Fill Trigger */}
                        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div>
                                <h1 className="text-3xl font-light text-slate-700">
                                    Add Your <span className="text-slate-900 font-semibold">Store</span>
                                </h1>
                                <p className="max-w-lg mt-1 text-sm text-slate-500">
                                    Submit your store details to become a verified seller on GoCart.
                                </p>
                            </div>

                            {/* Smart Fill Header Action */}
                            <div className="flex items-center gap-2 self-start sm:self-center">
                                <button
                                    type="button"
                                    onClick={() => handleSmartFill(0)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition shadow-sm active:scale-95"
                                    title="Auto-fill form with realistic demo store data"
                                >
                                    <Sparkles size={15} className="text-emerald-600" />
                                    Smart Fill
                                </button>
                                {(storeInfo.name || storeInfo.username || storeInfo.description) && (
                                    <button
                                        type="button"
                                        onClick={handleClearForm}
                                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                                        title="Clear all fields"
                                    >
                                        <RotateCcw size={13} />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Presets Bar */}
                        <div className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <Wand2 size={15} className="text-emerald-600" />
                                <span>Smart Fill Presets:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {SMART_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSmartFill(idx)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 ${
                                            storeInfo.name === preset.data.name
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span>{preset.icon}</span>
                                        <span>{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Store Logo */}
                        <label className="cursor-pointer font-medium text-slate-700 block w-full">
                            Store Logo
                            <div className="flex items-center gap-4 mt-2">
                                <div className="relative h-16 w-24 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden p-1">
                                    {storeInfo.image instanceof File ? (
                                        <Image
                                            src={URL.createObjectURL(storeInfo.image)}
                                            className="w-full h-full object-cover rounded-lg"
                                            alt="Store Logo"
                                            width={100}
                                            height={64}
                                        />
                                    ) : (typeof storeInfo.image === 'string' && storeInfo.image) ? (
                                        <img
                                            src={storeInfo.image}
                                            className="w-full h-full object-cover rounded-lg"
                                            alt="Store Logo"
                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                        />
                                    ) : (
                                        <Image
                                            src={assets.upload_area}
                                            className="h-10 w-auto opacity-60"
                                            alt="Upload Logo"
                                            width={50}
                                            height={50}
                                        />
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">
                                    <span className="font-semibold text-slate-700">Click to upload custom logo</span>
                                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or auto-selected via Smart Fill</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setStoreInfo({ ...storeInfo, image: e.target.files[0] })}
                                hidden
                            />
                        </label>

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-2">Store Slug / Username</p>
                        <input
                            name="username"
                            onChange={onChangeHandler}
                            value={storeInfo.username}
                            type="text"
                            placeholder="e.g. tech-hub"
                            required
                            className="border border-slate-300 outline-slate-800 w-full max-w-lg p-2.5 rounded-lg text-slate-800 text-sm"
                        />

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-2">Store Name</p>
                        <input
                            name="name"
                            onChange={onChangeHandler}
                            value={storeInfo.name}
                            type="text"
                            placeholder="e.g. Tech Hub Electronics"
                            required
                            className="border border-slate-300 outline-slate-800 w-full max-w-lg p-2.5 rounded-lg text-slate-800 text-sm"
                        />

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-2">Description</p>
                        <textarea
                            name="description"
                            onChange={onChangeHandler}
                            value={storeInfo.description}
                            rows={3}
                            placeholder="Briefly describe what your store sells..."
                            required
                            className="border border-slate-300 outline-slate-800 w-full max-w-lg p-2.5 rounded-lg resize-none text-slate-800 text-sm"
                        />

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-2">Business Email</p>
                        <input
                            name="email"
                            onChange={onChangeHandler}
                            value={storeInfo.email}
                            type="email"
                            placeholder="store@example.com"
                            required
                            className="border border-slate-300 outline-slate-800 w-full max-w-lg p-2.5 rounded-lg text-slate-800 text-sm"
                        />

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-2">Contact Number</p>
                        <input
                            name="contact"
                            onChange={onChangeHandler}
                            value={storeInfo.contact}
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            required
                            className="border border-slate-300 outline-slate-800 w-full max-w-lg p-2.5 rounded-lg text-slate-800 text-sm"
                        />

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-2">Address</p>
                        <textarea
                            name="address"
                            onChange={onChangeHandler}
                            value={storeInfo.address}
                            rows={3}
                            placeholder="Store physical or warehouse address"
                            required
                            className="border border-slate-300 outline-slate-800 w-full max-w-lg p-2.5 rounded-lg resize-none text-slate-800 text-sm"
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-slate-900 text-white font-medium px-10 py-3 rounded-xl mt-6 active:scale-95 hover:bg-slate-800 transition shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? "Submitting..." : (
                                <>
                                    <Send size={16} /> Submit Store for Review
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (status === 'DRAFT' || status === 'draft') ? (
                <div className="max-w-4xl mx-auto my-12 px-4 space-y-6">
                    <div className="text-center space-y-2 mb-4">
                        <h1 className="text-3xl font-light text-slate-700">
                            Review Your <span className="text-slate-900 font-semibold">Store Application</span>
                        </h1>
                        <p className="text-sm text-slate-500 max-w-lg mx-auto">
                            Your store details have been saved as a draft. Review your business details below to ensure everything is correct, then submit your application for administrator approval.
                        </p>
                    </div>

                    <DraftStoreReviewCard
                        store={existingStore}
                        showEditLink={true}
                        onSubmitted={(newApproval, updatedStore) => {
                            setStatus(newApproval)
                            setExistingStore(updatedStore || { ...existingStore, approvalStatus: newApproval })
                            setMessage("Your store application is currently under review by our admin team.")
                        }}
                    />

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                            href="/store"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition active:scale-95"
                        >
                            <LayoutDashboard size={15} /> Open Seller Dashboard
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-16">
                    <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg text-center space-y-6">
                        {/* Status Icon */}
                        <div className="flex justify-center">
                            {(status === 'APPROVED' || status === 'approved') ? (
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                                    <CheckCircle2 size={32} />
                                </div>
                            ) : (status === 'REJECTED' || status === 'rejected') ? (
                                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-200">
                                    <XCircle size={32} />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-200">
                                    <Clock size={32} />
                                </div>
                            )}
                        </div>

                        {/* Store Status Badge */}
                        <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                (status === 'APPROVED' || status === 'approved')
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : (status === 'REJECTED' || status === 'rejected')
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                                Status: {status || 'PENDING'}
                            </span>
                        </div>

                        {/* Title and Message */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {existingStore?.name || "Your Store"}
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                                {message}
                            </p>
                        </div>

                        {/* Action buttons based on status */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
                            <Link
                                href="/store"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition active:scale-95"
                            >
                                <LayoutDashboard size={16} /> Open Seller Dashboard
                            </Link>

                            <Link
                                href="/store/settings"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition active:scale-95"
                            >
                                <Settings size={16} /> Edit Store Details
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    ) : (<Loading />)
}