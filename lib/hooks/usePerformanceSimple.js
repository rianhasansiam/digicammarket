import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

// 🚀 NEXT.JS 15: Simple performance monitoring hook
export function usePerformanceMonitor() {
  const performance = useMemo(() => {
    // Navigation timing metrics
    const getNavigationMetrics = () => {
      if (typeof window === 'undefined' || !window.performance?.getEntriesByType) {
        return null
      }

      const navigation = window.performance.getEntriesByType('navigation')[0]
      if (!navigation) return null

      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        dnsLookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
        tcpConnection: Math.round(navigation.connectEnd - navigation.connectStart),
        serverResponse: Math.round(navigation.responseStart - navigation.requestStart),
        resourcesLoaded: Math.round(navigation.loadEventEnd - navigation.responseEnd),
        timeToInteractive: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)
      }
    }

    // Resource timing metrics
    const getResourceMetrics = () => {
      if (typeof window === 'undefined' || !window.performance?.getEntriesByType) {
        return null
      }

      const resources = window.performance.getEntriesByType('resource')
      
      const byType = resources.reduce((acc, resource) => {
        const type = resource.initiatorType || 'other'
        if (!acc[type]) {
          acc[type] = { count: 0, totalSize: 0, totalTime: 0 }
        }
        
        acc[type].count++
        acc[type].totalSize += resource.transferSize || 0
        acc[type].totalTime += resource.duration || 0
        
        return acc
      }, {})

      return {
        totalResources: resources.length,
        byType,
        totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        slowestResource: [...resources]
          .sort((a, b) => (b.duration || 0) - (a.duration || 0))[0]?.name
      }
    }

    // Memory usage (if available)
    const getMemoryMetrics = () => {
      if (typeof window === 'undefined' || !window.performance?.memory) {
        return null
      }

      const memory = window.performance.memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
      }
    }

    // API performance tracking
    const trackApiCall = (endpoint, duration, success) => {
      if (typeof window === 'undefined') return
      
      const key = `api_performance_${endpoint}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      
      existing.push({
        timestamp: Date.now(),
        duration,
        success,
        date: new Date().toISOString()
      })

      if (existing.length > 50) {
        existing.splice(0, existing.length - 50)
      }

      localStorage.setItem(key, JSON.stringify(existing))
    }

    // Get API performance stats
    const getApiStats = (endpoint) => {
      if (typeof window === 'undefined') return null

      const stats = {}
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('api_performance_')) {
          const endpointName = key.replace('api_performance_', '')
          
          if (endpoint && endpointName !== endpoint) continue
          
          const data = JSON.parse(localStorage.getItem(key) || '[]')
          if (data.length === 0) continue
          
          const durations = data.map(d => d.duration)
          const successes = data.filter(d => d.success).length
          
          stats[endpointName] = {
            calls: data.length,
            averageDuration: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            successRate: Math.round((successes / data.length) * 100),
            lastCall: data[data.length - 1]?.date
          }
        }
      }
      
      return stats
    }

    return {
      getNavigationMetrics,
      getResourceMetrics,
      getMemoryMetrics,
      trackApiCall,
      getApiStats
    }
  }, [])

  return performance
}

// 🚀 Real-time performance monitoring hook
export function useRealTimePerformance() {
  const performanceMonitor = usePerformanceMonitor()
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      if (typeof window === 'undefined') return null
      
      return {
        navigation: performanceMonitor.getNavigationMetrics(),
        resources: performanceMonitor.getResourceMetrics(),
        memory: performanceMonitor.getMemoryMetrics(),
        api: performanceMonitor.getApiStats(),
        timestamp: new Date().toISOString()
      }
    },
    refetchInterval: 30000,
    enabled: typeof window !== 'undefined'
  })

  return {
    metrics,
    isLoading,
    trackApiCall: performanceMonitor.trackApiCall
  }
}

// 🚀 Page-specific performance tracking
export function usePagePerformance(pageName) {
  const pageMetrics = useMemo(() => {
    if (typeof window === 'undefined') return null
    
    const startTime = performance.now()
    
    return {
      startTime,
      pageName,
      getPageLoadTime: () => performance.now() - startTime,
      recordInteraction: (action, duration = 0) => {
        const key = `page_interaction_${pageName}`
        const existing = JSON.parse(localStorage.getItem(key) || '[]')
        
        existing.push({
          action,
          duration,
          timestamp: Date.now(),
          date: new Date().toISOString()
        })
        
        if (existing.length > 20) {
          existing.splice(0, existing.length - 20)
        }
        
        localStorage.setItem(key, JSON.stringify(existing))
      }
    }
  }, [pageName])

  return pageMetrics
}

// 🚀 Bundle performance analyzer
export function useBundlePerformance() {
  const { data: bundleMetrics } = useQuery({
    queryKey: ['bundle-performance'],
    queryFn: async () => {
      if (typeof window === 'undefined') return null
      
      const resources = window.performance.getEntriesByType('resource')
      
      const jsResources = resources.filter(r => 
        r.name.includes('.js') || r.initiatorType === 'script'
      )
      
      const cssResources = resources.filter(r => 
        r.name.includes('.css') || r.initiatorType === 'css'
      )
      
      const imageResources = resources.filter(r => 
        r.initiatorType === 'img' || 
        r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      )

      const analyze = (resources, type) => {
        if (resources.length === 0) return null
        
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        const totalTime = resources.reduce((sum, r) => sum + (r.duration || 0), 0)
        const largest = [...resources].sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0]
        const slowest = [...resources].sort((a, b) => (b.duration || 0) - (a.duration || 0))[0]
        
        return {
          type,
          count: resources.length,
          totalSize: Math.round(totalSize / 1024), // KB
          totalTime: Math.round(totalTime),
          averageSize: Math.round(totalSize / resources.length / 1024), // KB
          averageTime: Math.round(totalTime / resources.length),
          largestFile: {
            name: largest?.name?.split('/').pop() || 'unknown',
            size: Math.round((largest?.transferSize || 0) / 1024) // KB
          },
          slowestFile: {
            name: slowest?.name?.split('/').pop() || 'unknown',  
            time: Math.round(slowest?.duration || 0)
          }
        }
      }

      return {
        javascript: analyze(jsResources, 'JavaScript'),
        css: analyze(cssResources, 'CSS'),
        images: analyze(imageResources, 'Images'),
        totalResources: resources.length,
        totalTransferSize: Math.round(
          resources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024
        ) // KB
      }
    },
    enabled: typeof window !== 'undefined',
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  return bundleMetrics
}

// 🚀 Core Web Vitals monitoring
export function useCoreWebVitals() {
  const { data: vitals, isLoading } = useQuery({
    queryKey: ['core-web-vitals'],
    queryFn: async () => {
      if (typeof window === 'undefined') return null
      
      const navigation = window.performance.getEntriesByType('navigation')[0]
      if (!navigation) return null

      return {
        lcp: Math.round(navigation.loadEventEnd - navigation.fetchStart), // Largest Contentful Paint approx
        fcp: Math.round(navigation.responseEnd - navigation.fetchStart), // First Contentful Paint approx
        tti: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart), // Time to Interactive approx
        timestamp: new Date().toISOString()
      }
    },
    enabled: typeof window !== 'undefined',
    refetchInterval: 60000,
    staleTime: 30000
  })

  return { vitals, isLoading }
}