'use client'

import React from 'react'
import AuthForm from '@/components/AuthForm'

export default function LoginPage() {
    return (
        <AuthForm
            role="USER"
            lockRole={false}
        />
    )
}
