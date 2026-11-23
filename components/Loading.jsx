'use client'

import React from 'react'
import { Store, Truck, Package, ShoppingCart, ShoppingBag, Sparkles } from 'lucide-react'

const VARIANT_CONFIGS = {
    merchant: {
        icon: Store,
        defaultTitle: 'Loading Merchant Workspace',
        defaultSubtitle: 'Syncing store catalog, inventory & revenue analytics...',
        ringBg: 'bg-emerald-100',
        badgeBg: 'bg-gradient-to-br from-emerald-600 to-teal-700',
        barGradient: 'from-emerald-500 to-teal-600',
        shadow: 'shadow-emerald-600/20',
    },
    delivery: {
        icon: Truck,
        defaultTitle: 'Connecting to Delivery Hub',
        defaultSubtitle: 'Retrieving assigned dispatches & active transit routes...',
        ringBg: 'bg-amber-100',
        badgeBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        barGradient: 'from-amber-500 to-orange-600',
        shadow: 'shadow-amber-500/20',
    },
    orders: {
        icon: Package,
        defaultTitle: 'Fetching Your Orders',
        defaultSubtitle: 'Retrieving live order history and delivery timelines...',
        ringBg: 'bg-blue-100',
        badgeBg: 'bg-gradient-to-br from-blue-600 to-indigo-700',
        barGradient: 'from-blue-500 to-indigo-600',
        shadow: 'shadow-blue-600/20',
    },
    catalog: {
        icon: ShoppingBag,
        defaultTitle: 'Exploring GoCart Marketplace',
        defaultSubtitle: 'Curating verified items & competitive prices...',
        ringBg: 'bg-emerald-100',
        badgeBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        barGradient: 'from-emerald-500 to-green-600',
        shadow: 'shadow-emerald-500/20',
    },
    cart: {
        icon: ShoppingCart,
        defaultTitle: 'Reviewing Shopping Cart',
        defaultSubtitle: 'Verifying merchant stock & promotional discounts...',
        ringBg: 'bg-emerald-100',
        badgeBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        barGradient: 'from-emerald-500 to-green-600',
        shadow: 'shadow-emerald-500/20',
    },
    product: {
        icon: Sparkles,
        defaultTitle: 'Loading Product Details',
        defaultSubtitle: 'Retrieving verified specifications & merchant details...',
        ringBg: 'bg-emerald-100',
        badgeBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        barGradient: 'from-emerald-500 to-green-600',
        shadow: 'shadow-emerald-500/20',
    },
    default: {
        icon: ShoppingCart,
        defaultTitle: 'Loading GoCart',
        defaultSubtitle: 'Curating verified products and deals...',
        ringBg: 'bg-emerald-100',
        badgeBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        barGradient: 'from-emerald-500 to-green-600',
        shadow: 'shadow-emerald-500/20',
    },
}

const Loading = ({ 
    variant = 'default',
    title, 
    subtitle,
    fullScreen = false
}) => {
    const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.default
    const finalTitle = title || config.defaultTitle
    const finalSubtitle = subtitle || config.defaultSubtitle
    const IconComponent = config.icon

    return (
        <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[55vh]'} h-full bg-white gap-4 select-none px-4`}>
            {/* Animated brand mark */}
            <div className="relative flex items-center justify-center">
                <span className={`absolute w-16 h-16 rounded-full ${config.ringBg} animate-ping opacity-60`} />

                <div className={`relative z-10 w-14 h-14 flex items-center justify-center rounded-2xl ${config.badgeBg} shadow-lg ${config.shadow} text-white`}>
                    <IconComponent size={26} strokeWidth={2.2} />
                </div>
            </div>

            {/* Smooth progress bar */}
            <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className={`h-full bg-gradient-to-r ${config.barGradient} rounded-full animate-[loading-bar_1.4s_ease-in-out_infinite]`} />
            </div>

            {/* Contextual E-commerce messaging */}
            <div className="text-center space-y-1 max-w-sm">
                <p className="text-sm font-semibold text-slate-800 tracking-tight">{finalTitle}</p>
                <p className="text-xs text-slate-400 font-normal leading-relaxed">{finalSubtitle}</p>
            </div>
        </div>
    )
}

export default Loading
