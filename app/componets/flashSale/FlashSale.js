'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Zap, 
  Clock, 
  ArrowRight, 
  Package, 
  Tag,
  Calendar,
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

// Countdown Timer Hook
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

// Single Sale Card Component
const SaleCard = ({ sale, products = [] }) => {
  const countdown = useCountdown(sale.endDate);
  
  // Get products that are part of this sale
  const saleProducts = useMemo(() => {
    if (!sale.productIds?.length) return [];
    return products.filter(p => 
      sale.productIds.includes(p._id) || sale.productIds.includes(p.id)
    ).slice(0, 4);
  }, [sale.productIds, products]);

  const getSaleTypeIcon = (type) => {
    switch (type) {
      case 'flash': return <Zap className="w-5 h-5" />;
      case 'bundle': return <Package className="w-5 h-5" />;
      case 'seasonal': return <Calendar className="w-5 h-5" />;
      case 'clearance': return <Tag className="w-5 h-5" />;
      default: return <Flame className="w-5 h-5" />;
    }
  };

  if (countdown.expired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl shadow-xl"
      style={{ backgroundColor: sale.backgroundColor || '#1f2937' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Left Content */}
          <div className="space-y-4">
            {/* Sale Type Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${sale.accentColor}30` || 'rgba(251, 191, 36, 0.2)',
                color: sale.accentColor || '#fbbf24'
              }}
            >
              {getSaleTypeIcon(sale.saleType)}
              <span className="uppercase tracking-wider">{sale.saleType} Sale</span>
            </motion.div>

            {/* Title */}
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold"
              style={{ color: sale.textColor || '#ffffff' }}
            >
              {sale.title}
            </motion.h2>

            {/* Subtitle */}
            {sale.subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg opacity-80"
                style={{ color: sale.textColor || '#ffffff' }}
              >
                {sale.subtitle}
              </motion.p>
            )}

            {/* Discount Badge */}
            {sale.discountValue > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="inline-block"
              >
                <div 
                  className="px-6 py-3 rounded-xl font-bold text-xl md:text-2xl shadow-lg"
                  style={{ 
                    backgroundColor: sale.accentColor || '#fbbf24',
                    color: sale.backgroundColor || '#1f2937'
                  }}
                >
                  {sale.discountType === 'percentage' 
                    ? `${sale.discountValue}% OFF` 
                    : `৳${sale.discountValue} OFF`
                  }
                </div>
              </motion.div>
            )}

            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/allProducts">
                <button 
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ 
                    backgroundColor: sale.textColor || '#ffffff',
                    color: sale.backgroundColor || '#1f2937'
                  }}
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Content - Countdown & Products */}
          <div className="space-y-6">
            {/* Countdown Timer */}
            {sale.showCountdown && !countdown.expired && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div 
                  className="flex items-center space-x-2 text-sm font-medium opacity-80"
                  style={{ color: sale.textColor || '#ffffff' }}
                >
                  <Clock className="w-4 h-4" />
                  <span>Ends In</span>
                </div>
                <div className="flex space-x-2 md:space-x-3">
                  {[
                    { value: countdown.days, label: 'Days' },
                    { value: countdown.hours, label: 'Hrs' },
                    { value: countdown.minutes, label: 'Min' },
                    { value: countdown.seconds, label: 'Sec' }
                  ].map((item, idx) => (
                    <motion.div 
                      key={item.label}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div 
                        className="w-14 md:w-16 h-14 md:h-16 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          color: sale.textColor || '#ffffff',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <span 
                        className="text-xs mt-1 opacity-70"
                        style={{ color: sale.textColor || '#ffffff' }}
                      >
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Featured Products Preview */}
            {saleProducts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <div 
                  className="text-sm font-medium opacity-70"
                  style={{ color: sale.textColor || '#ffffff' }}
                >
                  Featured Products
                </div>
                <div className="flex -space-x-2">
                  {saleProducts.map((product, idx) => (
                    <motion.div
                      key={product._id || product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                      className="relative"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white overflow-hidden shadow-lg">
                        {product.primaryImage ? (
                          <Image 
                            src={product.primaryImage} 
                            alt={product.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: sale.accentColor || '#fbbf24' }}
                          >
                            <Package className="w-6 h-6" style={{ color: sale.backgroundColor }} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {sale.productIds?.length > 4 && (
                    <div 
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-lg"
                      style={{ 
                        backgroundColor: sale.accentColor || '#fbbf24',
                        color: sale.backgroundColor || '#1f2937',
                        borderColor: sale.textColor || '#ffffff'
                      }}
                    >
                      +{sale.productIds.length - 4}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main FlashSale Component
const FlashSale = ({ salesData = [], productsData = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Filter active sales
  const activeSales = useMemo(() => {
    const now = new Date();
    return salesData
      .filter(sale => {
        if (sale.status !== 'active') return false;
        const start = new Date(sale.startDate);
        const end = new Date(sale.endDate);
        return now >= start && now <= end;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [salesData]);

  // Auto-rotate sales
  useEffect(() => {
    if (!isAutoPlaying || activeSales.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSales.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, activeSales.length]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + activeSales.length) % activeSales.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % activeSales.length);
  };

  // Don't render if no active sales
  if (activeSales.length === 0) return null;

  return (
    <section className="py-8 md:py-12 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <Flame className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Hot Deals
              </h2>
              <p className="text-gray-600 text-sm">Limited time offers you don&apos;t want to miss!</p>
            </div>
          </div>

          {/* Navigation Arrows (for multiple sales) */}
          {activeSales.length > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex space-x-1">
                {activeSales.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex 
                        ? 'bg-red-600 w-6' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Sales Carousel */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <SaleCard 
                sale={activeSales[currentIndex]} 
                products={productsData}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* All Sales Link */}
        {activeSales.length > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <Link href="/allProducts" className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium">
              <span>View All Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default FlashSale;
