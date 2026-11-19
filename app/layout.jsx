import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "GoCart. - Shop smarter",
    description: "GoCart. - Shop smarter",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${outfit.className} antialiased`}>
                <StoreProvider>
                    <Toaster 
                        position="top-center"
                        containerStyle={{
                            zIndex: 999999,
                        }}
                        toastOptions={{
                            className: 'text-sm font-medium',
                            duration: 4000,
                        }}
                    />
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
