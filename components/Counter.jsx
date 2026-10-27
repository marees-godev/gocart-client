'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const Counter = ({ productId }) => {

    const { cartItems } = useSelector(state => state.cart);
    const { isAuthenticated } = useSelector(state => state.auth);

    const dispatch = useDispatch();
    const router = useRouter();

    const addToCartHandler = () => {
        if (!isAuthenticated) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('pendingCartItem', productId)
            }
            toast.error('Please login to update your cart')
            router.push(`/login?redirect=${encodeURIComponent('/cart')}&addCart=${productId}`)
            return
        }
        dispatch(addToCart({ productId }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none cursor-pointer">-</button>
            <p className="p-1">{cartItems[productId]}</p>
            <button onClick={addToCartHandler} className="p-1 select-none cursor-pointer">+</button>
        </div>
    )
}

export default Counter