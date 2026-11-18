'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";
import { orderDummyData } from "@/assets/assets";
import { useSelector } from "react-redux";
import { graphqlRequest } from "@/lib/apiClient";
import { LIST_MY_ORDERS_QUERY } from "@/lib/graphql/order";
import { Loader2 } from "lucide-react";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const { isAuthenticated } = useSelector(state => state.auth);
    const products = useSelector(state => state.product?.list || []);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!isAuthenticated) {
                setOrders(orderDummyData);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await graphqlRequest(LIST_MY_ORDERS_QUERY, { limit: 50, offset: 0 });
                const fetchedOrders = res?.listMyOrders?.orders;

                if (Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
                    const normalized = fetchedOrders.map(bo => {
                        let parsedAddr = {};
                        if (bo.shippingAddress) {
                            try {
                                parsedAddr = JSON.parse(bo.shippingAddress);
                            } catch {
                                parsedAddr = { street: bo.shippingAddress };
                            }
                        }

                        const items = (bo.items || []).map(it => {
                            const prod = products.find(p => String(p.id) === String(it.productId));
                            return {
                                product: {
                                    id: it.productId,
                                    name: it.productName || prod?.name || 'Item',
                                    images: prod?.images || [prod?.imageUrl || '/favicon.ico'],
                                },
                                price: it.unitPrice || 0,
                                quantity: it.quantity || 1,
                            };
                        });

                        return {
                            id: bo.id,
                            orderNumber: bo.orderNumber,
                            orderItems: items,
                            total: bo.totalAmount,
                            address: {
                                name: parsedAddr.name || 'Valued Customer',
                                street: parsedAddr.street || '',
                                city: parsedAddr.city || '',
                                state: parsedAddr.state || '',
                                zip: parsedAddr.postal_code || parsedAddr.zip || '',
                                country: parsedAddr.country || 'India',
                                phone: parsedAddr.phone || '',
                            },
                            status: bo.status || bo.orderStatus || 'CONFIRMED',
                            createdAt: bo.createdAt || new Date().toISOString(),
                        };
                    });
                    setOrders(normalized);
                } else {
                    setOrders([]);
                }
            } catch (err) {
                console.warn('Failed to fetch real orders, falling back to dummy orders:', err);
                setOrders(orderDummyData);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [isAuthenticated, products]);

    return (
        <div className="min-h-[70vh] mx-6">
            {loading ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={28} className="animate-spin text-green-600" />
                    <p className="text-sm">Loading your orders...</p>
                </div>
            ) : orders.length > 0 ? (
                <div className="my-20 max-w-7xl mx-auto">
                    <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />

                    <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
                        <thead>
                            <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                                <th className="text-left">Product</th>
                                <th className="text-center">Total Price</th>
                                <th className="text-left">Address</th>
                                <th className="text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <OrderItem order={order} key={order.id} />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                    <h1 className="text-2xl sm:text-4xl font-semibold">You have no orders</h1>
                </div>
            )}
        </div>
    );
}
