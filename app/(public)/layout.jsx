'use client'
import { Suspense } from "react";
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleOAuthCallback from "@/components/GoogleOAuthCallback";
import FacebookOAuthCallback from "@/components/FacebookOAuthCallback";
import { AuthModalProvider } from "@/components/AuthModalContext";

export default function PublicLayout({ children }) {
    return (
        <AuthModalProvider>
            <Suspense fallback={null}>
                <GoogleOAuthCallback />
                <FacebookOAuthCallback />
            </Suspense>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </AuthModalProvider>
    );
}
