'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import LoginModal from './LoginModal';

const AuthModalContext = createContext({
    isOpen: false,
    openLoginModal: () => {},
    closeLoginModal: () => {},
});

export const useAuthModal = () => useContext(AuthModalContext);

export const promptLoginModal = (title = 'Sign in to continue', alertMessage = null, initialRole = 'USER') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-login-modal', { 
            detail: { title, alertMessage, initialRole } 
        }));
    }
};

export function AuthModalProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('Sign in to continue');
    const [alertMessage, setAlertMessage] = useState(null);
    const [initialRole, setInitialRole] = useState('USER');

    const openLoginModal = (title = 'Sign in to continue', alert = null, role = 'USER') => {
        setModalTitle(title);
        setAlertMessage(alert);
        setInitialRole(role || 'USER');
        setIsOpen(true);
    };

    const closeLoginModal = () => {
        setIsOpen(false);
        setAlertMessage(null);
    };

    // Global listener so any component or handler anywhere can trigger the single global modal
    useEffect(() => {
        const handleOpenEvent = (e) => {
            const title = e?.detail?.title || 'Sign in to continue';
            const alert = e?.detail?.alertMessage || null;
            const role = e?.detail?.initialRole || 'USER';
            openLoginModal(title, alert, role);
        };

        window.addEventListener('open-login-modal', handleOpenEvent);
        return () => window.removeEventListener('open-login-modal', handleOpenEvent);
    }, []);

    return (
        <AuthModalContext.Provider value={{ isOpen, openLoginModal, closeLoginModal }}>
            {children}
            {/* Single global portal modal */}
            <LoginModal 
                isOpen={isOpen} 
                onClose={closeLoginModal} 
                title={modalTitle}
                alertMessage={alertMessage}
                initialRole={initialRole}
            />
        </AuthModalContext.Provider>
    );
}
