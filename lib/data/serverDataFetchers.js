import { unstable_cache, revalidateTag } from 'next/cache'
import { 
  normalizeProducts, 
  normalizeCategories, 
  normalizeReviews,
  normalizeUsers
} from '@/lib/data/dataSchemas'
import { getCollection } from '@/lib/mongodb'

// On-demand revalidation: Data is cached indefinitely until revalidateTag() is called.
// No time-based revalidation — cache is busted only when mutations happen.

const getProducts = unstable_cache(
  async () => {
    try {
      const productsCollection = await getCollection('allProducts')
      const products = await productsCollection.find({}).toArray()
      
      const productsWithStringId = products.map(product => ({
        ...product,
        _id: product._id.toString()
      }))
      
      return normalizeProducts(productsWithStringId)
    } catch (error) {
      console.error('Server: Failed to fetch products:', error)
      return []
    }
  },
  ['products'],
  { tags: ['products'] }
)

const getCategories = unstable_cache(
  async () => {
    try {
      const categoriesCollection = await getCollection('allCategories')
      const categories = await categoriesCollection.find({}).toArray()
      
      const categoriesWithStringId = categories.map(category => ({
        ...category,
        _id: category._id.toString()
      }))
      
      return normalizeCategories(categoriesWithStringId)
    } catch (error) {
      console.error('Server: Failed to fetch categories:', error)
      return []
    }
  },
  ['categories'],
  { tags: ['categories'] }
)

const getReviews = unstable_cache(
  async () => {
    try {
      const reviewsCollection = await getCollection('allReviews')
      const reviews = await reviewsCollection.find({}).toArray()
      
      const reviewsWithStringId = reviews.map(review => ({
        ...review,
        _id: review._id.toString()
      }))
      
      return normalizeReviews(reviewsWithStringId)
    } catch (error) {
      console.error('Server: Failed to fetch reviews:', error)
      return []
    }
  },
  ['reviews'],
  { tags: ['reviews'] }
)

const getUsers = unstable_cache(
  async () => {
    try {
      const usersCollection = await getCollection('users')
      const users = await usersCollection.find({}).toArray()
      
      const usersWithStringId = users.map(user => ({
        ...user,
        _id: user._id.toString()
      }))
      
      return normalizeUsers(usersWithStringId)
    } catch (error) {
      console.error('Server: Failed to fetch users:', error)
      return []
    }
  },
  ['users'],
  { tags: ['users'] }
)

// Server Actions for on-demand revalidation
export async function revalidateProducts() {
  'use server'
  revalidateTag('products')
}

export async function revalidateCategories() {
  'use server'
  revalidateTag('categories')
}

export async function revalidateReviews() {
  'use server'
  revalidateTag('reviews')
}

export async function revalidateUsers() {
  'use server'
  revalidateTag('users')
}

export async function revalidateAll() {
  'use server'
  revalidateTag('products')
  revalidateTag('categories')
  revalidateTag('reviews')
  revalidateTag('users')
}

// Main data fetcher that runs on server
export async function getHomePageData() {
  // 🚀 NEXT.JS 15: Parallel data fetching on server
  // Note: Users data removed - only needed for admin panel, not homepage
  const [products, categories, reviews] = await Promise.all([
    getProducts(),
    getCategories(),
    getReviews()
  ])

  return {
    products,
    categories, 
    reviews,
    // Computed data for better performance
    featuredProducts: products.filter(p => p.isInStock).slice(0, 8),
    activeCategories: categories.filter(c => c.isActive && c.hasProducts),
    approvedReviews: reviews.filter(r => r.isApproved).slice(0, 10),
    stats: {
      totalProducts: products.length,
      inStockProducts: products.filter(p => p.isInStock).length,
      totalCategories: categories.filter(c => c.isActive).length,
      totalReviews: reviews.filter(r => r.isApproved).length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0
    }
  }
}