'use client';

import { motion, animate } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Counter component for animated numbers
const Counter = ({ from = 0, to, duration = 2, suffix = "" }) => {
  const [count, setCount] = useState(from);
  
  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      onUpdate: (value) => setCount(Math.round(value))
    });
    return controls.stop;
  }, [from, to, duration]);

  return <span>{count}{suffix}</span>;
};

const HeroClient = ({ 
  title = "Discover",
  subtitle = "Vintage", 
  mainTitle = "Cameras",
  description = "Capture every moment with our collection of professional cameras. Quality, performance, and innovation in every shot.",
  stats = [
    { number: "500+", label: "Premium Cameras" },
    { number: "500+", label: "Happy Photographers" },
    { number: "99%", label: "Satisfaction Rate" }
  ],
  productName = "Professional Camera",
  productPrice = "৳25,000",
  productEmoji = "�"
}) => {



    
  return (
    <section className="relative bg-gradient-to-br from-gray-700 to-black text-white overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-10 sm:py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          {/* Content */}
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
                {title}
                <br />
                <span className="text-gray-300">{subtitle}</span>
                <br />
                {mainTitle}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base md:text-xl text-gray-300 max-w-md"
              >
                {description}
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex  flex-wrap gap-4"
            >
              <Link href="/allProducts">
                <button 
                  className="inline-flex items-center justify-center h-11 px-4 sm:px-8 py-2 text-base bg-white text-black hover:bg-gray-100 group rounded-md font-medium transition-colors"
                >
                  Shop Collection
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <Link  href="/allProducts">
                <button 
                  className="inline-flex cursor-pointer items-center justify-center h-11 px-4 sm:px-8 py-2 text-base border border-white text-white hover:bg-white hover:text-black rounded-md font-medium transition-colors"
                >
                  View All Products
                </button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-8 pt-4 sm:pt-6 md:pt-8 border-t border-gray-700 max-md:w-[95vw] max-md:mx-auto"
            >
              {stats.map((stat, index) => {
                // Extract numeric value and suffix from stat.number
                const match = stat.number.match(/(\d+)(.*)$/);
                const numericValue = match ? parseInt(match[1]) : 0;
                const suffix = match ? match[2] : "";
                
                return (
                  <div key={stat.label || `stat-${index}`}>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                      <Counter 
                        to={numericValue} 
                        duration={3 + index * 0.2} 
                        suffix={suffix}
                      />
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm">{stat.label}</p>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Visual */}
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
};

export default HeroClient;