'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryClient({ categories = [] }) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Filter to show only active categories
  const activeCategories = categories.filter(category => 
    category.status === 'active' || !category.hasOwnProperty('status')
  );

  // Debug: Check for missing IDs
  if (process.env.NODE_ENV === 'development') {
    activeCategories.forEach((category, index) => {
      if (!category._id && !category.name) {
        console.warn(`CategoryClient: Category at index ${index} is missing both _id and name:`, category);
      }
    });
  }

  // Check if arrows should be visible
  const checkForArrows = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Scroll function
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply for faster scroll
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = 'grab';
      }
    }
  };

  useEffect(() => {
    checkForArrows();
    window.addEventListener('resize', checkForArrows);
    
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkForArrows);
    }

    return () => {
      window.removeEventListener('resize', checkForArrows);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkForArrows);
      }
    };
  }, [activeCategories]);

  return (
    <div className="relative px-4">
      {/* Section Header */}
      <div className="text-center my-6 sm:my-8 md:my-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-2 sm:mb-4">
          SHOP BY CATEGORY
        </h2>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
          Explore our collection of camera categories
        </p>
      </div>

      {/* Scroll Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </button>
        )}

        {/* Categories Horizontal Scroll */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="flex gap-3 sm:gap-5 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth py-2 sm:py-4 cursor-grab select-none justify-center"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {activeCategories.map((category, index) => (
            <Link 
              key={category.id || category.name || index}
              href={`/allProducts?category=${encodeURIComponent(category.name)}`}
              className="group/item flex-shrink-0 text-center min-w-[80px] sm:min-w-[100px] md:min-w-[140px]"
              draggable="false"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 mx-auto mb-2 sm:mb-3 rounded-full overflow-hidden border-2 border-gray-200 group-hover/item:border-black transition-colors">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300 pointer-events-none"
                  unoptimized={category.image?.startsWith('http') && (category.image.includes('ibb.co') || category.image.includes('imagebb'))}
                  priority={index < 6}
                  quality={85}
                  draggable="false"
                />
              </div>
              <h3 className="font-semibold text-xs sm:text-sm md:text-base text-black group-hover/item:text-gray-600 transition-colors">
                {category.name}
              </h3>
              {/* <p className="text-xs text-gray-500 mt-1">
                {category.description || 'Explore this category'}
              </p> */}
              {category.productCount !== undefined && (
                <p className="text-xs text-gray-400 mt-1">
                  {category.productCount} items
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Hint Text */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-400 md:hidden">
           Swipe to see more categories
        </p>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}