import { 
    PlusIcon, 
    MapPin, 
    ChevronDown, 
    Truck, 
    CreditCard, 
    Banknote, 
    CheckCircle2, 
    Loader2, 
    XIcon,
    Lock
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import AddressModal, { resolveUserId } from './AddressModal';
import { promptLoginModal } from './AuthModalContext';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { graphqlRequest } from '@/lib/apiClient';
import { GET_USER_ADDRESSES_QUERY } from '@/lib/graphql/address';
import { CREATE_ORDER_MUTATION } from '@/lib/graphql/order';
import { PROCESS_PAYMENT_MUTATION } from '@/lib/graphql/payment';
import { CALCULATE_SHIPPING_FEE_QUERY } from '@/lib/graphql/delivery';
import { CLEAR_CART_MUTATION } from '@/lib/graphql/cart';
import { clearCart } from '@/lib/features/cart/cartSlice';
import { setAddresses, normalizeAddress } from '@/lib/features/address/addressSlice';
import { useCurrency } from '@/lib/features/currency/useCurrency';

const DELIVERY_PARTNERS = [
    {
        id: 'del-partner-default',
        name: 'Standard Delivery',
        eta: '3–5 Business Days',
        badge: 'Standard',
        defaultFee: 0,
    },
    {
        id: 'del-partner-express',
        name: 'Express Priority',
        eta: '1–2 Business Days',
        badge: 'Fastest',
        defaultFee: 49,
    },
];

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') return resolve(false);
        if (window.Razorpay) return resolve(true);

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => {
            console.error('Failed to load Razorpay SDK');
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

const OrderSummary = ({ totalPrice, items = [] }) => {
    const { formatPrice, code = 'INR' } = useCurrency();
    const currencyCode = code;

    const router = useRouter();
    const dispatch = useDispatch();

    const reduxUser = useSelector(state => state.auth?.user);
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
    const addressList = useSelector(state => state.address.list);
    const cartId = useSelector(state => state.cart?.id);
    const userId = resolveUserId(null, reduxUser);

    const [paymentMethod, setPaymentMethod] = useState('RAZORPAY'); // 'RAZORPAY' | 'COD'
    const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState(DELIVERY_PARTNERS[0].id);
    const [shippingFee, setShippingFee] = useState(0);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');

    // Fetch user addresses from BE if user is logged in and list is empty
    useEffect(() => {
        const fetchAddresses = async () => {
            if (!userId) return;
            try {
                const res = await graphqlRequest(GET_USER_ADDRESSES_QUERY, { userId });
                if (res?.userAddresses && res.userAddresses.length > 0) {
                    const normalized = res.userAddresses.map(normalizeAddress);
                    dispatch(setAddresses(normalized));
                }
            } catch (err) {
                console.warn('Could not fetch addresses for checkout:', err);
            }
        };

        if (addressList.length === 0 && userId) {
            fetchAddresses();
        }
    }, [userId, addressList.length, dispatch]);

    useEffect(() => {
        if (addressList.length > 0) {
            if (!selectedAddress || !addressList.some(a => String(a.id) === String(selectedAddress.id))) {
                const defaultAddr = addressList.find(addr => addr.isDefault) || addressList[0];
                setSelectedAddress(defaultAddr);
            }
        }
    }, [addressList, selectedAddress]);

    // Dynamic shipping fee calculation via delivery-service
    useEffect(() => {
        let isCancelled = false;
        const fetchShippingFee = async () => {
            const partner = DELIVERY_PARTNERS.find(p => p.id === selectedDeliveryPartner) || DELIVERY_PARTNERS[0];
            
            if (!selectedAddress || !items || items.length === 0) {
                setShippingFee(partner.defaultFee);
                return;
            }

            setIsCalculatingShipping(true);
            try {
                const addrPayload = JSON.stringify({
                    street: selectedAddress.street || '',
                    city: selectedAddress.city || '',
                    state: selectedAddress.state || '',
                    postal_code: selectedAddress.zip || '',
                    country: selectedAddress.country || 'India',
                });

                const res = await graphqlRequest(CALCULATE_SHIPPING_FEE_QUERY, {
                    input: {
                        deliveryPartnerId: selectedDeliveryPartner,
                        destinationPostalCode: selectedAddress.zip || '',
                        destinationCity: selectedAddress.city || '',
                        destinationState: selectedAddress.state || '',
                        shippingAddress: addrPayload,
                        items: items.map(it => ({
                            productId: String(it.id || it.productId),
                            quantity: Number(it.quantity) || 1,
                            weightGrams: Number(it.weight || 500),
                        })),
                    }
                });

                if (!isCancelled && res?.calculateShippingFee?.shippingFee !== undefined) {
                    setShippingFee(res.calculateShippingFee.shippingFee);
                }
            } catch (err) {
                // Graceful fallback to partner default if delivery service unavailable
                if (!isCancelled) {
                    setShippingFee(partner.defaultFee);
                }
            } finally {
                if (!isCancelled) {
                    setIsCalculatingShipping(false);
                }
            }
        };

        fetchShippingFee();

        return () => {
            isCancelled = true;
        };
    }, [selectedAddress, selectedDeliveryPartner, items]);

    const handleCouponCode = async (event) => {
        event.preventDefault();
        if (!couponCodeInput.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }
        if (couponCodeInput.trim().toUpperCase() === 'GOCART20') {
            setCoupon({ code: 'GOCART20', discount: 20, description: '20% Special Discount' });
            toast.success('Coupon GOCART20 applied!');
            setCouponCodeInput('');
            return;
        }
        toast.error('Invalid coupon code');
    };

    const handlePlaceOrder = async (e) => {
        e?.preventDefault();

        if (!isAuthenticated) {
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-3.5 border border-emerald-200/90 items-center justify-between gap-3 text-slate-700`}>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                            <Lock size={16} />
                        </div>
                        <div className="text-xs">
                            <p className="font-bold text-slate-800">Checkout Notice</p>
                            <p className="text-slate-500 mt-0.5">Please sign in to place your order, or continue browsing as a guest.</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={() => toast.dismiss(t.id)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    >
                        <XIcon size={15} />
                    </button>
                </div>
            ), { duration: 4000 });

            promptLoginModal('Sign in to checkout', 'Please sign in to place your order, or continue browsing as a guest.');
            return;
        }

        if (!selectedAddress) {
            toast.error('Please select or add a delivery address');
            return;
        }

        setIsSubmitting(true);
        const loadingToastId = toast.loading('Creating order...');

        try {
            // Check for valid UUID for shippingAddressId
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(selectedAddress.id || ''));
            const shippingAddressId = isValidUUID ? String(selectedAddress.id) : undefined;

            const shippingAddressStr = JSON.stringify({
                name: selectedAddress.name || '',
                street: selectedAddress.street || '',
                city: selectedAddress.city || '',
                state: selectedAddress.state || '',
                postal_code: selectedAddress.zip || '',
                country: selectedAddress.country || 'India',
                phone: selectedAddress.phone || '',
            });

            const discountAmount = coupon ? (coupon.discount / 100 * totalPrice) : 0;
            const orderIdempotencyKey = crypto.randomUUID();

            const orderInput = {
                deliveryPartnerId: selectedDeliveryPartner,
                shippingAddress: shippingAddressStr,
                idempotencyKey: orderIdempotencyKey,
                currency: currencyCode,
                discountAmount: Number(discountAmount.toFixed(2)),
                ...(shippingAddressId ? { shippingAddressId } : {}),
                ...(cartId ? { cartId: String(cartId) } : {}),
            };

            // 1. Create authoritative order on backend
            const createOrderRes = await graphqlRequest(CREATE_ORDER_MUTATION, { input: orderInput });
            const createdOrder = createOrderRes?.createOrder;

            if (!createdOrder?.id) {
                throw new Error('Order creation did not return a valid order ID');
            }

            toast.dismiss(loadingToastId);

            // Handle Multi-vendor info if linked by parentOrderId
            if (createdOrder.parentOrderId && createdOrder.parentOrderId !== createdOrder.id) {
                console.info('Multi-vendor order linked by parentOrderId:', createdOrder.parentOrderId);
            }

            // 2. Handle Payment Flow based on selection
            if (paymentMethod === 'COD') {
                const codToastId = toast.loading('Confirming Cash on Delivery order...');
                const codPaymentRes = await graphqlRequest(PROCESS_PAYMENT_MUTATION, {
                    input: {
                        orderId: createdOrder.id,
                        paymentMethod: 'COD',
                        idempotencyKey: crypto.randomUUID(),
                    }
                });

                toast.dismiss(codToastId);

                if (codPaymentRes?.processPayment) {
                    dispatch(clearCart());
                    try {
                        await graphqlRequest(CLEAR_CART_MUTATION, { userId: userId ? String(userId) : undefined });
                    } catch {}
                    toast.success(`Order placed successfully! Order #${createdOrder.orderNumber || createdOrder.id.slice(0, 8)}`);
                    router.push('/orders');
                } else {
                    throw new Error('Failed to confirm Cash on Delivery payment');
                }
            } else if (paymentMethod === 'RAZORPAY') {
                const sdkLoaded = await loadRazorpayScript();
                if (!sdkLoaded) {
                    throw new Error('Unable to load Razorpay payment gateway. Please check your network connection.');
                }

                // Get Razorpay Key from environment or active test key
                const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Tl2mmKdW70Yml2';

                // Authoritative amount in smallest currency unit (paise)
                const authoritativeAmountSubunits = Math.max(100, Math.round(Number(createdOrder.totalAmount || totalPrice) * 100));

                // Clean phone number for Razorpay prefill
                const rawPhone = (selectedAddress?.phone || reduxUser?.phone || '').replace(/\D/g, '');
                const contactNumber = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9876543210';

                // Domestic Razorpay accounts require INR
                const paymentCurrency = 'INR';

                const razorpayOptions = {
                    key: razorpayKey,
                    amount: authoritativeAmountSubunits,
                    currency: paymentCurrency,
                    name: 'GoCart Marketplace',
                    description: `Order #${createdOrder.orderNumber || createdOrder.id.slice(0, 8)}`,
                    prefill: {
                        name: selectedAddress?.name || reduxUser?.name || 'Customer',
                        email: reduxUser?.email || selectedAddress?.email || 'customer@example.com',
                        contact: contactNumber,
                    },
                    notes: {
                        order_id: createdOrder.id,
                        parent_order_id: createdOrder.parentOrderId || '',
                    },
                    theme: {
                        color: '#16a34a',
                    },
                    handler: async function (response) {
                        const verifyToastId = toast.loading('Confirming Razorpay payment...');
                        try {
                            const paymentIdempotencyKey = response.razorpay_payment_id || crypto.randomUUID();

                            const payRes = await graphqlRequest(PROCESS_PAYMENT_MUTATION, {
                                input: {
                                    orderId: createdOrder.id,
                                    paymentMethod: 'RAZORPAY',
                                    idempotencyKey: paymentIdempotencyKey,
                                }
                            });

                            toast.dismiss(verifyToastId);

                            if (payRes?.processPayment?.status === 'SUCCESS' || payRes?.processPayment?.status === 'PENDING') {
                                dispatch(clearCart());
                                try {
                                    await graphqlRequest(CLEAR_CART_MUTATION, { userId: userId ? String(userId) : undefined });
                                } catch {}
                                toast.success('Payment verified! Order placed successfully.');
                                router.push('/orders');
                            } else {
                                toast.error(payRes?.processPayment?.failureReason || 'Payment processing failed');
                            }
                        } catch (err) {
                            toast.dismiss(verifyToastId);
                            console.error('Razorpay processPayment error:', err);
                            toast.error(err.message || 'Payment confirmation failed');
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            toast('Payment window closed. You can complete payment anytime from My Orders.', { icon: 'ℹ️' });
                            router.push('/orders');
                        }
                    }
                };

                const rzp = new window.Razorpay(razorpayOptions);
                rzp.on('payment.failed', function (resp) {
                    const desc = resp.error?.description || resp.error?.reason || 'Transaction declined';
                    console.error('Razorpay payment failed:', resp.error);
                    toast.error(`Razorpay: ${desc}`);
                });
                rzp.open();
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            console.error('Checkout error:', error);
            toast.error(error.message || 'Failed to complete order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const estimatedTax = React.useMemo(() => {
        return (items || []).reduce((sum, item) => {
            const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
            const qty = item.quantity || 1;
            const taxRate = typeof item.tax === 'number' ? item.tax : parseFloat(item.tax) || 0;
            const itemSub = price * qty;
            let t = 0;
            if (taxRate > 1.0) {
                t = itemSub * (taxRate / 100.0);
            } else if (taxRate > 0) {
                t = itemSub * taxRate;
            }
            return sum + t;
        }, 0);
    }, [items]);

    const couponDiscount = coupon ? (coupon.discount / 100 * totalPrice) : 0;
    const finalTotal = Math.max(0, Math.round((totalPrice + estimatedTax - couponDiscount + (shippingFee || 0)) * 100) / 100);

    return (
        <div className='w-full max-w-lg lg:max-w-[380px] bg-white border border-slate-200/80 shadow-sm text-slate-600 text-sm rounded-2xl p-6'>
            <h2 className='text-lg font-bold text-slate-800 tracking-tight'>Payment & Order Summary</h2>
            
            {/* Delivery Partner Selection Flow */}
            <div className='mt-4'>
                <div className='flex items-center justify-between mb-2'>
                    <p className='text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                        <Truck size={14} className='text-slate-500' /> Delivery Speed & Partner
                    </p>
                    {isCalculatingShipping && (
                        <span className='text-[10px] text-slate-400 flex items-center gap-1'>
                            <Loader2 size={10} className='animate-spin' /> Calculating...
                        </span>
                    )}
                </div>
                <div className='grid grid-cols-2 gap-2'>
                    {DELIVERY_PARTNERS.map(partner => {
                        const isSelected = selectedDeliveryPartner === partner.id;
                        return (
                            <button
                                key={partner.id}
                                type="button"
                                onClick={() => setSelectedDeliveryPartner(partner.id)}
                                className={`text-left p-2.5 rounded-xl border transition cursor-pointer ${
                                    isSelected 
                                        ? 'border-green-500 bg-green-50/50 text-slate-800 font-medium ring-1 ring-green-500/20' 
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                <div className='flex items-center justify-between'>
                                    <span className='text-xs font-bold'>{partner.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                                        isSelected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {partner.badge}
                                    </span>
                                </div>
                                <span className='text-[11px] text-slate-500 block mt-1'>{partner.eta}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Payment Method Selector */}
            <div className='mt-5'>
                <p className='text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2'>Payment Method</p>
                <div className='space-y-2'>
                    <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        paymentMethod === 'RAZORPAY' 
                            ? 'border-green-500 bg-green-50/50 text-slate-800 font-medium ring-1 ring-green-500/20' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}>
                        <div className='flex items-center gap-2.5'>
                            <input 
                                type="radio" 
                                id="RAZORPAY" 
                                name="paymentMethod" 
                                onChange={() => setPaymentMethod('RAZORPAY')} 
                                checked={paymentMethod === 'RAZORPAY'} 
                                className='accent-green-600' 
                            />
                            <div className='flex items-center gap-2'>
                                <CreditCard size={15} className='text-green-600' />
                                <span className='text-xs font-medium'>Razorpay / Online</span>
                            </div>
                        </div>
                        <span className='text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full'>
                            UPI / Cards / NetBanking
                        </span>
                    </label>

                    <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        paymentMethod === 'COD' 
                            ? 'border-green-500 bg-green-50/50 text-slate-800 font-medium ring-1 ring-green-500/20' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}>
                        <div className='flex items-center gap-2.5'>
                            <input 
                                type="radio" 
                                id="COD" 
                                name="paymentMethod" 
                                onChange={() => setPaymentMethod('COD')} 
                                checked={paymentMethod === 'COD'} 
                                className='accent-green-600' 
                            />
                            <div className='flex items-center gap-2'>
                                <Banknote size={15} className='text-amber-600' />
                                <span className='text-xs font-medium'>Cash On Delivery</span>
                            </div>
                        </div>
                        <span className='text-[10px] text-slate-400'>Pay at doorstep</span>
                    </label>
                </div>
            </div>

            {/* Address Selection Card */}
            <div className='my-5 py-4 border-y border-slate-100'>
                <div className='flex items-center justify-between mb-2.5'>
                    <div className='flex items-center gap-1.5'>
                        <MapPin size={15} className='text-green-600' />
                        <span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>Delivery Address</span>
                    </div>
                    {selectedAddress && (
                        <button 
                            type="button"
                            onClick={() => setSelectedAddress(null)} 
                            className='text-xs font-semibold text-green-600 hover:text-green-700 hover:underline cursor-pointer'
                        >
                            Change
                        </button>
                    )}
                </div>

                {
                    selectedAddress ? (
                        <div className='p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs'>
                            <div className='flex items-center justify-between'>
                                <span className='font-bold text-slate-800 text-sm'>{selectedAddress.name}</span>
                                {selectedAddress.title && (
                                    <span className='px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200'>
                                        {selectedAddress.title}
                                    </span>
                                )}
                            </div>
                            <p className='text-slate-600'>{selectedAddress.street}</p>
                            <p className='text-slate-500'>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}</p>
                            {selectedAddress.phone && <p className='text-slate-400 pt-0.5'>Phone: {selectedAddress.phone}</p>}
                        </div>
                    ) : (
                        <div className='space-y-2.5'>
                            {
                                addressList.length > 0 && (
                                    <div className='relative'>
                                        <select 
                                            className='w-full appearance-none border border-slate-200 p-2.5 pr-8 text-xs font-medium text-slate-700 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:border-green-500 outline-none cursor-pointer' 
                                            onChange={(e) => setSelectedAddress(addressList[e.target.value])}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select a saved address...</option>
                                            {
                                                addressList.map((addr, index) => (
                                                    <option key={addr.id || index} value={index}>
                                                        {addr.title ? `[${addr.title}] ` : ''}{addr.name} - {addr.street}, {addr.city}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                                    </div>
                                )
                            }
                            <button 
                                type="button"
                                className='w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-dashed border-green-500/80 bg-green-50/30 hover:bg-green-50 text-green-700 font-semibold text-xs transition active:scale-98 cursor-pointer' 
                                onClick={() => setShowAddressModal(true)}
                            >
                                <PlusIcon size={15} className='stroke-[2.5]' /> Add New Delivery Address
                            </button>
                        </div>
                    )
                }
            </div>

            {/* Price Breakdown */}
            <div className='pb-4 border-b border-slate-100 space-y-2 text-xs'>
                <div className='flex justify-between text-slate-500'>
                    <span>Subtotal:</span>
                    <span className='font-semibold text-slate-700'>{formatPrice(totalPrice)}</span>
                </div>
                {estimatedTax > 0 && (
                    <div className='flex justify-between text-slate-500'>
                        <span>Estimated Taxes & Fees (GST/VAT):</span>
                        <span className='font-semibold text-slate-700'>{formatPrice(estimatedTax)}</span>
                    </div>
                )}
                <div className='flex justify-between text-slate-500'>
                    <span>Shipping Fee:</span>
                    <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : 'text-slate-700'}`}>
                        {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                    </span>
                </div>
                {coupon && (
                    <div className='flex justify-between text-green-600 font-medium'>
                        <span>Coupon ({coupon.code}):</span>
                        <span>{`-${formatPrice(couponDiscount)}`}</span>
                    </div>
                )}

                {
                    !coupon ? (
                        <form onSubmit={handleCouponCode} className='flex gap-2 pt-2'>
                            <input 
                                onChange={(e) => setCouponCodeInput(e.target.value)} 
                                value={couponCodeInput} 
                                type="text" 
                                placeholder='Coupon code (try GOCART20)' 
                                className='border border-slate-200 px-3 py-1.5 rounded-lg w-full text-xs outline-none focus:border-green-500' 
                            />
                            <button type="submit" className='bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-900 active:scale-95 transition cursor-pointer'>
                                Apply
                            </button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-between bg-green-50 border border-green-200 text-green-800 p-2 rounded-lg text-xs mt-2'>
                            <div>
                                <span className='font-bold uppercase'>{coupon.code}</span>
                                <span className='text-[11px] text-green-700 block'>{coupon.description}</span>
                            </div>
                            <XIcon size={16} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>

            <div className='flex items-baseline justify-between py-4'>
                <span className='text-sm font-semibold text-slate-700'>Total Authoritative Amount:</span>
                <span className='text-xl font-bold text-slate-900'>
                    {formatPrice(finalTotal)}
                </span>
            </div>

            <button 
                type="button"
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-md shadow-green-600/20 active:scale-98 transition-all cursor-pointer ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={16} className='animate-spin' /> Processing Checkout...
                    </>
                ) : (
                    <>
                        <CheckCircle2 size={16} /> Place Order & Pay
                    </>
                )}
            </button>

            {showAddressModal && (
                <AddressModal 
                    setShowAddressModal={setShowAddressModal}
                    userId={userId}
                    onSuccess={(newAddr) => setSelectedAddress(newAddr)}
                />
            )}
        </div>
    );
};

export default OrderSummary;
