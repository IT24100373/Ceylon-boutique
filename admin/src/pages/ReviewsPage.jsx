import React, { useState, useEffect } from 'react';
import { Search, Trash2, CheckCircle } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState({ open: false, reviewId: null });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      
      const res = await apiClient.get('/api/reviews/admin/all', { params });
      setReviews(res.data.reviews || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [page, search, typeFilter]);

  const handleRemove = async () => {
    if (!reason.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/api/reviews/admin/${modal.reviewId}/remove`, { reason });
      setModal({ open: false, reviewId: null });
      fetchReviews();
    } catch (err) { alert(err.response?.data?.message || 'Failed to remove review'); }
    finally { setActionLoading(false); }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  return (
    <div>
      <div className="actions-row">
        <div className="search-bar">
          <Search />
          <input placeholder="Search review text..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <span className="text-muted">{total} review(s)</span>
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${!typeFilter ? 'active' : ''}`} onClick={() => { setTypeFilter(''); setPage(1); }}>All Types</button>
        <button className={`filter-tab ${typeFilter === 'product' ? 'active' : ''}`} onClick={() => { setTypeFilter('product'); setPage(1); }}>Product Reviews</button>
        <button className={`filter-tab ${typeFilter === 'seller' ? 'active' : ''}`} onClick={() => { setTypeFilter('seller'); setPage(1); }}>Seller Reviews</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Target</th><th>Customer</th><th>Rating</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={8} className="text-center" style={{ padding: '3rem' }}><div className="empty-state"><h3>No reviews found</h3></div></td></tr>
              ) : reviews.map(r => (
                <tr key={r._id} style={{ opacity: r.adminRemoved ? 0.6 : 1 }}>
                  <td className="text-small">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td><span className={`badge ${r.reviewType === 'product' ? 'badge-info' : 'badge-warning'}`} style={{ background: 'var(--color-content-bg)', color: 'var(--color-text-primary)' }}>{r.reviewType}</span></td>
                  <td className="text-small font-semibold">
                    {r.reviewType === 'product' ? r.product?.name : r.seller?.shopName}
                  </td>
                  <td className="text-small">{r.customer?.fullName}</td>
                  <td className="text-small">{renderStars(r.rating)}</td>
                  <td>
                    <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: r.adminRemoved ? 'line-through' : 'none' }} title={r.reviewText}>
                      {r.reviewText || <span className="text-muted italic">No text</span>}
                    </div>
                  </td>
                  <td>{r.adminRemoved ? <StatusBadge status="removed" /> : r.isDeleted ? <StatusBadge status="deleted" /> : <StatusBadge status="active" />}</td>
                  <td>
                    {!r.adminRemoved && !r.isDeleted && (
                      <button className="btn btn-danger btn-sm" onClick={() => { setReason(''); setModal({ open: true, reviewId: r._id }); }}>
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
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

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, reviewId: null })}
        title="Remove Review"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal({ open: false, reviewId: null })}>Cancel</button>
            <button className="btn btn-danger" disabled={actionLoading || !reason.trim()} onClick={handleRemove}>
              {actionLoading ? 'Processing...' : 'Remove'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Removal Reason (required)</label>
          <textarea className="form-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a reason for removing this review (e.g., Inappropriate content, spam)..." rows={3} />
          <p className="text-small text-muted mt-1">This action cannot be undone. The review rating will be removed from the product/seller averages.</p>
        </div>
      </Modal>
    </div>
  );
};

export default ReviewsPage;
