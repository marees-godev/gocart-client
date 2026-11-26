'use client'

import React, { useState, useEffect } from 'react'
import { X, RefreshCw, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { graphqlRequest } from '@/lib/apiClient'
import {
    GET_EXCHANGE_QUESTIONS_QUERY,
    CALCULATE_EXCHANGE_VALUATION_MUTATION,
    LOCK_EXCHANGE_QUOTE_MUTATION
} from '@/lib/graphql/return'
import { useCurrency } from '@/lib/features/currency/useCurrency'
import { useSelector } from 'react-redux'
import { promptLoginModal } from './AuthModalContext'
import toast from 'react-hot-toast'

export default function ExchangeModal({ product, onClose, onQuoteLocked }) {
    const { formatPrice } = useCurrency()
    const { isAuthenticated } = useSelector((state) => state.auth)

    const [loading, setLoading] = useState(true)
    const [questions, setQuestions] = useState([])
    const [devices, setDevices] = useState([])
    const [selectedDeviceId, setSelectedDeviceId] = useState('')
    const [answers, setAnswers] = useState({})
    const [serialOrImei, setSerialOrImei] = useState('')
    const [valuation, setValuation] = useState(null)
    const [calculating, setCalculating] = useState(false)
    const [locking, setLocking] = useState(false)
    const [lockedQuote, setLockedQuote] = useState(null)

    useEffect(() => {
        if (!product?.id) return
        setLoading(true)
        graphqlRequest(GET_EXCHANGE_QUESTIONS_QUERY, { productId: String(product.id) })
            .then((res) => {
                const data = res?.exchangeQuestions
                if (data) {
                    setQuestions(data.questions || [])
                    setDevices(data.devices || [])
                    if (data.devices?.length > 0) {
                        setSelectedDeviceId(data.devices[0].id)
                    }
                }
            })
            .catch((err) => {
                toast.error(err.message || 'Failed to load exchange options')
            })
            .finally(() => setLoading(false))
    }, [product?.id])

    const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

    const handleCalculate = async () => {
        if (!selectedDevice) {
            toast.error('Please select your trade-in device')
            return
        }
        const answerInputs = Object.entries(answers).map(([questionKey, optionKey]) => ({
            questionKey,
            optionKey,
        }))

        setCalculating(true)
        try {
            const res = await graphqlRequest(CALCULATE_EXCHANGE_VALUATION_MUTATION, {
                input: {
                    productId: String(product.id),
                    categoryCode: selectedDevice.categoryCode,
                    oldBrand: selectedDevice.brand,
                    oldModel: selectedDevice.model,
                    oldVariant: selectedDevice.variant || undefined,
                    answers: answerInputs,
                },
            })
            if (res?.calculateExchangeValuation) {
                setValuation(res.calculateExchangeValuation)
            }
        } catch (err) {
            toast.error(err.message || 'Valuation failed')
        } finally {
            setCalculating(false)
        }
    }

    const handleLockQuote = async () => {
        if (!isAuthenticated) {
            promptLoginModal('Sign in to lock exchange quote')
            return
        }
        if (!selectedDevice) return

        const answerInputs = Object.entries(answers).map(([questionKey, optionKey]) => ({
            questionKey,
            optionKey,
        }))

        setLocking(true)
        try {
            const res = await graphqlRequest(LOCK_EXCHANGE_QUOTE_MUTATION, {
                input: {
                    productId: String(product.id),
                    categoryCode: selectedDevice.categoryCode,
                    oldBrand: selectedDevice.brand,
                    oldModel: selectedDevice.model,
                    oldVariant: selectedDevice.variant || undefined,
                    serialOrImei: serialOrImei.trim() || undefined,
                    answers: answerInputs,
                },
            })
            if (res?.lockExchangeQuote) {
                setLockedQuote(res.lockExchangeQuote)
                if (typeof window !== 'undefined') {
                    localStorage.setItem(`exchange_quote_${product.id}`, JSON.stringify(res.lockExchangeQuote))
                }
                if (onQuoteLocked) onQuoteLocked(res.lockExchangeQuote)
                toast.success('Exchange quote locked!')
            }
        } catch (err) {
            toast.error(err.message || 'Could not lock exchange quote')
        } finally {
            setLocking(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <RefreshCw size={18} className="text-emerald-600" /> Device Exchange Estimator
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 size={24} className="animate-spin text-emerald-600" />
                    </div>
                ) : devices.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">
                        No eligible trade-in devices are configured for this product category yet.
                    </p>
                ) : (
                    <div className="space-y-4 text-xs">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Select Old Device</label>
                            <select
                                value={selectedDeviceId}
                                onChange={(e) => {
                                    setSelectedDeviceId(e.target.value)
                                    setValuation(null)
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:border-emerald-500 outline-none"
                            >
                                {devices.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.brand} {d.model} {d.variant ? `(${d.variant})` : ''} — Up to {formatPrice(d.baseExchangeValue)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {questions.map((q) => (
                            <div key={q.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <p className="font-semibold text-slate-800">{q.questionText}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {q.options.map((opt) => (
                                        <label
                                            key={opt.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                                                answers[q.questionKey] === opt.optionKey
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name={q.questionKey}
                                                checked={answers[q.questionKey] === opt.optionKey}
                                                onChange={() => {
                                                    setAnswers((prev) => ({ ...prev, [q.questionKey]: opt.optionKey }))
                                                    setValuation(null)
                                                }}
                                                className="accent-emerald-600"
                                            />
                                            <span>{opt.optionLabel}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Serial Number / IMEI (Optional)</label>
                            <input
                                type="text"
                                value={serialOrImei}
                                onChange={(e) => setSerialOrImei(e.target.value)}
                                placeholder="Enter device serial or 15-digit IMEI"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-mono"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCalculate}
                                disabled={calculating}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                            >
                                {calculating ? 'Calculating...' : 'Calculate Trade-In Value'}
                            </button>
                        </div>

                        {valuation && (
                            <div className={`p-4 rounded-2xl border space-y-2 ${
                                valuation.isEligible
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}>
                                {valuation.isEligible ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold flex items-center gap-1.5">
                                                <CheckCircle2 size={15} className="text-emerald-600" /> Estimated Exchange Discount
                                            </span>
                                            <span className="text-lg font-extrabold text-emerald-700">
                                                {formatPrice(valuation.finalDiscount)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-emerald-700">
                                            Base Value: {formatPrice(valuation.baseExchangeValue)} • Deductions: {formatPrice(valuation.totalDeductions)}
                                        </p>
                                        {!lockedQuote ? (
                                            <button
                                                type="button"
                                                onClick={handleLockQuote}
                                                disabled={locking}
                                                className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                                            >
                                                {locking ? 'Locking Quote...' : 'Lock This Exchange Quote'}
                                            </button>
                                        ) : (
                                            <div className="mt-2 p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center gap-2 text-emerald-800 font-semibold">
                                                <ShieldCheck size={15} /> Quote Locked! ID: <span className="font-mono">{lockedQuote.id}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 font-semibold">
                                        <AlertCircle size={15} />
                                        <span>Not Eligible: {valuation.rejectionReason || 'Device condition did not qualify'}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
