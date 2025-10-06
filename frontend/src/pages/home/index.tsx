import { HeroSection } from "@/components/ui/hero-section"  
import { FeaturesSection } from "@/components/ui/features-section"
import { ProductsSection } from "@/components/ui/products-section"
import { StorySection } from "@/components/ui/story-section"
import { WhyUsSection } from "@/components/ui/why-us-section"
import { TestimonialsSection } from "@/components/ui/testimonials-section"
import { CTASection } from "@/components/ui/cta-section"
import { ThreeBackground } from "@/components/ui/three-background"
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
