import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import apiClient from '../api/client';

const pageTitles = {
  '/': 'Dashboard',
  '/sellers': 'All Sellers',
  '/sellers/pending': 'Seller Verification',
  '/customers': 'Customer Management',
  '/orders': 'Order Management',
  '/reviews': 'Review Moderation',
  '/financials': 'Financials & Payouts',
  '/categories': 'Category Management',
  '/admin-accounts': 'Admin Accounts',
};

const Layout = () => {
  const location = useLocation();
  const [pendingSellers, setPendingSellers] = useState(0);

  // Get the page title based on current path
  const getTitle = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    if (path.startsWith('/sellers/')) return 'Seller Details';
    if (path.startsWith('/customers/')) return 'Customer Details';
    if (path.startsWith('/orders/')) return 'Order Details';
    return 'Admin Panel';
  };

  // Fetch pending seller count for sidebar badge
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await apiClient.get('/api/sellers/admin/all?status=pending&limit=1');
        setPendingSellers(res.data.total || 0);
      } catch (err) {
        // Silently fail — badge just won't show
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar pendingSellers={pendingSellers} />
      <main className="main-content">
        <div className="topbar">
          <h1 className="topbar-title">{getTitle()}</h1>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
