'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Title = ({ title, description, visibleButton = true, href = '/shop' }) => {
    return (
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-5'>
            <div>
                <h2 className='text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight'>
                    {title}
                </h2>
                {description && (
                    <p className='text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-normal leading-relaxed'>
                        {description}
                    </p>
                )}
            </div>
            {visibleButton && href && (
                <Link 
                    href={href} 
                    className='inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition group shrink-0'
                >
                    <span>Explore All</span>
                    <ArrowRight size={15} className='group-hover:translate-x-1 transition-transform' />
                </Link>
            )}
        </div>
    )
}

export default Title
