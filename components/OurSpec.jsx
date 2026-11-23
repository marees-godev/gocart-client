'use client'

import React from 'react'
import { ourSpecsData } from '@/assets/assets'
import { ShieldCheck, Truck, Headphones, Sparkles } from 'lucide-react'

export default function OurSpecs() {
    return (
        <div className='px-4 sm:px-6 my-16 sm:my-24 max-w-7xl mx-auto select-none'>
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={12} className="text-emerald-600" />
                    Guaranteed Excellence
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                    The GoCart Shopping Advantage
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                    Designed for speed, buyer security, and total peace of mind on every single purchase.
                </p>
            </div>

            {/* Feature Cards Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
                {ourSpecsData.map((spec, index) => {
                    const Icon = spec.icon
                    return (
                        <div 
                            key={index}
                            className='relative pt-10 pb-8 px-8 flex flex-col items-center justify-center w-full text-center bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1'
                        >
                            {/* Floating Top Icon */}
                            <div 
                                className='absolute -top-6 size-12 flex items-center justify-center rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300' 
                                style={{ backgroundColor: spec.accent || '#05DF72' }}
                            >
                                <Icon size={22} strokeWidth={2.2} />
                            </div>

                            <h3 className='text-slate-800 font-bold text-base mt-2 group-hover:text-emerald-700 transition-colors'>
                                {spec.title}
                            </h3>
                            <p className='text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed font-normal'>
                                {spec.description}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
