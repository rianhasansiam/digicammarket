'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useBanners } from '@/lib/hooks/useReduxData';

// Counter component for animated numbers
const Counter = ({ from = 0, to, duration = 2, suffix = "" }) => {
  const [count, setCount] = useState(from);
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.round(from + (to - from) * progress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration]);

  return <span>{count}{suffix}</span>;
};

const HeroClient = ({ 
  stats = [
    { number: "500+", label: "Premium Cameras" },
    { number: "500+", label: "Happy Photographers" },
    { number: "99%", label: "Satisfaction Rate" }
  ],
  // These props are still accepted for backward compatibility
  title,
  subtitle,
  mainTitle,
  description,
  productName,
  productPrice,
  productEmoji
}) => {
  // Fetch banners from Redux store
  const { data: bannersData, isLoading } = useBanners(true, { activeOnly: true });
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const resumeTimeoutRef = useRef(null);
  
  // Helper to pause auto-play and resume after delay
  const pauseAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);
  
  // Cleanup resume timeout on unmount
  useEffect(() => {
    return () => clearTimeout(resumeTimeoutRef.current);
  }, []);
  
  // Separate main carousel banners from side banners
  const allActiveBanners = Array.isArray(bannersData) 
    ? bannersData.filter(b => b.isActive).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  // Main banners for carousel (bannerType !== 'side' or undefined defaults to main)
  const mainBanners = allActiveBanners.filter(b => b.bannerType !== 'side');
  
  // Side banners (only first 2)
  const sideBanners = allActiveBanners.filter(b => b.bannerType === 'side').slice(0, 2);
  
  const hasBanners = mainBanners.length > 0;
  
  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || !hasBanners || mainBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, hasBanners, mainBanners.length]);
  
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    pauseAutoPlay();
  }, [pauseAutoPlay]);
  
  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + mainBanners.length) % mainBanners.length);
    pauseAutoPlay();
  }, [mainBanners.length, pauseAutoPlay]);
  
  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
    pauseAutoPlay();
  }, [mainBanners.length, pauseAutoPlay]);
  
  // If no banners, show default hero
  if (!hasBanners) {
    return (
      <section className="relative bg-gradient-to-br from-gray-700 to-black text-white overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 py-10 sm:py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Default Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight"
                >
                  {title || "Discover"}
                  <br />
                  <span className="text-gray-300">{subtitle || "Vintage Cameras"}</span>
                  <br />
                  {mainTitle}
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm sm:text-base md:text-xl text-gray-300 max-w-md"
                >
                  {description || "Capture moments the way they were meant to be remembered. A curated collection of vintage cameras."}
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/allProducts">
                  <button className="inline-flex items-center justify-center h-11 px-4 sm:px-8 py-2 text-base bg-white text-black hover:bg-gray-100 group rounded-md font-medium transition-colors">
                    Shop Collection
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                <Link href="/allProducts">
                  <button className="inline-flex cursor-pointer items-center justify-center h-11 px-4 sm:px-8 py-2 text-base border border-white text-white hover:bg-white hover:text-black rounded-md font-medium transition-colors">
                    View All Products
                  </button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-8 pt-4 sm:pt-6 md:pt-8 border-t border-gray-700"
              >
                {stats.map((stat, index) => {
                  const match = stat.number.match(/(\d+)(.*)$/);
                  const numericValue = match ? parseInt(match[1]) : 0;
                  const suffix = match ? match[2] : "";
                  
                  return (
                    <div key={stat.label || `stat-${index}`}>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                        <Counter to={numericValue} duration={3 + index * 0.2} suffix={suffix} />
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm">{stat.label}</p>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* Default Visual Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              {/* Main Camera Illustration */}
              <div className="relative">
                {/* Rotating Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 border-2 border-dashed border-white/20 rounded-full"
                />
                
                {/* Camera Body */}
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10 w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80"
                >
                  {/* Camera Frame */}
                  <div className="absolute inset-4 sm:inset-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                    {/* Camera Top */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 sm:w-20 h-6 sm:h-8 bg-gray-700 rounded-lg border border-white/10"></div>
                    
                    {/* Lens */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative"
                      >
                        {/* Outer Ring */}
                        <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 p-2 shadow-lg">
                          {/* Inner Ring */}
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 p-2">
                            {/* Glass */}
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-900 via-gray-900 to-black relative overflow-hidden">
                              {/* Lens Reflection */}
                              <motion.div
                                animate={{ 
                                  x: [-20, 60, -20],
                                  opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute top-2 left-2 w-8 h-8 sm:w-12 sm:h-12 bg-white/30 rounded-full blur-md"
                              />
                              {/* Aperture Lines */}
                              <div className="absolute inset-4 border-2 border-white/10 rounded-full"></div>
                              <div className="absolute inset-8 border border-white/5 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Flash */}
                    <motion.div
                      animate={{ 
                        opacity: [0.5, 1, 0.5],
                        boxShadow: [
                          '0 0 10px rgba(255,255,255,0.3)',
                          '0 0 20px rgba(255,255,255,0.6)',
                          '0 0 10px rgba(255,255,255,0.3)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute top-4 right-4 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full"
                    />
                    
                    {/* Viewfinder */}
                    <div className="absolute top-4 left-4 w-6 h-4 sm:w-8 sm:h-5 bg-gray-600 rounded border border-white/10"></div>
                  </div>
                </motion.div>

                {/* Floating Elements - Premium Brand Cards with Logo Images */}
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                    x: [0, 5, 0],
                  }}
                  transition={{ duration: 5, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
                  className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 group cursor-pointer"
                >
                  <div className="relative bg-gradient-to-br from-white/95 to-gray-100 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/50 shadow-lg shadow-black/20 overflow-hidden hover:scale-105 transition-transform duration-300">
                    {/* Shine effect */}
                    <motion.div 
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
                    />
                    <div className="relative flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Canon_wordmark.svg/200px-Canon_wordmark.svg.png"
                        alt="Canon"
                        width={60}
                        height={24}
                        className="h-4 sm:h-5 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ 
                    y: [0, 10, 0],
                    x: [0, -5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1, ease: "easeInOut" }}
                  className="absolute -bottom-1 -left-2 sm:-bottom-2 sm:-left-4 group cursor-pointer"
                >
                  <div className="relative bg-gradient-to-br from-white/95 to-gray-100 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/50 shadow-lg shadow-black/20 overflow-hidden hover:scale-105 transition-transform duration-300">
                    {/* Shine effect */}
                    <motion.div 
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 3, delay: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
                    />
                    <div className="relative flex items-center justify-center">
                      <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/200px-Sony_logo.svg.png"
                        alt="Sony"
                        width={50}
                        height={20}
                        className="h-3.5 sm:h-4 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                  }}
                  transition={{ duration: 6, repeat: Infinity, delay: 0.8, ease: "easeInOut" }}
                  className="absolute top-1/2 -right-6 sm:-right-8 group cursor-pointer"
                >
                  <div className="relative bg-white backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-blue-400 shadow-lg shadow-blue-500/30 overflow-hidden hover:scale-105 transition-transform duration-300">
                    {/* Shine effect */}
                    <motion.div 
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, delay: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    />
                    <div className="relative flex items-center justify-center">
                      <Image 
                        src="https://i.ibb.co/DfbZ3FZb/IMG-4604.png"
                        alt="Samsung"
                        width={100}
                        height={100}
                        className="h-4 sm:h-5 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Background Glow Effects */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-blue-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
              />
            </motion.div>
          </div>
        </div>
      </section>
    );
  }
  
  const currentBanner = mainBanners[currentSlide];
  
  return (
    <section className="bg-gray-100 py-4 sm:py-6">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Banner Carousel - Left Side */}
          <div className="lg:w-[70%] relative">
            <div className="relative h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  {/* Banner Image */}
                  <Image
                    src={currentBanner.image}
                    alt={currentBanner.title || 'Banner'}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                  
                  {/* Banner Content */}
                  <div className="absolute inset-0 flex items-center p-6 sm:p-10 md:p-12">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="max-w-lg text-white space-y-3 sm:space-y-4"
                    >
                      {currentBanner.subtitle && (
                        <span className="inline-block text-xs sm:text-sm font-medium text-blue-300">
                          {currentBanner.subtitle}
                        </span>
                      )}
                      
                      {currentBanner.title && (
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                          {currentBanner.title}
                        </h1>
                      )}
                      
                      {currentBanner.description && (
                        <p className="text-sm sm:text-base md:text-lg text-gray-200 max-w-md">
                          {currentBanner.description}
                        </p>
                      )}
                      
                      {currentBanner.link && currentBanner.buttonText && (
                        <Link href={currentBanner.link}>
                          <button className="mt-2 inline-flex items-center justify-center h-10 sm:h-11 px-5 sm:px-6 text-sm sm:text-base bg-white text-black hover:bg-gray-100 group rounded-lg font-medium transition-all hover:shadow-lg">
                            {currentBanner.buttonText}
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </Link>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Navigation Arrows */}
              {mainBanners.length > 1 && (
                <>
                  <button
                    onClick={goToPrevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white shadow-lg rounded-full text-gray-800 transition-all z-10"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white shadow-lg rounded-full text-gray-800 transition-all z-10"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Dots Indicator */}
              {mainBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                  {mainBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all ${
                        index === currentSlide 
                          ? 'w-6 h-2 bg-orange-500 rounded-full' 
                          : 'w-2 h-2 bg-white/70 hover:bg-white rounded-full'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Side Banners - Right Side */}
          <div className="lg:w-[30%] flex flex-row lg:flex-col gap-4">
            {sideBanners.length > 0 ? (
              <>
                {/* First Side Banner */}
                <Link 
                  href={sideBanners[0]?.link || '/allProducts'} 
                  className="flex-1 lg:flex-none lg:h-[calc(50%-8px)] relative rounded-xl overflow-hidden group cursor-pointer"
                >
                  <div className="relative h-[150px] sm:h-[180px] lg:h-full w-full">
                    <Image
                      src={sideBanners[0]?.image || '/placeholder.jpg'}
                      alt={sideBanners[0]?.title || 'Banner'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      {sideBanners[0]?.title && (
                        <h3 className="text-lg sm:text-xl font-bold leading-tight mb-1">
                          {sideBanners[0].title}
                        </h3>
                      )}
                      {sideBanners[0]?.subtitle && (
                        <p className="text-xs sm:text-sm text-gray-200">
                          {sideBanners[0].subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                
                {/* Second Side Banner */}
                {sideBanners[1] && (
                  <Link 
                    href={sideBanners[1]?.link || '/allProducts'} 
                    className="flex-1 lg:flex-none lg:h-[calc(50%-8px)] relative rounded-xl overflow-hidden group cursor-pointer"
                  >
                    <div className="relative h-[150px] sm:h-[180px] lg:h-full w-full">
                      <Image
                        src={sideBanners[1]?.image || '/placeholder.jpg'}
                        alt={sideBanners[1]?.title || 'Banner'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        {sideBanners[1]?.title && (
                          <h3 className="text-lg sm:text-xl font-bold leading-tight mb-1">
                            {sideBanners[1].title}
                          </h3>
                        )}
                        {sideBanners[1]?.subtitle && (
                          <p className="text-xs sm:text-sm text-gray-200">
                            {sideBanners[1].subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )}
                
                {/* Placeholder if only 1 side banner */}
                {sideBanners.length === 1 && (
                  <Link 
                    href="/allProducts" 
                    className="flex-1 lg:flex-none lg:h-[calc(50%-8px)] relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 group cursor-pointer"
                  >
                    <div className="relative h-[150px] sm:h-[180px] lg:h-full w-full flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <h3 className="text-lg sm:text-xl font-bold mb-2">Shop Now</h3>
                        <p className="text-xs sm:text-sm text-gray-300">Explore our collection</p>
                        <ArrowRight className="mx-auto mt-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                )}
              </>
            ) : (
              // Placeholder side banners if no banners available
              <>
                <Link 
                  href="/allProducts" 
                  className="flex-1 lg:flex-none lg:h-[calc(50%-8px)] relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 group cursor-pointer"
                >
                  <div className="relative h-[150px] sm:h-[180px] lg:h-full w-full flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <h3 className="text-lg sm:text-xl font-bold mb-2">New Arrivals</h3>
                      <p className="text-xs sm:text-sm text-blue-100">Check out latest products</p>
                    </div>
                  </div>
                </Link>
                <Link 
                  href="/allProducts" 
                  className="flex-1 lg:flex-none lg:h-[calc(50%-8px)] relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 group cursor-pointer"
                >
                  <div className="relative h-[150px] sm:h-[180px] lg:h-full w-full flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <h3 className="text-lg sm:text-xl font-bold mb-2">Best Sellers</h3>
                      <p className="text-xs sm:text-sm text-gray-300">Top rated products</p>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroClient;
