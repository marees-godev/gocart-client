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
 */
export function useResizableSidebar({
    storageKey = 'gocart_sidebar_width',
    defaultWidth = 256,
    minWidth = 190,
    maxWidth = 450,
} = {}) {
    const [width, setWidth] = useState(defaultWidth)
    const [isResizing, setIsResizing] = useState(false)
    const isResizingRef = useRef(false)

    // Load initial width from localStorage on mount
    useEffect(() => {
        try {
            const savedWidth = localStorage.getItem(storageKey)
            if (savedWidth) {
                const parsed = parseInt(savedWidth, 10)
                if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
                    setWidth(parsed)
                }
            }
        } catch (e) {
            // Ignore storage access errors in restricted contexts
        }
    }, [storageKey, minWidth, maxWidth])

    const startResizing = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        isResizingRef.current = true
    }, [])

    const stopResizing = useCallback(() => {
        if (isResizingRef.current) {
            setIsResizing(false)
            isResizingRef.current = false
        }
    }, [])

    const onMouseMove = useCallback((e) => {
        if (!isResizingRef.current) return
        const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth)
        setWidth(newWidth)
        try {
            localStorage.setItem(storageKey, String(newWidth))
        } catch (err) {}
    }, [minWidth, maxWidth, storageKey])

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

    return {
        width,
        isResizing,
        startResizing,
        resetWidth,
        minWidth,
        maxWidth
    }
}
