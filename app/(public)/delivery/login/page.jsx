'use client'

import React from 'react'
import AuthForm from '@/components/AuthForm'

export default function DeliveryLoginPage() {
    return (
        <AuthForm
            role="DELIVERY_PARTNER"
            lockRole={true}
            defaultRedirect="/orders"
            portalTitle="GoCart Delivery Partner Hub"
            portalSubtitle="Sign in to accept delivery batches and track your earnings."
        />
    )
}
