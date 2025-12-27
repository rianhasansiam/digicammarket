import AdminPageClient from './AdminPageClient';
import AdminAuthWrapper from './components/AdminAuthWrapper';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Star, 
  Ticket, 
  FolderOpen,
  History,
  Shield,
  Settings,
  Mail,
  Flame
} from 'lucide-react';

// Import admin components directly (no wrapper layers)
import Dashboard from './adminComponents/dashboard/Dashboard';
import AllProductsClient from './adminComponents/allProducts/AllProductsClient';
import AllUsersClient from './adminComponents/allUsers/AllUsersClient';
import OrderDetails from './adminComponents/orderDetails/OrderDetails';
import AllReviews from './adminComponents/allReviews/AllReviews';
import AllCuponsClient from './adminComponents/allCupons/AllCuponsClient';
import AllCategoryClient from './adminComponents/allCategory/AllCategoryClient';
import ShippingTaxSettings from './adminComponents/shippingTax/ShippingTaxSettings';
import AllMessages from './adminComponents/allMessages/AllMessages';
import AllSalesClient from './adminComponents/allSales/AllSalesClient';


// Metadata for SEO - Admin Panel
export const metadata = {
  title: "Admin Panel - Digicam Market | Manage Your Camera Business",
  description: "Comprehensive admin dashboard for managing products, orders, customers, and analytics for Digicam Market premium camera store.",
  keywords: "admin panel, dashboard, camera store management, inventory, orders, customers, analytics",
  robots: "noindex, nofollow", // Admin panel should not be indexed
  openGraph: {
    title: "Admin Panel - Digicam Market",
    description: "Business management dashboard for Digicam Market camera store",
    type: "website",
  },
};

// Server Component - Handles data and SEO
export default function AdminPage() {
  // Server-side admin data (could come from database/API)
  const adminData = {
    brandInfo: {
      name: "Digicam",
      tagline: "Admin Panel",
      description: "Manage your premium camera business"
    },
    user: {
      name: "Admin User",
      role: "Administrator",
      initials: "AU",
      email: "admin@digicam.com"
    },
    notifications: {
      count: 3,
      items: [
        { id: 1, message: "New order received", type: "order", time: "2 min ago" },
        { id: 2, message: "Low stock alert", type: "inventory", time: "1 hour ago" },
        { id: 3, message: "Customer review pending", type: "review", time: "3 hours ago" }
      ]
    },
    businessStats: {
      totalRevenue: 124500,
      totalOrders: 1250,
      totalCustomers: 845,
      averageOrder: 99.6
    },
    systemStatus: {
      operational: true,
      lastUpdate: new Date().toISOString(),
      uptime: "99.9%"
    }
  };

  // Navigation items with components (server-side configuration)
  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      component: Dashboard,
      description: 'Overview & Analytics'
    },
    {
      id: 'products',
      name: 'All Products',
      icon: Package,
      component: AllProductsClient,
      description: 'Manage Products'
    },
    {
      id: 'users',
      name: 'All Users',
      icon: Users,
      component: AllUsersClient,
      description: 'Customer Management'
    },
    {
      id: 'orders',
      name: 'Order Details',
      icon: ShoppingCart,
      component: OrderDetails,
      description: 'Order Management'
    },
    {
      id: 'reviews',
      name: 'Reviews',
      icon: Star,
      component: AllReviews,
      description: 'Customer Reviews'
    },
    {
      id: 'categories',
      name: 'Categories',
      icon: FolderOpen,
      component: AllCategoryClient,
      description: 'Product Categories'
    },
    {
      id: 'coupons',
      name: 'Coupons',
      icon: Ticket,
      component: AllCuponsClient,
      description: 'Discount Coupons'
    },
    {
      id: 'sales',
      name: 'Sales & Promotions',
      icon: Flame,
      component: AllSalesClient,
      description: 'Flash Sales & Bundle Deals'
    },
    {
      id: 'shipping-tax',
      name: 'Shipping & Tax',
      icon: Settings,
      component: ShippingTaxSettings,
      description: 'Configure Shipping & Tax Settings'
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: Mail,
      component: AllMessages,
      description: 'Customer Messages'
    }
    
  ];

  // Create serializable navigation data for client (without icons and components)
  const clientNavigationItems = navigationItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description
  }));

  // Pass server-side data to client component with authentication wrapper
  return (
    <AdminAuthWrapper>
      <AdminPageClient 
        adminData={adminData} 
        navigationItems={clientNavigationItems}
      />
    </AdminAuthWrapper>
  );
}