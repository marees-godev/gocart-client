import DeliveryLayout from "@/components/delivery/DeliveryLayout";

export const metadata = {
    title: "GoCart. - Delivery Partner Hub",
    description: "GoCart. - Delivery Partner Logistics & Dispatch Portal",
};

export default function RootDeliveryLayout({ children }) {
    return (
        <DeliveryLayout>
            {children}
        </DeliveryLayout>
    );
}
