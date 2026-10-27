'use client'

import React from 'react'
import AuthForm from '@/components/AuthForm'

export default function MerchantLoginPage() {
    return (
        <AuthForm
            role="MERCHANT"
            lockRole={true}
            defaultRedirect="/store"
            portalTitle="GoCart Merchant Portal"
            portalSubtitle="Sign in to manage your storefront, products, and incoming orders."
        />
    )
}
