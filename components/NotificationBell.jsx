'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { Bell, Check, CheckCheck, Loader2, ExternalLink } from 'lucide-react'
import { graphqlRequest } from '@/lib/apiClient'
import {
    GET_NOTIFICATIONS_QUERY,
    UNREAD_NOTIFICATION_COUNT_QUERY,
    MARK_NOTIFICATION_AS_READ_MUTATION,
    MARK_ALL_NOTIFICATIONS_READ_MUTATION
} from '@/lib/graphql/notification'
import toast from 'react-hot-toast'

export default function NotificationBell() {
    const { isAuthenticated } = useSelector((state) => state.auth)
    const [open, setOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef(null)

    const fetchUnreadCount = async () => {
        if (!isAuthenticated) return
        try {
            const res = await graphqlRequest(UNREAD_NOTIFICATION_COUNT_QUERY)
            if (typeof res?.unreadNotificationCount === 'number') {
                setUnreadCount(res.unreadNotificationCount)
            }
        } catch {
            // ignore silently if notification service is offline
        }
    }

    const fetchNotifications = async () => {
        if (!isAuthenticated) return
        setLoading(true)
        try {
            const res = await graphqlRequest(GET_NOTIFICATIONS_QUERY, { limit: 8, offset: 0 })
            if (res?.notifications) {
                setNotifications(res.notifications.notifications || [])
                if (typeof res.notifications.unreadCount === 'number') {
                    setUnreadCount(res.notifications.unreadCount)
                }
            }
        } catch {
            // ignore silently
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUnreadCount()
    }, [isAuthenticated])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!isAuthenticated) return null

    const handleToggle = () => {
        const next = !open
        setOpen(next)
        if (next) {
            fetchNotifications()
        }
    }

    const handleMarkRead = async (id) => {
        try {
            await graphqlRequest(MARK_NOTIFICATION_AS_READ_MUTATION, { notificationId: String(id), isRead: true })
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
            setUnreadCount((c) => Math.max(0, c - 1))
        } catch (err) {
            toast.error(err.message || 'Failed to mark as read')
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={handleToggle}
                className="relative p-1.5 rounded-full text-slate-600 hover:text-green-600 hover:bg-slate-100 transition cursor-pointer"
                title="Notifications"
            >
                <Bell size={19} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[9px] text-white bg-rose-600 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="text-[11px] font-semibold text-green-700 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <CheckCheck size={13} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {loading ? (
                            <div className="py-8 flex justify-center text-slate-400">
                                <Loader2 size={20} className="animate-spin text-green-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`px-4 py-3 text-xs transition ${
                                        n.isRead ? 'bg-white text-slate-600' : 'bg-emerald-50/40 text-slate-800'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-bold text-slate-800 line-clamp-1">{n.subject}</p>
                                        {!n.isRead && (
                                            <button
                                                type="button"
                                                onClick={() => handleMarkRead(n.id)}
                                                className="text-green-600 hover:text-green-800 p-0.5 rounded shrink-0 cursor-pointer"
                                                title="Mark as read"
                                            >
                                                <Check size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-slate-500 mt-0.5 line-clamp-2">{n.content}</p>
                                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                                        <span>{n.channel}</span>
                                        <span>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-center">
                        <Link
                            href="/notifications"
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline"
                        >
                            View all notifications &amp; push settings <ExternalLink size={12} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
