import { cache } from 'next/cache'
import { 
  getCachedProducts,
  getCachedCategories, 
  getCachedReviews,
  getCachedOrders,
  getCachedUsers,
  getCachedCoupons,
  getOptimizedHomePageData
} from '@/lib/cache/serverCache'

// 🚀 NEXT.JS 15: Server Actions with advanced caching and revalidation

export async function getServerSideData(dataType, options = {}) {
  'use server'
  
  const { 
    enableCache = true,
    forceRefresh = false,
    userId = null,
    filters = {}
  } = options



  try {
    let data = []
    
    switch (dataType) {
      case 'products':
        data = await getCachedProducts()
        
        // Apply filters if provided
        if (filters.category) {
          data = data.filter(p => p.category === filters.category)
        }
        if (filters.priceRange) {
          const [min, max] = filters.priceRange
          data = data.filter(p => p.price >= min && p.price <= max)
        }
        if (filters.inStock) {
          data = data.filter(p => p.isInStock)
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          data = data.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.shortDescription.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.brand.toLowerCase().includes(searchTerm)
          )
        }
        break

      case 'categories':
        data = await getCachedCategories()
        
        if (filters.activeOnly) {
          data = data.filter(c => c.isActive)
        }
        if (filters.withProducts) {
          data = data.filter(c => c.hasProducts)
        }
        break

      case 'reviews':
        data = await getCachedReviews()
        
        if (filters.productId) {
          data = data.filter(r => r.productId === filters.productId)
        }
        if (filters.approved) {
          data = data.filter(r => r.isApproved)
        }
        if (filters.rating) {
          data = data.filter(r => r.rating >= filters.rating)
        }
        break

      case 'orders':
        data = await getCachedOrders()
        
        if (filters.userId) {
          data = data.filter(o => o.customerId === filters.userId)
        }
        if (filters.status) {
          data = data.filter(o => o.status === filters.status)
        }
        if (filters.dateRange) {
          const [start, end] = filters.dateRange
          data = data.filter(o => {
            const orderDate = new Date(o.createdAt)
            return orderDate >= start && orderDate <= end
          })
        }
        break

      case 'users':
        data = await getCachedUsers()
        
        if (filters.role) {
          data = data.filter(u => u.role === filters.role)
        }
        if (filters.verified) {
          data = data.filter(u => u.isVerified)
        }
        break

      case 'coupons':
        data = await getCachedCoupons()
        
        if (filters.active) {
          const now = new Date()
          data = data.filter(c => 
            c.isActive && 
            new Date(c.validFrom) <= now && 
            new Date(c.validTo) >= now
          )
        }
        break

      case 'homepage':
        data = await getOptimizedHomePageData()
        break

      default:
        throw new Error(`Unknown data type: ${dataType}`)
    }


    
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      cached: enableCache
    }

  } catch (error) {
    // Sanitize error message to prevent format string injection
    const errorMessage = String(error?.message || 'Unknown error').replace(/%/g, '%%')
    console.error(`❌ Server Action: ${dataType} fetch failed:`, errorMessage)
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  }
}

