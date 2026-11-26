'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react'

const DialogContext = createContext({
    confirm: async () => false,
    prompt: async () => null,
})

export const useDialog = () => useContext(DialogContext)

const VARIANT_STYLES = {
    danger: {
        iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
        button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
        ring: 'focus:border-rose-500 focus:ring-rose-500/20',
        Icon: AlertTriangle,
    },
    warning: {
        iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
        button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
        ring: 'focus:border-amber-500 focus:ring-amber-500/20',
        Icon: AlertCircle,
    },
    default: {
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        button: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20',
        ring: 'focus:border-emerald-500 focus:ring-emerald-500/20',
        Icon: HelpCircle,
    },
}

export function DialogProvider({ children }) {
    const [dialogState, setDialogState] = useState(null)
    const [inputValue, setInputValue] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const resolverRef = useRef(null)
    const inputRef = useRef(null)

    const closeWith = useCallback((result) => {
        const resolve = resolverRef.current
        resolverRef.current = null
        setDialogState(null)
        setInputValue('')
        setErrorMsg('')
        if (resolve) resolve(result)
    }, [])

    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve
            setErrorMsg('')
            setDialogState({
                type: 'confirm',
                title: options.title || 'Confirm Action',
                description: options.description || 'Are you sure you want to proceed?',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                variant: options.variant || 'danger',
            })
        })
    }, [])

    const prompt = useCallback((options = {}) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve
            setInputValue(options.defaultValue ?? '')
            setErrorMsg('')
            setDialogState({
                type: 'prompt',
                title: options.title || 'Input Required',
                description: options.description || '',
                label: options.label || '',
                placeholder: options.placeholder || 'Enter details...',
                confirmText: options.confirmText || 'Submit',
                cancelText: options.cancelText || 'Cancel',
                variant: options.variant || 'default',
                required: options.required !== false,
                inputType: options.inputType || 'text',
                min: options.min,
                max: options.max,
                step: options.step,
                multiline: Boolean(options.multiline),
                suggestions: Array.isArray(options.suggestions) ? options.suggestions : [],
            })
        })
    }, [])

    useEffect(() => {
        if (!dialogState) return
        const timer = setTimeout(() => {
            inputRef.current?.focus()
            if (dialogState.type === 'prompt' && inputRef.current?.select) {
                inputRef.current.select()
            }
        }, 20)

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeWith(dialogState.type === 'confirm' ? false : null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [dialogState, closeWith])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!dialogState) return
        if (dialogState.type === 'confirm') {
            closeWith(true)
            return
        }

        const trimmed = String(inputValue).trim()
        if (dialogState.required && !trimmed) {
            setErrorMsg('Please enter a value before continuing.')
            inputRef.current?.focus()
            return
        }
        if (dialogState.inputType === 'number') {
            const num = parseFloat(trimmed)
            if (isNaN(num) || (dialogState.min !== undefined && num < dialogState.min) || (dialogState.max !== undefined && num > dialogState.max)) {
                setErrorMsg(
                    dialogState.max !== undefined
                        ? `Enter a valid amount between ${dialogState.min ?? 0} and ${dialogState.max}.`
                        : 'Please enter a valid number.'
                )
                inputRef.current?.focus()
                return
            }
        }

        closeWith(dialogState.required ? trimmed : String(inputValue))
    }

    const styles = dialogState ? (VARIANT_STYLES[dialogState.variant] || VARIANT_STYLES.default) : VARIANT_STYLES.default
    const StatusIcon = styles.Icon

    return (
        <DialogContext.Provider value={{ confirm, prompt }}>
            {children}

            {dialogState && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
                    onClick={() => closeWith(dialogState.type === 'confirm' ? false : null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-150"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                                    <StatusIcon size={21} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                                        {dialogState.title}
                                    </h3>
                                    {dialogState.description && (
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            {dialogState.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => closeWith(dialogState.type === 'confirm' ? false : null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                aria-label="Close dialog"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {dialogState.type === 'prompt' && (
                            <div className="space-y-2.5">
                                {dialogState.label && (
                                    <label className="block text-xs font-semibold text-slate-700">
                                        {dialogState.label}
                                    </label>
                                )}

                                {dialogState.suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {dialogState.suggestions.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => {
                                                    setInputValue(item)
                                                    setErrorMsg('')
                                                }}
                                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                                                    inputValue === item
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {dialogState.multiline ? (
                                    <textarea
                                        ref={inputRef}
                                        rows={3}
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value)
                                            if (errorMsg) setErrorMsg('')
                                        }}
                                        placeholder={dialogState.placeholder}
                                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm text-slate-800 outline-none focus:ring-2 transition resize-none ${styles.ring}`}
                                    />
                                ) : (
                                    <input
                                        ref={inputRef}
                                        type={dialogState.inputType}
                                        min={dialogState.min}
                                        max={dialogState.max}
                                        step={dialogState.step}
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value)
                                            if (errorMsg) setErrorMsg('')
                                        }}
                                        placeholder={dialogState.placeholder}
                                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm text-slate-800 outline-none focus:ring-2 transition ${styles.ring}`}
                                    />
                                )}

                                {errorMsg && (
                                    <p className="text-xs font-medium text-rose-600">{errorMsg}</p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => closeWith(dialogState.type === 'confirm' ? false : null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                            >
                                {dialogState.cancelText}
                            </button>
                            <button
                                type="submit"
                                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer ${styles.button}`}
                            >
                                {dialogState.confirmText}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </DialogContext.Provider>
    )
}
