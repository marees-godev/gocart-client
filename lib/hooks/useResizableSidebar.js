'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook to manage a resizable sidebar with persistent width in localStorage.
 *
 * @param {Object} options
 * @param {string} options.storageKey - Key used to save width in localStorage
 * @param {number} options.defaultWidth - Default width in pixels (e.g. 256)
 * @param {number} options.minWidth - Minimum allowable width in pixels (e.g. 190)
 * @param {number} options.maxWidth - Maximum allowable width in pixels (e.g. 450)
 * @param {number} options.collapseThreshold - Drag width below which the sidebar auto-collapses
 */
export function useResizableSidebar({
    storageKey = 'gocart_sidebar_width',
    defaultWidth = 256,
    minWidth = 190,
    maxWidth = 450,
    collapseThreshold,
} = {}) {
    const autoCollapseWidth = collapseThreshold ?? Math.min(minWidth - 60, Math.round(minWidth * 0.6))
    const [width, setWidth] = useState(defaultWidth)
    const [isResizing, setIsResizing] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const isResizingRef = useRef(false)

    // Load initial width and collapsed state from localStorage on mount
    useEffect(() => {
        try {
            const savedWidth = localStorage.getItem(storageKey)
            if (savedWidth) {
                const parsed = parseInt(savedWidth, 10)
                if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
                    setWidth(parsed)
                }
            }
            const savedCollapsed = localStorage.getItem(`${storageKey}_collapsed`)
            if (savedCollapsed === 'true') {
                setIsCollapsed(true)
            }
        } catch (e) {
            // Ignore storage access errors in restricted contexts
        }
    }, [storageKey, minWidth, maxWidth])

    const startResizing = useCallback((e) => {
        if (isCollapsed) return
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        isResizingRef.current = true
    }, [isCollapsed])

    const stopResizing = useCallback(() => {
        if (isResizingRef.current) {
            setIsResizing(false)
            isResizingRef.current = false
        }
    }, [])

    const onMouseMove = useCallback((e) => {
        if (!isResizingRef.current) return
        if (e.clientX < autoCollapseWidth) {
            setIsResizing(false)
            isResizingRef.current = false
            setIsCollapsed(true)
            try {
                localStorage.setItem(`${storageKey}_collapsed`, 'true')
            } catch (err) {}
            return
        }
        const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth)
        setWidth(newWidth)
        try {
            localStorage.setItem(storageKey, String(newWidth))
        } catch (err) {}
    }, [autoCollapseWidth, minWidth, maxWidth, storageKey])

    useEffect(() => {
        const handleMouseMove = (e) => onMouseMove(e)
        const handleMouseUp = () => stopResizing()

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        } else {
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, onMouseMove, stopResizing])

    const resetWidth = useCallback(() => {
        setWidth(defaultWidth)
        try {
            localStorage.setItem(storageKey, String(defaultWidth))
        } catch (err) {}
    }, [defaultWidth, storageKey])

    const toggleCollapse = useCallback(() => {
        setIsCollapsed((prev) => {
            const next = !prev
            try {
                localStorage.setItem(`${storageKey}_collapsed`, String(next))
            } catch (err) {}
            return next
        })
    }, [storageKey])

    const collapse = useCallback(() => {
        setIsCollapsed(true)
        try {
            localStorage.setItem(`${storageKey}_collapsed`, 'true')
        } catch (err) {}
    }, [storageKey])

    const expand = useCallback(() => {
        setIsCollapsed(false)
        try {
            localStorage.setItem(`${storageKey}_collapsed`, 'false')
        } catch (err) {}
    }, [storageKey])

    return {
        width,
        isResizing,
        isCollapsed,
        startResizing,
        resetWidth,
        toggleCollapse,
        collapse,
        expand,
        minWidth,
        maxWidth
    }
}
