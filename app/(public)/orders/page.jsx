'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";
import { useSelector } from "react-redux";
import { graphqlRequest } from "@/lib/apiClient";
import { LIST_MY_ORDERS_QUERY } from "@/lib/graphql/order";
import { promptLoginModal } from "@/components/AuthModalContext";
import { Loader2, PackageOpen, ShoppingBag, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const { isAuthenticated } = useSelector(state => state.auth);

    const fetchOrders = async () => {
        if (!isAuthenticated) {
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await graphqlRequest(LIST_MY_ORDERS_QUERY, { limit: 50, offset: 0 });
            const fetchedOrders = res?.listMyOrders?.orders;
            if (Array.isArray(fetchedOrders)) {
                setOrders(fetchedOrders);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.warn('Failed to fetch orders from backend:', err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] mx-6 flex flex-col items-center justify-center text-center py-20">
                <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                    <ShoppingBag size={30} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Track Your Orders</h1>
                <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
                    Please sign in to view your live order history, delivery status, and rate your purchased products.
                </p>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => promptLoginModal('Sign in to view orders', 'Please sign in to view your live orders and status updates.')}
                        className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-md shadow-green-600/20 transition cursor-pointer"
                    >
                        Sign In Now
                    </button>
                    <Link
                        href="/"
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
                    >
                        Continue Browsing
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] mx-6">
            {loading ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-green-600" />
                    <p className="text-sm font-medium text-slate-600">Loading your live orders...</p>
                </div>
            ) : orders.length > 0 ? (
                <div className="my-16 max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <PageTitle heading="My Orders" text={`Showing ${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`} linkText={'Go to home'} />
                        <button
                            type="button"
                            onClick={fetchOrders}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 transition cursor-pointer"
                            title="Refresh orders"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-slate-500 table-auto border-separate border-spacing-y-8 border-spacing-x-0">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 max-md:hidden">
                                    <th className="text-left pb-3 font-semibold w-1/2">Order & Products</th>
                                    <th className="text-center pb-3 font-semibold">Total Amount</th>
                                    <th className="text-left pb-3 font-semibold">Shipping Address</th>
                                    <th className="text-center pb-3 font-semibold">Lifecycle Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderItem order={order} key={order.id} onRatingSubmitted={fetchOrders} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="min-h-[70vh] mx-6 flex flex-col items-center justify-center text-center py-20">
                    <div className="size-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                        <PackageOpen size={30} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">You have no orders yet</h2>
                    <p className="text-sm text-slate-500 max-w-sm mb-6">
                        Looks like you haven&apos;t placed any orders yet. Discover our latest products and start shopping!
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-md shadow-green-600/20 transition"
                    >
                        Explore Marketplace <ArrowRight size={15} />
                    </Link>
                </div>
            )}
        </div>
    );
}
