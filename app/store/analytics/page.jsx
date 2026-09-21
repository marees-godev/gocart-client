'use client'

import React, { useState } from 'react'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    ArrowUpRight,
    Calendar,
    Download,
    Package,
    Eye
} from 'lucide-react'
import OrdersAreaChart from '@/components/OrdersAreaChart'
import { orderDummyData } from '@/assets/assets'

export default function MerchantAnalytics() {
    const [timeframe, setTimeframe] = useState('month') // 'week' | 'month' | 'year'

    // Mock KPI metrics
    const metrics = [
        {
            title: 'Total Gross Revenue',
            value: '$24,850.00',
            change: '+14.2%',
            isPositive: true,
            subtitle: 'vs. previous period'
        },
        {
            title: 'Total Units Sold',
            value: '1,420',
            change: '+8.7%',
            isPositive: true,
            subtitle: 'across 18 products'
        },
        {
            title: 'Average Order Value (AOV)',
            value: '$86.50',
            change: '+3.1%',
            isPositive: true,
            subtitle: 'per paying customer'
        },
        {
            title: 'Store Conversion Rate',
            value: '3.42%',
            change: '-0.4%',
            isPositive: false,
            subtitle: 'visitors to checkout'
        }
    ]

    // Mock top selling products data
    const topProducts = [
        {
            id: 'prod_1',
            name: 'Noise-Canceling Wireless Headphones',
            category: 'Headphones',
            sales: 382,
            revenue: '$11,460.00',
            stock: 45
        },
        {
            id: 'prod_2',
            name: 'Portable Bluetooth Stereo Speaker',
            category: 'Speakers',
            sales: 245,
            revenue: '$7,350.00',
            stock: 18
        },
        {
            id: 'prod_3',
            name: 'Ergonomic Wireless Gaming Mouse',
            category: 'Mouse',
            sales: 198,
            revenue: '$3,960.00',
            stock: 82
        },
        {
            id: 'prod_4',
            name: 'Minimalist Smart Fitness Watch',
            category: 'Watch',
            sales: 112,
            revenue: '$2,080.00',
            stock: 12
        }
    ]

    return (
        <div className="text-slate-600 mb-28 max-w-6xl space-y-8">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl text-slate-500">
                        Sales <span className="text-slate-800 font-medium">Analytics</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Track your store earnings, performance trends, and top converting products.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Timeframe Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
                        <button
                            onClick={() => setTimeframe('week')}
                            className={`px-3 py-1.5 rounded-lg transition ${
                                timeframe === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                            }`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setTimeframe('month')}
                            className={`px-3 py-1.5 rounded-lg transition ${
                                timeframe === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                            }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setTimeframe('year')}
                            className={`px-3 py-1.5 rounded-lg transition ${
                                timeframe === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                            }`}
                        >
                            12 Months
                        </button>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 transition shadow-xs"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {metrics.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
                    >
                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                            <span>{item.title}</span>
                            <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    item.isPositive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {item.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {item.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">{item.value}</h3>
                        <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                    </div>
                ))}
            </div>

            {/* Revenue Trend Area Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Revenue & Orders Growth</h3>
                        <p className="text-xs text-slate-400">Monthly sales progression chart.</p>
                    </div>
                </div>

                <div className="w-full pt-4">
                    <OrdersAreaChart allOrders={orderDummyData} />
                </div>
            </div>

            {/* Top Performing Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Top Selling Products</h3>
                        <p className="text-xs text-slate-400">Highest grossing items in your inventory.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-y border-slate-100">
                            <tr>
                                <th className="py-3 px-4">Product Name</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4 text-center">Units Sold</th>
                                <th className="py-3 px-4 text-center">Total Revenue</th>
                                <th className="py-3 px-4 text-center">Remaining Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topProducts.map((prod) => (
                                <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                                    <td className="py-3.5 px-4 font-medium text-slate-800">
                                        {prod.name}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-slate-500">
                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                            {prod.category}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                                        {prod.sales}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-bold text-green-600">
                                        {prod.revenue}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                prod.stock <= 20
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}
                                        >
                                            {prod.stock} units
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
