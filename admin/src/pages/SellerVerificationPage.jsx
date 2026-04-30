import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const SellerVerificationPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const params = { status: 'pending', page, limit: 20 };
      if (search) params.search = search;
      const res = await apiClient.get('/api/sellers/admin/all', { params });
      setSellers(res.data.sellers || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSellers(); }, [page, search]);

  const openAction = (seller, actionType) => {
    setSelectedSeller(seller);
    setAction(actionType);
    setReason('');
    setModalOpen(true);
  };

  const handleAction = async () => {
    if (action === 'rejected' && !reason.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/api/sellers/admin/${selectedSeller._id}/verify`, {
        status: action,
        rejectionReason: action === 'rejected' ? reason : undefined,
      });
      setModalOpen(false);
      fetchSellers();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="actions-row">
        <div className="search-bar">
          <Search />
          <input placeholder="Search pending sellers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <span className="text-muted">{total} pending application(s)</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Business Reg</th>
                <th>NIC</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : sellers.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: '3rem' }}>
                  <div className="empty-state"><CheckCircle size={48} /><h3>All caught up!</h3><p>No pending seller applications.</p></div>
                </td></tr>
              ) : sellers.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }}>{s.shopName}</td>
                  <td>{s.user?.fullName || 'N/A'}</td>
                  <td>{s.user?.email || 'N/A'}</td>
                  <td><code style={{ fontSize: '0.8rem' }}>{s.businessRegNumber}</code></td>
                  <td><code style={{ fontSize: '0.8rem' }}>{s.nicNumber}</code></td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-success btn-sm" onClick={() => openAction(s, 'approved')}><CheckCircle size={14} /> Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => openAction(s, 'rejected')}><XCircle size={14} /> Reject</button>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/sellers/${s._id}`)}><Eye size={14} /></button>
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={action === 'approved' ? 'Approve Seller' : 'Reject Seller'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className={`btn ${action === 'approved' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleAction}
              disabled={actionLoading || (action === 'rejected' && !reason.trim())}
            >
              {actionLoading ? 'Processing...' : action === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </>
        }
      >
        {selectedSeller && (
          <div>
            <p style={{ marginBottom: '1rem' }}>
              {action === 'approved'
                ? <>Are you sure you want to approve <strong>{selectedSeller.shopName}</strong>? The seller will be able to list products immediately.</>
                : <>Are you sure you want to reject <strong>{selectedSeller.shopName}</strong>?</>
              }
            </p>
            {action === 'rejected' && (
              <div className="form-group">
                <label>Rejection Reason (required)</label>
                <textarea className="form-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this application is being rejected..." rows={3} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SellerVerificationPage;
