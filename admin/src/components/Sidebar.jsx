import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard, Users, Store, ShoppingBag, Package,
  Star, DollarSign, Tag, Shield, LogOut, ClipboardCheck
} from 'lucide-react';

const navItems = [
  { section: 'Overview', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Management', items: [
    { to: '/sellers/pending', icon: ClipboardCheck, label: 'Seller Verification', badge: 'pending' },
    { to: '/sellers', icon: Store, label: 'All Sellers' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/orders', icon: Package, label: 'Orders' },
    { to: '/reviews', icon: Star, label: 'Reviews' },
  ]},
  { section: 'Finance & Settings', items: [
    { to: '/financials', icon: DollarSign, label: 'Financials' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/admin-accounts', icon: Shield, label: 'Admin Accounts' },
  ]},
];

const Sidebar = ({ pendingSellers = 0 }) => {
  const { user, logout } = useAdminAuth();
  const location = useLocation();

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🏪</div>
        <div>
          <h2>Ceylon Boutique</h2>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="sidebar-section" key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon />
                {item.label}
                {item.badge === 'pending' && pendingSellers > 0 && (
                  <span className="sidebar-badge">{pendingSellers}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.fullName)}</div>
          <div className="sidebar-user-info">
            <h4>{user?.fullName || 'Admin'}</h4>
            <span>{user?.email || ''}</span>
          </div>
        </div>
        <button className="sidebar-link" onClick={logout} style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
          <LogOut /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
