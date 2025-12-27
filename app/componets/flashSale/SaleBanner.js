'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, ArrowRight, X, Flame, Package, Tag, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Countdown Hook
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

const SaleBanner = ({ salesData = [] }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const currentSale = activeSales[currentIndex];
  const countdown = useCountdown(currentSale?.endDate);

  // Auto-rotate between sales
  useEffect(() => {
    if (activeSales.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSales.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSales.length]);

  // Don't render if no active sales or dismissed
  if (!isVisible || activeSales.length === 0 || countdown.expired) return null;

  const getSaleIcon = (type) => {
    switch (type) {
      case 'flash': return <Zap className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'bundle': return <Package className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'seasonal': return <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'clearance': return <Tag className="w-4 h-4 sm:w-5 sm:h-5" />;
      default: return <Flame className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="relative overflow-hidden"
        style={{ backgroundColor: currentSale.backgroundColor || '#dc2626' }}
      >
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              x: ['-100%', '100%'],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />
          {/* Sparkle effects */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1 left-[10%] text-white/40"
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-1 right-[20%] text-white/40"
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="flex items-center justify-center py-2.5 sm:py-3">
            {/* Main Content */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
              {/* Sale Type Badge */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                style={{ 
                  backgroundColor: currentSale.accentColor || '#fbbf24',
                  color: currentSale.backgroundColor || '#dc2626'
                }}
              >
                {getSaleIcon(currentSale.saleType)}
                <span className="uppercase tracking-wide">{currentSale.saleType} Sale</span>
              </motion.div>

              {/* Sale Title */}
              <div className="flex items-center gap-2" style={{ color: currentSale.textColor || '#ffffff' }}>
                <span className="font-bold text-sm sm:text-base md:text-lg">{currentSale.title}</span>
                {currentSale.discountValue > 0 && (
                  <span 
                    className="font-extrabold text-base sm:text-lg md:text-xl animate-pulse"
                    style={{ color: currentSale.accentColor || '#fbbf24' }}
                  >
                    {currentSale.discountType === 'percentage' 
                      ? `${currentSale.discountValue}% OFF` 
                      : `৳${currentSale.discountValue} OFF`}
                  </span>
                )}
              </div>

              {/* Countdown Timer */}
              {currentSale.showCountdown && (
                <div className="flex items-center gap-1.5 sm:gap-2" style={{ color: currentSale.textColor || '#ffffff' }}>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80" />
                  <div className="flex items-center gap-1 text-xs sm:text-sm font-mono font-bold">
                    {countdown.days > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-white/20">{countdown.days}d</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-white/20">{String(countdown.hours).padStart(2, '0')}h</span>
                    <span>:</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/20">{String(countdown.minutes).padStart(2, '0')}m</span>
                    <span>:</span>
                    <motion.span 
                      key={countdown.seconds}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 rounded bg-white/20"
                    >
                      {String(countdown.seconds).padStart(2, '0')}s
                    </motion.span>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <Link href="/allProducts">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-xl"
                  style={{ 
                    backgroundColor: currentSale.textColor || '#ffffff',
                    color: currentSale.backgroundColor || '#dc2626'
                  }}
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
              </Link>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-2 sm:right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
              style={{ color: currentSale.textColor || '#ffffff' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Multiple Sales Indicator */}
          {activeSales.length > 1 && (
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
              {activeSales.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaleBanner;
