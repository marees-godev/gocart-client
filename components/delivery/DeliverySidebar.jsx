'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useResizableSidebar } from '@/lib/hooks/useResizableSidebar'
import {
    Home,
    Truck,
    Warehouse,
    RotateCcw,
    Calculator,
    Settings,
    ShieldCheck,
    Clock,
    AlertCircle,
    Building2
} from 'lucide-react'

export default function DeliverySidebar({ profile, sidebar: externalSidebar }) {
    const pathname = usePathname()
    const internalSidebar = useResizableSidebar({
        storageKey: 'gocart_delivery_sidebar_width',
        defaultWidth: 260,
        minWidth: 200,
        maxWidth: 450
    })

    const sidebar = externalSidebar || internalSidebar
    const { width, isResizing, startResizing, resetWidth } = sidebar

    const sidebarLinks = [
        { name: 'Dashboard', href: '/delivery', icon: Home },
        { name: 'Dispatch & Shipments', href: '/delivery/dispatch', icon: Truck },
        { name: 'Warehouse Hubs', href: '/delivery/warehouses', icon: Warehouse },
        { name: 'Return Pickups', href: '/delivery/returns', icon: RotateCcw },
        { name: 'Rate Calculator', href: '/delivery/calculator', icon: Calculator },
        { name: 'Partner Settings', href: '/delivery/settings', icon: Settings },
    ]

    const partnerName = profile?.companyName || 'Logistics Carrier'
    const approvalStatus = profile?.approvalStatus || 'PENDING'

    return (
        <aside
            style={{ width: `${width}px` }}
            className={`relative inline-flex h-full flex-col gap-5 border-r border-slate-200 bg-white shrink-0 max-sm:!w-auto ${
                isResizing ? 'transition-none select-none' : 'transition-[width] duration-75'
            }`}
        >
            <div className="flex flex-col gap-2.5 justify-center items-center pt-6 px-4 max-sm:hidden text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    <Truck size={26} />
                </div>

                <div className="w-full">
                    <p className="text-slate-800 font-semibold text-sm truncate max-w-[180px] mx-auto" title={partnerName}>
                        {partnerName}
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            approvalStatus === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : approvalStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : approvalStatus === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                            {approvalStatus}
                        </span>

                        <span className={`size-2 rounded-full ${profile?.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} title={profile?.isActive ? 'Online' : 'Paused'} />
                    </div>
                </div>

                {profile?.partnerId && (
                    <p className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                        ID: {profile.partnerId}
                    </p>
                )}
            </div>

            <div className="max-sm:mt-4 px-2 space-y-1">
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
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

            <div className="mt-auto p-4 max-sm:hidden">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-amber-700" /> Doorstep SLA Target
                    </p>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                        Prompt status sync automatically updates buyers & merchant orders in real-time.
                    </p>
                </div>
            </div>

            {/* Resizer Handle */}
            <div
                onMouseDown={startResizing}
                onDoubleClick={resetWidth}
                className={`absolute top-0 right-0 bottom-0 w-2 -mr-1 cursor-col-resize select-none z-30 flex items-center justify-center transition-colors group max-sm:hidden ${
                    isResizing ? 'bg-amber-500' : 'hover:bg-amber-500/40'
                }`}
                title="Drag to resize sidebar • Double-click to reset"
            >
                <div
                    className={`w-0.5 h-8 rounded-full transition-opacity ${
                        isResizing ? 'bg-white opacity-100' : 'bg-slate-300 opacity-0 group-hover:opacity-100 group-hover:bg-amber-600'
                    }`}
                />
            </div>
        </aside>
    )
}