// 🚀 Server Action for single product with enhanced caching
export async function getProductById(productId) {
  'use server'
  
  if (!productId) {
    return {
      success: false,
      data: null,
      error: 'Product ID is required'
    }
  }

  try {

    
    // Get all products and find the specific one (leverages cache)
    const products = await getCachedProducts()
    const product = products.find(p => p._id === productId)
    
    if (!product) {
      return {
        success: false,
        data: null,
        error: 'Product not found'
      }
    }

    // Get related products from the same category
    const relatedProducts = products
      .filter(p => p.category === product.category && p._id !== productId)
      .slice(0, 4)

    // Get reviews for this product
    const allReviews = await getCachedReviews()
    const productReviews = allReviews.filter(r => r.productId === productId && r.isApproved)



    return {
      success: true,
      data: {
        product,
        relatedProducts,
        reviews: productReviews,
        reviewStats: {
          count: productReviews.length,
          averageRating: productReviews.length > 0 
            ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length 
            : 0
        }
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    // Sanitize error message to prevent format string injection
    const errorMessage = String(error?.message || 'Unknown error').replace(/%/g, '%%')
    console.error(`❌ Server Action: Product ${productId} fetch failed:`, errorMessage)
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  }
}

// 🚀 Server Action for user-specific data (orders, reviews, etc.)
export async function getUserData(userId, dataTypes = ['orders']) {
  'use server'
  
  if (!userId) {
    return {
      success: false,
      data: null,
      error: 'User ID is required'
    }
  }

  try {

    
    const result = {}

    // Fetch requested data types in parallel
    const promises = dataTypes.map(async (dataType) => {
      switch (dataType) {
        case 'orders':
          const orders = await getCachedOrders()
          result.orders = orders.filter(o => o.customerId === userId)
          break

        case 'reviews':
          const reviews = await getCachedReviews()
          result.reviews = reviews.filter(r => r.userId === userId)
          break

        case 'profile':
          const users = await getCachedUsers()
          result.profile = users.find(u => u._id === userId)
          break

        default:
          console.warn(`Unknown user data type: ${dataType}`)
      }
    })

    await Promise.all(promises)

    // Calculate user statistics
    const stats = {
      totalOrders: result.orders?.length || 0,
      totalSpent: result.orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0,
      totalReviews: result.reviews?.length || 0,
      averageRating: result.reviews?.length > 0 
        ? result.reviews.reduce((sum, r) => sum + r.rating, 0) / result.reviews.length 
        : 0
    }



    return {
      success: true,
      data: {
        ...result,
        stats
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    // Sanitize error message to prevent format string injection
    const errorMessage = String(error?.message || 'Unknown error').replace(/%/g, '%%')
    console.error(`❌ Server Action: User ${userId} data fetch failed:`, errorMessage)
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  }
}

// 🚀 Server Action for admin dashboard data
export async function getAdminDashboardData() {
  'use server'
  
  try {

    
    // Get all data in parallel
    const [products, categories, orders, users, reviews, coupons] = await Promise.all([
      getCachedProducts(),
      getCachedCategories(),
      getCachedOrders(),
      getCachedUsers(),
      getCachedReviews(),
      getCachedCoupons()
    ])

    // Calculate comprehensive statistics
    const stats = {
      products: {
        total: products.length,
        inStock: products.filter(p => p.isInStock).length,
        lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
        outOfStock: products.filter(p => p.stock === 0).length
      },
      orders: {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        completed: orders.filter(o => o.status === 'completed').length,
        totalRevenue: orders.filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + o.totalAmount, 0)
      },
      users: {
        total: users.length,
        verified: users.filter(u => u.isVerified).length,
        admins: users.filter(u => u.role === 'admin').length,
        customers: users.filter(u => u.role === 'customer').length
      },
      reviews: {
        total: reviews.length,
        approved: reviews.filter(r => r.isApproved).length,
        pending: reviews.filter(r => !r.isApproved).length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0
      },
      coupons: {
        total: coupons.length,
        active: coupons.filter(c => c.isActive).length,
        expired: coupons.filter(c => new Date(c.validTo) < new Date()).length
      }
    }

    // Recent activity
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
    
    const recentReviews = [...reviews]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)



    return {
      success: true,
      data: {
        stats,
        recentOrders,
        recentReviews,
        categories,
        coupons
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Server Action: Admin dashboard data fetch failed:', error)
    
    return {
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// 🚀 Server Action for search functionality
export async function searchData(query, filters = {}) {
  'use server'
  
  if (!query || query.trim().length < 2) {
    return {
      success: false,
      data: null,
      error: 'Search query must be at least 2 characters long'
    }
  }

  try {

    
    const searchTerm = query.toLowerCase().trim()
    const { searchType = 'all', limit = 20 } = filters

    const results = {}

    if (searchType === 'all' || searchType === 'products') {
      const products = await getCachedProducts()
      results.products = products
        .filter(p => 
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.brand.toLowerCase().includes(searchTerm) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        )
        .slice(0, limit)
    }

    if (searchType === 'all' || searchType === 'categories') {
      const categories = await getCachedCategories()
      results.categories = categories
        .filter(c => 
          c.name.toLowerCase().includes(searchTerm) ||
          c.description.toLowerCase().includes(searchTerm)
        )
        .slice(0, Math.floor(limit / 4))
    }

    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0)



    return {
      success: true,
      data: {
        query,
        results,
        totalResults,
        searchTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    // Sanitize error message to prevent format string injection
    const errorMessage = String(error?.message || 'Unknown error').replace(/%/g, '%%')
    console.error(`❌ Server Action: Search failed for "${query}":`, errorMessage)
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  }
}