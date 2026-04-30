import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Store, Package, DollarSign, Star, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';

const CHART_COLORS = ['#8B2635', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get('/api/admin/dashboard');
        setData(res.data.dashboard);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading dashboard...</p></div>;
  if (!data) return <div className="empty-state"><h3>Failed to load dashboard</h3></div>;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueChartData = (data.trends?.monthlyRevenue || []).map(m => ({
    name: `${monthNames[m._id.month - 1]} ${m._id.year}`,
    revenue: m.revenue,
    orders: m.count,
  }));

  const paymentPieData = [
    { name: 'COD', value: data.orders?.paymentSplit?.cod || 0 },
    { name: 'Card', value: data.orders?.paymentSplit?.card || 0 },
  ].filter(d => d.value > 0);

  const categoryData = (data.products?.categoryBreakdown || []).slice(0, 6).map(c => ({
    name: c._id,
    count: c.count,
  }));

  const formatLKR = (v) => `LKR ${(v || 0).toLocaleString()}`;

  return (
    <div>
      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">{data.orders?.total || 0}</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-change text-warning">{data.orders?.pending || 0} pending</div>
          </div>
          <div className="stat-icon primary"><Package /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{formatLKR(data.revenue?.total)}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-change text-success">{data.revenue?.commissionRate}% commission</div>
          </div>
          <div className="stat-icon success"><DollarSign /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{data.users?.totalCustomers || 0}</div>
            <div className="stat-label">Customers</div>
          </div>
          <div className="stat-icon info"><Users /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{data.users?.totalSellers || 0}</div>
            <div className="stat-label">Total Sellers</div>
            <div className="stat-change text-warning">{data.users?.pendingSellers || 0} pending</div>
          </div>
          <div className="stat-icon warning"><Store /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{data.products?.total || 0}</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-icon primary"><ShoppingBag /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{formatLKR(data.revenue?.outstandingBalance)}</div>
            <div className="stat-label">Outstanding Payouts</div>
          </div>
          <div className="stat-icon danger"><TrendingUp /></div>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
          <div key={s} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders?status=${s}`)}>
            <div>
              <div className="stat-value">{data.orders?.[s] || 0}</div>
              <div className="stat-label" style={{ textTransform: 'capitalize' }}>{s}</div>
            </div>
            <StatusBadge status={s} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {revenueChartData.length > 0 && (
          <div className="card">
            <div className="card-header"><h3>Revenue Trend</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`LKR ${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8B2635" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {paymentPieData.length > 0 && (
          <div className="card">
            <div className="card-header"><h3>Payment Methods</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown + Recent Orders */}
      <div className="charts-grid">
        {categoryData.length > 0 && (
          <div className="card">
            <div className="card-header"><h3>Products by Category</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={12} tickLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/orders')}>View All</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentOrders || []).map(o => (
                    <tr key={o._id} className="clickable" onClick={() => navigate(`/orders/${o._id}`)}>
                      <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                      <td>{o.customer?.fullName || 'N/A'}</td>
                      <td>{formatLKR(o.totalAmount)}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                  {(!data.recentOrders || data.recentOrders.length === 0) && (
                    <tr><td colSpan={4} className="text-center text-muted" style={{ padding: '2rem' }}>No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
