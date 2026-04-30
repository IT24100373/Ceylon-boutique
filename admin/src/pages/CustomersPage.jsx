import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Power, PowerOff } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/api/admin/customers', { params });
      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [page, search, statusFilter]);

  const toggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this customer account?`)) return;
    try {
      await apiClient.put(`/api/admin/customers/${id}/status`, { isActive: !currentStatus });
      fetchCustomers();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update status'); }
  };

  return (
    <div>
      <div className="actions-row">
        <div className="search-bar">
          <Search />
          <input placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <span className="text-muted">{total} customer(s)</span>
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${!statusFilter ? 'active' : ''}`} onClick={() => { setStatusFilter(''); setPage(1); }}>All</button>
        <button className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => { setStatusFilter('active'); setPage(1); }}>Active</button>
        <button className={`filter-tab ${statusFilter === 'deactivated' ? 'active' : ''}`} onClick={() => { setStatusFilter('deactivated'); setPage(1); }}>Deactivated</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: '3rem' }}><div className="empty-state"><h3>No customers found</h3></div></td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td style={{ fontWeight: 600 }}>{c.fullName}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.orderCount}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td><StatusBadge status={c.isActive ? 'active' : 'deactivated'} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}><Eye size={14} /></button>
                      <button 
                        className={`btn btn-sm ${c.isActive ? 'btn-danger' : 'btn-success'}`} 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(c.id, c.isActive); }}
                        title={c.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {c.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
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

export default CustomersPage;
