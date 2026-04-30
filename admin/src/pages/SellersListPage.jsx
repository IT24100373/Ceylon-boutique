import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';

const SellersListPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const res = await apiClient.get('/api/sellers/admin/all', { params });
        setSellers(res.data.sellers || []);
        setTotal(res.data.total || 0);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchSellers();
  }, [page, search, statusFilter]);

  const statuses = ['', 'pending', 'approved', 'rejected', 'suspended', 'removed'];

  return (
    <div>
      <div className="actions-row">
        <div className="search-bar">
          <Search />
          <input placeholder="Search sellers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <span className="text-muted">{total} seller(s)</span>
      </div>

      <div className="filter-tabs">
        {statuses.map(s => (
          <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Shop Name</th><th>Owner</th><th>Email</th><th>Products</th><th>Rating</th><th>Status</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : sellers.length === 0 ? (
                <tr><td colSpan={8} className="text-center" style={{ padding: '3rem' }}><div className="empty-state"><h3>No sellers found</h3></div></td></tr>
              ) : sellers.map(s => (
                <tr key={s._id} className="clickable" onClick={() => navigate(`/sellers/${s._id}`)}>
                  <td style={{ fontWeight: 600 }}>{s.shopName}</td>
                  <td>{s.user?.fullName || 'N/A'}</td>
                  <td>{s.user?.email || 'N/A'}</td>
                  <td>{s.productCount}</td>
                  <td>⭐ {s.averageRating?.toFixed(1) || '0.0'}</td>
                  <td><StatusBadge status={s.verificationStatus} /></td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/sellers/${s._id}`); }}><Eye size={14} /></button></td>
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

export default SellersListPage;
