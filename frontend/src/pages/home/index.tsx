import { HeroSection } from "@/components/ui/home/hero-section"  
import { FeaturesSection } from "@/components/ui/home/features-section"
import { ProductsSection } from "@/components/ui/home/products-section"
import { StorySection } from "@/components/ui/home/story-section"
import { WhyUsSection } from "@/components/ui/home/why-us-section"
import { TestimonialsSection } from "@/components/ui/home/testimonials-section"
import { CTASection } from "@/components/ui/home/cta-section"
import { ThreeBackground } from "@/components/ui/home/three-background"
export default function HomePage() {
    return (
        <div className="relative min-h-screen bg-white">
            <ThreeBackground />
            <main>
                <HeroSection />
                <FeaturesSection />
                <ProductsSection />
                <StorySection />
                <WhyUsSection />
                <TestimonialsSection />
                <CTASection />
            </main>
        </div>
    )
}
