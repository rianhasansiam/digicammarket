'use client';

import { useMemo } from 'react';
import UserHistoryClient from './UserHistoryClient';
import { useUsers, useOrders, useProducts } from '@/lib/hooks/useReduxData';

// Client Component - Handles real data fetching from APIs
const UserHistory = () => {
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: users } = useUsers();
  const { data: orders } = useOrders();
  const { data: products } = useProducts();

  // Process real user history data
  const userHistoryData = useMemo(() => {
    const allUsers = Array.isArray(users) ? users : [];
    const allOrders = Array.isArray(orders) ? orders : [];
    const allProducts = Array.isArray(products) ? products : [];

    const customers = allUsers.map(user => {
      // Find all orders for this user
      const userOrders = allOrders.filter(order => 
        order.customerInfo?.email === user.email || 
        order.userId === user._id
      );

      // Calculate user statistics
      const totalSpent = userOrders.reduce((sum, order) => 
        sum + parseFloat(order.orderSummary?.total || order.total || 0), 0);
      
      const totalOrders = userOrders.length;
      const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Get user's order history with product details
      const orderHistory = userOrders
        .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
        .slice(0, 10) // Limit to last 10 orders
        .map(order => ({
          id: order.orderId || order._id?.toString().substring(0, 8) || 'N/A',
          date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : 'N/A',
          total: parseFloat(order.orderSummary?.total || order.total || 0),
          status: order.status || 'pending',
          products: (order.items || []).map(item => ({
            name: item.productName || item.name || 'Unknown Product',
            quantity: item.quantity || 0,
            price: item.price || 0
          }))
        }));

      // Determine VIP status (customers with more than ৳50,000 spent or 5+ orders)
      const isVIP = totalSpent > 500 || totalOrders >= 5;

      // Get last order date
      const lastOrder = userOrders.length > 0 
        ? new Date(userOrders[0].createdAt || userOrders[0].orderDate).toISOString().split('T')[0]
        : 'Never';

      return {
        id: user._id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
        email: user.email || 'No email',
        avatar: user.avatar || user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=100&background=f3f4f6&color=374151`,
        status: isVIP ? 'vip' : 'regular',
        totalSpent,
        totalOrders,
        averageOrder,
        joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'Unknown',
        lastOrder,
        location: user.location || user.city || 'Not specified',
        orderHistory,
        wishlist: [], // Could be implemented if you have wishlist data
        preferences: [] // Could be derived from order history
      };
    });

    return { customers };
  }, [users, orders, products]);

  return <UserHistoryClient userHistoryData={userHistoryData} />;
};

export default UserHistory;