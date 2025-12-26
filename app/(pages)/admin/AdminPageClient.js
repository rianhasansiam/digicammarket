'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts, useUsers, useOrders, useReviews, useBusinessTracking } from '@/lib/hooks/useReduxData';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Star, 
  Ticket, 
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  Mail
} from 'lucide-react';
import LoadingSpinner from '../../componets/loading/LoadingSpinner';

// 🚀 PERFORMANCE: Dynamic imports for admin components (code splitting)
const Dashboard = dynamic(() => import('./adminComponents/dashboard/Dashboard'), {
  loading: () => <LoadingSpinner message="Loading Dashboard..." />
});

const AllProductsClient = dynamic(() => import('./adminComponents/allProducts/AllProductsClient'), {
  loading: () => <LoadingSpinner message="Loading Products..." />
});

const AllUsersClient = dynamic(() => import('./adminComponents/allUsers/AllUsersClient'), {
  loading: () => <LoadingSpinner message="Loading Users..." />
});

const OrderDetails = dynamic(() => import('./adminComponents/orderDetails/OrderDetails'), {
  loading: () => <LoadingSpinner message="Loading Orders..." />
});

const AllReviews = dynamic(() => import('./adminComponents/allReviews/AllReviews'), {
  loading: () => <LoadingSpinner message="Loading Reviews..." />
});

const AllCuponsClient = dynamic(() => import('./adminComponents/allCupons/AllCuponsClient'), {
  loading: () => <LoadingSpinner message="Loading Coupons..." />
});

const AllCategoryClient = dynamic(() => import('./adminComponents/allCategory/AllCategoryClient'), {
  loading: () => <LoadingSpinner message="Loading Categories..." />
});

const ShippingTaxSettings = dynamic(() => import('./adminComponents/shippingTax/ShippingTaxSettings'), {
  loading: () => <LoadingSpinner message="Loading Settings..." />
});

const AllMessages = dynamic(() => import('./adminComponents/allMessages/AllMessages'), {
  loading: () => <LoadingSpinner message="Loading Messages..." />
});


const AdminPageClient = ({ adminData, navigationItems }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: reviews = [], isLoading: reviewsLoading } = useReviews();
  const { data: businessTracking = { totalRevenue: 0, totalInvestment: 0, entries: [] }, isLoading: businessLoading, refetch: refetchBusiness } = useBusinessTracking();
  
  // Shared loading state
  const isLoading = productsLoading || usersLoading || ordersLoading || reviewsLoading || businessLoading;
  
  // Shared data object to pass to components
  const sharedData = {
    products,
    users, 
    orders,
    reviews,
    businessTracking,
    refetchBusiness,
    isLoading
  };

  // Icon mapping for client-side use
  const iconMap = {
    'dashboard': LayoutDashboard,
    'products': Package,
    'users': Users,
    'orders': ShoppingCart,
    'reviews': Star,
    'categories': FolderOpen,
    'coupons': Ticket,
    'shipping-tax': Settings,
    'messages': Mail
  };

  // Component mapping for client-side use (direct client components)
  const componentMap = {
    'dashboard': Dashboard,
    'products': AllProductsClient,
    'users': AllUsersClient,
    'orders': OrderDetails,
    'reviews': AllReviews,
    'categories': AllCategoryClient,
    'coupons': AllCuponsClient,
    'shipping-tax': ShippingTaxSettings,
    'messages': AllMessages
  };

  const currentComponent = componentMap[activeTab] || Dashboard;
  const CurrentComponent = currentComponent;

  return (
    <div className="min-h-screen  bg-gray-50 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed lg:relative z-30 w-80 bg-gradient-to-b from-gray-900 to-black shadow-xl lg:shadow-lg h-screen overflow-y-auto "
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">NA</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{adminData.brandInfo.name}</h1>
                    <p className="text-sm text-gray-300">{adminData.brandInfo.tagline}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = iconMap[item.id] || LayoutDashboard;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(window.innerWidth >= 1024);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon size={20} />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className={`text-xs ${activeTab === item.id ? 'text-gray-300' : 'text-gray-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </nav>

           
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigationItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
                </h1>
                <p className="text-gray-600">
                  {navigationItems.find(item => item.id === activeTab)?.description || 'Overview & Analytics'}
                </p>
              </div>
            </div>

          
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentComponent {...sharedData} />
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-transparent z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminPageClient;