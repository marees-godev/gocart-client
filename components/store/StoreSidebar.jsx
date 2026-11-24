'use client'
import { usePathname } from "next/navigation"
import {
    HomeIcon,
    LayoutListIcon,
    SquarePenIcon,
    SquarePlusIcon,
    BarChart3Icon,
    TicketPercentIcon,
    StarIcon,
    SettingsIcon,
    Store as StoreIcon,
    ExternalLink,
    Boxes
} from "lucide-react"
import Link from "next/link"
import { useResizableSidebar } from "@/lib/hooks/useResizableSidebar"

const StoreSidebar = ({ storeInfo, sidebar: externalSidebar }) => {
    const pathname = usePathname()
    const internalSidebar = useResizableSidebar({
        storageKey: 'gocart_store_sidebar_width',
        defaultWidth: 256,
        minWidth: 200,
        maxWidth: 450
    })

    const sidebar = externalSidebar || internalSidebar
    const { width, isResizing, startResizing, resetWidth } = sidebar

    const sidebarLinks = [
        { name: 'Dashboard', href: '/store', icon: HomeIcon },
        { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
        { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Inventory', href: '/store/inventory', icon: Boxes },
        { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
        { name: 'Analytics', href: '/store/analytics', icon: BarChart3Icon },
        { name: 'Coupons', href: '/store/coupons', icon: TicketPercentIcon },
        { name: 'Reviews', href: '/store/reviews', icon: StarIcon },
        { name: 'Store Settings', href: '/store/settings', icon: SettingsIcon },
    ]

    const storeLogo = storeInfo?.logoUrl || storeInfo?.logo
    const storeName = storeInfo?.name || "Merchant Store"
    const approvalStatus = storeInfo?.approvalStatus || 'DRAFT'

    return (
        <aside
            style={{ width: `${width}px` }}
            className={`relative inline-flex h-full flex-col gap-5 border-r border-slate-200 bg-white shrink-0 max-sm:!w-auto ${
                isResizing ? 'transition-none select-none' : 'transition-[width] duration-75'
            }`}
        >
            <div className="flex flex-col gap-2.5 justify-center items-center pt-6 px-4 max-sm:hidden text-center">
                {storeLogo && typeof storeLogo === 'string' && storeLogo.startsWith('http') ? (
                    <img
                        className="w-14 h-14 rounded-2xl shadow-sm object-cover border border-slate-200"
                        src={storeLogo}
                        alt={storeName}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        {storeName.charAt(0).toUpperCase()}
                    </div>
                )}
                
                <div className="w-full">
                    <p className="text-slate-800 font-semibold text-sm truncate max-w-[180px] mx-auto" title={storeName}>
                        {storeName}
                    </p>
                    <div className="mt-1 flex items-center justify-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            (approvalStatus === 'APPROVED' || approvalStatus === 'approved')
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : (approvalStatus === 'DRAFT' || approvalStatus === 'draft')
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : (approvalStatus === 'REJECTED' || approvalStatus === 'rejected')
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                            {approvalStatus}
                        </span>
                    </div>
                </div>

                {storeInfo?.slug && (approvalStatus === 'APPROVED' || approvalStatus === 'approved') && (
                    <Link
                        href={`/shop/${storeInfo.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-green-700 transition"
                    >
                        View Storefront <ExternalLink size={11} />
                    </Link>
                )}
            </div>

            <div className="max-sm:mt-4 px-2 space-y-1">
                {sidebarLinks.map((link, index) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={index}
                            href={link.href}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                                isActive
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <link.icon size={18} className="shrink-0" />
                            <p className="max-sm:hidden truncate">{link.name}</p>
                        </Link>
                    )
                })}
            </div>

            {/* Resizer Handle */}
            <div
                onMouseDown={startResizing}
                onDoubleClick={resetWidth}
                className={`absolute top-0 right-0 bottom-0 w-2 -mr-1 cursor-col-resize select-none z-30 flex items-center justify-center transition-colors group max-sm:hidden ${
                    isResizing ? 'bg-emerald-500' : 'hover:bg-emerald-500/40'
                }`}
                title="Drag to resize sidebar • Double-click to reset"
            >
                <div
                    className={`w-0.5 h-8 rounded-full transition-opacity ${
                        isResizing ? 'bg-white opacity-100' : 'bg-slate-300 opacity-0 group-hover:opacity-100 group-hover:bg-emerald-600'
                    }`}
                />
            </div>
        </aside>
    )
}

export default StoreSidebar