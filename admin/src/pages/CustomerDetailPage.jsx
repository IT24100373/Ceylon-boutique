import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Power, PowerOff } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
    try {
      const res = await apiClient.get(`/api/admin/customers/${id}`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomer(); }, [id]);

  const toggleStatus = async () => {
    if (!data) return;
    if (!window.confirm(`Are you sure you want to ${data.customer.isActive ? 'deactivate' : 'activate'} this account?`)) return;
    try {
      await apiClient.put(`/api/admin/customers/${id}/status`, { isActive: !data.customer.isActive });
      fetchCustomer();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!data) return <div className="empty-state"><h3>Customer not found</h3></div>;

  const { customer: c, recentOrders } = data;

  return (
    <div>
      <button className="btn btn-outline mb-2" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      <div className="card mb-2">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>{c.fullName}</h3>
            <span className="text-muted text-small">{c.email} • Joined {new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={c.isActive ? 'active' : 'deactivated'} />
            <button 
              className={`btn ${c.isActive ? 'btn-danger' : 'btn-success'}`} 
              onClick={toggleStatus}
            >
              {c.isActive ? <><PowerOff size={16} /> Deactivate</> : <><Power size={16} /> Activate</>}
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-section">
              <h4>Contact Info</h4>
              <div className="detail-row"><span>Phone</span><span>{c.phone}</span></div>
            </div>
            <div className="detail-section">
              <h4>Platform Stats</h4>
              <div className="detail-row"><span>Total Orders</span><span>{c.stats.totalOrders}</span></div>
              <div className="detail-row"><span>Total Spent</span><span>LKR {c.stats.totalSpent.toLocaleString()}</span></div>
              <div className="detail-row"><span>Reviews Written</span><span>{c.stats.totalReviews}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Orders</h3>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Order #</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>No orders placed yet.</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o._id} className="clickable" onClick={() => navigate(`/orders/${o._id}`)}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>LKR {o.totalAmount.toLocaleString()}</td>
                  <td>{o.paymentMethod.toUpperCase()}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
