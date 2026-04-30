import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SellerVerificationPage from './pages/SellerVerificationPage';
import SellersListPage from './pages/SellersListPage';
import SellerDetailPage from './pages/SellerDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ReviewsPage from './pages/ReviewsPage';
import FinancialsPage from './pages/FinancialsPage';
import CategoriesPage from './pages/CategoriesPage';
import AdminAccountsPage from './pages/AdminAccountsPage';

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            
            {/* Sellers */}
            <Route path="sellers/pending" element={<SellerVerificationPage />} />
            <Route path="sellers" element={<SellersListPage />} />
            <Route path="sellers/:id" element={<SellerDetailPage />} />
            
            {/* Customers */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            
            {/* Orders */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            
            {/* Reviews */}
            <Route path="reviews" element={<ReviewsPage />} />
            
            {/* Platform Management */}
            <Route path="financials" element={<FinancialsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="admin-accounts" element={<AdminAccountsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
