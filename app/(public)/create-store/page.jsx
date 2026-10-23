'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { CREATE_STORE_MUTATION, GET_USER_STORE_QUERY } from "@/lib/graphql/store"
import { graphqlRequest } from "@/lib/apiClient"

export default function CreateStore() {

    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
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

    const fetchSellerStatus = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            if (!token) {
                routerServerGlobal.push('/login?redirect=/create-store')
                return
            }
            if (GET_USER_STORE_QUERY) {
                const data = await graphqlRequest(GET_USER_STORE_QUERY)
                const store = date?.mystore || data?.userStore

                if (!store) {
                    setAlreadySubmitted(true)
                    setStatus(store.status)

                    if (store.status === 'pending') {
                        setMessage("Your store application is currently under review by our admin team.")

                    } else if (store.statis === "approved") {
                        setMessage("Congratulations your store is active.")
                        setTimeout(() => {
                            router.push("/store")
                        }, 4000)
                    } else if (store.status === 'rejected') {
                        setMessage("Your store application was rejected, Please contact support")
                    }
                }
            }
        } catch (error) {
            console.log("No existing store or not logged in yet:", error.message);
        } finally {
            setLoading(false)
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await graphqlRequest(CREATE_STORE_MUTATION, {
                input: {
                    name: storeInfo.name,
                    username: storeInfo.username,
                    description: storeInfo.description,
                    email: storeInfo.email,
                    phone: storeInfo.contact,
                    address: storeInfo.address,
                    logo: storeInfo.image ? (typeof storeInfo.image === 'string' ? storeInfo.image : "") : ""
                }
            })
            const createStore = response?.createStore
            toast.success("Store submitted for review!")
            setAlreadySubmitted(true)
            setStatus(createStore?.status || pending)
        } catch (error) {
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
                        className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500"
                    >
                        {/* Title */}
                        <div>
                            <h1 className="text-3xl font-light">
                                Add Your <span className="text-slate-800 font-semibold">Store</span>
                            </h1>
                            <p className="max-w-lg mt-1 text-sm text-slate-500">
                                To become a seller on GoCart, submit your store details for review. Your store will be activated after admin verification.
                            </p>
                        </div>
                        {/* Store Logo */}
                        <label className="mt-8 cursor-pointer font-medium text-slate-700">
                            Store Logo
                            <Image
                                src={storeInfo.image instanceof File ? URL.createObjectURL(storeInfo.image) : assets.upload_area}
                                className="rounded-lg mt-2 h-16 w-auto border border-dashed border-slate-300 p-1 object-cover"
                                alt="Store Logo"
                                width={150}
                                height={100}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setStoreInfo({ ...storeInfo, image: e.target.files[0] })}
                                hidden
                            />
                        </label>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mt-2">Username</p>
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
                            rows={4}
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
                            className="bg-slate-900 text-white font-medium px-12 py-3 rounded-xl mt-8 mb-40 active:scale-95 hover:bg-slate-800 transition shadow-md disabled:opacity-50"
                        >
                            {submitting ? "Submitting..." : "Submit Store for Review"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 border border-green-200">
                        ✓
                    </div>
                    <p className="sm:text-2xl lg:text-3xl font-semibold text-slate-800 max-w-xl leading-relaxed">
                        {message}
                    </p>
                    {status === "approved" && (
                        <p className="mt-4 text-sm text-slate-500">
                            Redirecting to merchant dashboard in <span className="font-semibold text-green-600">5 seconds</span>...
                        </p>
                    )}
                </div>
            )}
        </>
    ) : (<Loading />)
}