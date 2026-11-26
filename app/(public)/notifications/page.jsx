'use client'

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Bell, Check, CheckCheck, RefreshCw, Smartphone, Trash2, Loader2 } from 'lucide-react'
import { graphqlRequest } from '@/lib/apiClient'
import {
    GET_NOTIFICATIONS_QUERY,
    MARK_NOTIFICATION_AS_READ_MUTATION,
    MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    GET_PUSH_SUBSCRIPTIONS_QUERY,
    DEACTIVATE_PUSH_SUBSCRIPTION_MUTATION
} from '@/lib/graphql/notification'
import { promptLoginModal } from '@/components/AuthModalContext'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
    const { isAuthenticated } = useSelector((state) => state.auth)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [subscriptions, setSubscriptions] = useState([])
    const [filter, setFilter] = useState('ALL') // 'ALL' | 'UNREAD' | 'READ'
    const [loading, setLoading] = useState(true)

    const fetchAll = async () => {
        if (!isAuthenticated) {
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const filterInput = filter === 'UNREAD' ? { isRead: false } : filter === 'READ' ? { isRead: true } : undefined
            const [notifRes, subRes] = await Promise.allSettled([
                graphqlRequest(GET_NOTIFICATIONS_QUERY, { filter: filterInput, limit: 50, offset: 0 }),
                graphqlRequest(GET_PUSH_SUBSCRIPTIONS_QUERY, { activeOnly: true }),
            ])
            if (notifRes.status === 'fulfilled' && notifRes.value?.notifications) {
                setNotifications(notifRes.value.notifications.notifications || [])
                setUnreadCount(notifRes.value.notifications.unreadCount || 0)
            }
            if (subRes.status === 'fulfilled' && subRes.value?.pushSubscriptions) {
                setSubscriptions(subRes.value.pushSubscriptions.subscriptions || [])
            }
        } catch (err) {
            toast.error(err.message || 'Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [isAuthenticated, filter])

    const handleMarkRead = async (id, isRead = true) => {
        try {
            await graphqlRequest(MARK_NOTIFICATION_AS_READ_MUTATION, { notificationId: String(id), isRead })
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead } : n)))
            setUnreadCount((c) => (isRead ? Math.max(0, c - 1) : c + 1))
        } catch (err) {
            toast.error(err.message || 'Update failed')
        }
    }

    const handleMarkAllRead = async () => {
        try {
            const res = await graphqlRequest(MARK_ALL_NOTIFICATIONS_READ_MUTATION)
            if (res?.markAllNotificationsAsRead?.success) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
                setUnreadCount(0)
                toast.success('All notifications marked as read')
            }
        } catch (err) {
            toast.error(err.message || 'Failed to mark all as read')
        }
    }

    const handleDeactivatePush = async (id) => {
        try {
            await graphqlRequest(DEACTIVATE_PUSH_SUBSCRIPTION_MUTATION, { id: String(id) })
            setSubscriptions((prev) => prev.filter((s) => s.id !== id))
            toast.success('Push subscription deactivated')
        } catch (err) {
            toast.error(err.message || 'Failed to deactivate subscription')
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
                <Bell size={40} className="text-emerald-600 mb-3" />
                <h1 className="text-2xl font-bold text-slate-800">Notifications Center</h1>
                <p className="text-sm text-slate-500 mt-1 mb-5">Sign in to view your order alerts, delivery updates, and push preferences.</p>
                <button
                    type="button"
                    onClick={() => promptLoginModal('Sign in to view notifications')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                    Sign In
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Bell className="text-emerald-600 size-6" /> Notifications
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {unreadCount} unread alert{unreadCount === 1 ? '' : 's'} across orders, deliveries, and account updates.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchAll}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                            <CheckCheck size={14} /> Mark All Read
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {['ALL', 'UNREAD', 'READ'].map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setFilter(tab)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                            filter === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {tab === 'ALL' ? 'All' : tab === 'UNREAD' ? 'Unread' : 'Read'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 size={24} className="animate-spin text-emerald-600" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                        No notifications found for this filter.
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`p-4 flex items-start justify-between gap-4 text-xs ${
                                n.isRead ? 'bg-white' : 'bg-emerald-50/40'
                            }`}
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 text-sm">{n.subject}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                        {n.channel}
                                    </span>
                                    {!n.isRead && (
                                        <span className="size-2 rounded-full bg-emerald-600" />
                                    )}
                                </div>
                                <p className="text-slate-600 leading-relaxed">{n.content}</p>
                                <p className="text-[11px] text-slate-400">
                                    {n.eventType || 'SYSTEM'} • {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                </p>
                            </div>
                            {!n.isRead && (
                                <button
                                    type="button"
                                    onClick={() => handleMarkRead(n.id, true)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                    <Check size={13} /> Mark Read
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Active Push Subscriptions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Smartphone size={16} className="text-emerald-600" /> Registered Push Devices
                </h2>
                {subscriptions.length === 0 ? (
                    <p className="text-xs text-slate-400">No active browser push subscriptions registered.</p>
                ) : (
                    <div className="space-y-2">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <div>
                                    <p className="font-semibold text-slate-800">{sub.deviceName || 'Web Browser Device'}</p>
                                    <p className="text-[11px] text-slate-400 truncate max-w-md">{sub.endpoint}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDeactivatePush(sub.id)}
                                    className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                                    title="Deactivate"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
