import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') || '';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [paymentFilter, setPaymentFilter] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        if (paymentFilter) params.paymentMethod = paymentFilter;
        
        const res = await apiClient.get('/api/orders/admin/all', { params });
        setOrders(res.data.orders || []);
        setTotal(res.data.total || 0);
        setStats(res.data.stats || {});
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, [page, search, statusFilter, paymentFilter]);

  const tabs = [
    { id: '', label: 'All', count: stats.all },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { id: 'shipped', label: 'Shipped', count: stats.shipped },
    { id: 'delivered', label: 'Delivered', count: stats.delivered },
    { id: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  return (
    <div>
      <div className="actions-row">
        <div className="search-bar">
          <Search />
          <input placeholder="Search order number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select className="form-select" value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
            <option value="">All Payments</option>
            <option value="COD">Cash on Delivery</option>
            <option value="card">Card</option>
          </select>
          <span className="text-muted">{total} order(s)</span>
        </div>
      </div>

      <div className="filter-tabs">
        {tabs.map(t => (
          <button 
            key={t.id} 
            className={`filter-tab ${statusFilter === t.id ? 'active' : ''}`} 
            onClick={() => { setStatusFilter(t.id); setPage(1); }}
          >
            {t.label} {t.count !== undefined && `(${t.count})`}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: '3rem' }}><div className="empty-state"><h3>No orders found</h3></div></td></tr>
              ) : orders.map(o => (
                <tr key={o._id} className="clickable" onClick={() => navigate(`/orders/${o._id}`)}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>
                    <div>{o.customer?.fullName || 'N/A'}</div>
                    <div className="text-small text-muted">{o.customer?.phone}</div>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>LKR {o.totalAmount.toLocaleString()}</td>
                  <td>{o.paymentMethod.toUpperCase()}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o._id}`); }}><Eye size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 20 && (
        <div className="pagination">
          <span>Page {page} of {Math.ceil(total / 20)}</span>
          <div className="pagination-buttons">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="pagination-btn" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
