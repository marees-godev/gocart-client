'use client'

import Hero from "@/components/Hero"
import TrustBar from "@/components/TrustBar"
import LatestProducts from "@/components/LatestProducts"
import PromoBanner from "@/components/PromoBanner"
import BestSelling from "@/components/BestSelling"
import RecentlyViewed from "@/components/RecentlyViewed"
import OurSpecs from "@/components/OurSpec"
import Newsletter from "@/components/Newsletter"

export default function Home() {
    return (
        <div className="space-y-6 sm:space-y-12 pb-12">
            <Hero />
            <TrustBar />
            <LatestProducts />
            <PromoBanner />
            <BestSelling />
            <RecentlyViewed />
            <OurSpecs />
            <Newsletter />
        </div>
    )
}
