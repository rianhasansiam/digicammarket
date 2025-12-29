// Home page - 🚀 NEXT.JS 15 Optimized Server Component
import { Suspense } from 'react'
import StructuredData from './componets/shared/StructuredData';
import HomePageClient from './HomePageClient';
import { getHomePageData } from '@/lib/data/serverDataFetchers'
import GlobalLoadingPage from './componets/loading/GlobalLoadingPage'

// 🚀 NEXT.JS 15: Enhanced SEO with dynamic data
export async function generateMetadata() {
  try {
    const homeData = await getHomePageData()
    
    return {
      title: "Digicam Market - Premium Camera Store | Digital Cameras & Photography Equipment",
      description: `Discover ${homeData.stats.totalProducts} professional cameras across ${homeData.stats.totalCategories} categories. Shop quality cameras with ${homeData.stats.averageRating.toFixed(1)}-star average rating. Free shipping on orders over ৳10,000.`,
      keywords: "cameras, DSLR, mirrorless, photography, digital cameras, camera lenses, photography equipment, online camera store, Digicam Market",
      openGraph: {
        title: "Digicam Market - Premium Camera Store",
        description: `Discover ${homeData.stats.totalProducts} professional cameras with ${homeData.stats.averageRating.toFixed(1)}-star quality rating.`,
        type: "website",
        url: "https://digicammarket.com",
        images: [
          {
            url: homeData.featuredProducts?.[0]?.primaryImage || "/hero.jpg",
            width: 1200,
            height: 630,
            alt: "Digicam Market Premium Camera Collection"
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: "Digicam Market - Premium Camera Store",
        description: `Shop ${homeData.stats.totalProducts} professional cameras`,
        images: [homeData.featuredProducts?.[0]?.primaryImage || "/hero.jpg"]
      }
    }
  } catch (error) {
    // Fallback metadata if data fetching fails
    return {
      title: "Digicam Market - Premium Camera Store | Digital Cameras & Photography Equipment",
      description: "Discover professional cameras and photography equipment at Digicam Market. Shop quality DSLR, mirrorless cameras, lenses, and accessories. Free shipping on orders over ৳10,000.",
      keywords: "cameras, DSLR, mirrorless, photography, digital cameras, camera lenses, photography equipment, online camera store, Digicam Market",
      openGraph: {
        title: "Digicam Market - Premium Camera Store",
        description: "Discover professional cameras and photography equipment at Digicam Market. Quality cameras for photographers of all levels.",
        type: "website",
        url: "https://digicammarket.com",
        images: [
          {
            url: "/hero.jpg",
            width: 1200,
            height: 630,
            alt: "Digicam Market Premium Camera Collection"
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: "Digicam Market - Premium Camera Store",
        description: "Discover professional cameras and photography equipment at Digicam Market.",
        images: ["/hero.jpg"]
      }
    }
  }
}

export default function Home() {
  return (
    <>
      <StructuredData 
        type="organization" 
        data={{
          name: 'Digicam Market',
          url: 'https://digicammarket.com',
          logo: 'https://digicammarket.com/logo.png',
          description: 'Premium camera store offering quality cameras and photography equipment for everyone.',
          phone: '+880 18704 04001'
        }} 
      />
      <Suspense fallback={
        <GlobalLoadingPage 
          message="Bringing Classics to Life..." 
          showLogo={true}
        />
      }>
        {/* 🚀 OPTIMIZED: Client component with enhanced data handling */}
        <HomePageClient />
      </Suspense>
    </>
  );
}
