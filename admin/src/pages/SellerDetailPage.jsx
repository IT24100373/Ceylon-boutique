import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Ban, Trash2 } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const SellerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: '' });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSeller = async () => {
    try {
      const res = await apiClient.get(`/api/sellers/admin/${id}`);
      setSeller(res.data.seller);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeller(); }, [id]);

  const handleVerify = async (status) => {
    setActionLoading(true);
    try {
      await apiClient.put(`/api/sellers/admin/${id}/verify`, { status, rejectionReason: status === 'rejected' ? reason : undefined });
      setModal({ open: false, type: '' });
      fetchSeller();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/api/sellers/admin/${id}/suspend`, { reason });
      setModal({ open: false, type: '' });
      fetchSeller();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleRemove = async () => {
    if (!reason.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/api/sellers/admin/${id}/remove`, { reason });
      setModal({ open: false, type: '' });
      fetchSeller();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!seller) return <div className="empty-state"><h3>Seller not found</h3></div>;

  const s = seller;

  return (
    <div>
      <button className="btn btn-outline mb-2" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      <div className="card mb-2">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>{s.shopName}</h3>
            <span className="text-muted text-small">ID: {s._id}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={s.verificationStatus} />
            {s.verificationStatus === 'pending' && (
              <>
                <button className="btn btn-success btn-sm" onClick={() => handleVerify('approved')}><CheckCircle size={14} /> Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => { setReason(''); setModal({ open: true, type: 'reject' }); }}><XCircle size={14} /> Reject</button>
              </>
            )}
            {s.verificationStatus === 'approved' && (
              <button className="btn btn-warning btn-sm" onClick={() => { setReason(''); setModal({ open: true, type: 'suspend' }); }}><Ban size={14} /> Suspend</button>
            )}
            {s.verificationStatus !== 'removed' && (
              <button className="btn btn-danger btn-sm" onClick={() => { setReason(''); setModal({ open: true, type: 'remove' }); }}><Trash2 size={14} /> Remove</button>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div>
              <div className="detail-section">
                <h4>Owner Info</h4>
                <div className="detail-row"><span>Name</span><span>{s.user?.fullName}</span></div>
                <div className="detail-row"><span>Email</span><span>{s.user?.email}</span></div>
                <div className="detail-row"><span>Phone</span><span>{s.user?.phone}</span></div>
                <div className="detail-row"><span>Account Status</span><span>{s.user?.isActive ? '✅ Active' : '❌ Deactivated'}</span></div>
                <div className="detail-row"><span>Joined</span><span>{new Date(s.user?.createdAt).toLocaleDateString()}</span></div>
              </div>
              <div className="detail-section">
                <h4>Shop Details</h4>
                <div className="detail-row"><span>Description</span><span>{s.shopDescription || '—'}</span></div>
                <div className="detail-row"><span>Category Focus</span><span>{s.categoryFocus || '—'}</span></div>
                <div className="detail-row"><span>Products</span><span>{s.productCount}</span></div>
                <div className="detail-row"><span>Rating</span><span>⭐ {s.averageRating?.toFixed(1)} ({s.totalReviews} reviews)</span></div>
              </div>
            </div>
            <div>
              <div className="detail-section">
                <h4>Business Documents</h4>
                <div className="detail-row"><span>Business Reg #</span><span>{s.businessRegNumber}</span></div>
                <div className="detail-row"><span>NIC Number</span><span>{s.nicNumber}</span></div>
                <div className="detail-row"><span>Documents URL</span><span>{s.documentsUrl || '—'}</span></div>
              </div>
              <div className="detail-section">
                <h4>Bank Details</h4>
                <div className="detail-row"><span>Bank</span><span>{s.bankName}</span></div>
                <div className="detail-row"><span>Branch</span><span>{s.bankBranch}</span></div>
                <div className="detail-row"><span>Account #</span><span>{s.bankAccountNumber}</span></div>
                <div className="detail-row"><span>Account Name</span><span>{s.bankAccountName}</span></div>
              </div>
              <div className="detail-section">
                <h4>Contact Address</h4>
                <div className="detail-row"><span>Address</span><span>{s.contactAddress?.addressLine1}{s.contactAddress?.addressLine2 ? `, ${s.contactAddress.addressLine2}` : ''}</span></div>
                <div className="detail-row"><span>City</span><span>{s.contactAddress?.city}</span></div>
                <div className="detail-row"><span>Province</span><span>{s.contactAddress?.province}</span></div>
                <div className="detail-row"><span>Postal Code</span><span>{s.contactAddress?.postalCode}</span></div>
              </div>
              {s.rejectionReason && (
                <div className="detail-section">
                  <h4>Rejection Reason</h4>
                  <p style={{ color: 'var(--color-danger)' }}>{s.rejectionReason}</p>
                </div>
              )}
              {s.suspensionReason && (
                <div className="detail-section">
                  <h4>Suspension Reason</h4>
                  <p style={{ color: 'var(--color-warning)' }}>{s.suspensionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, type: '' })}
        title={modal.type === 'reject' ? 'Reject Seller' : modal.type === 'suspend' ? 'Suspend Seller' : 'Remove Seller'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal({ open: false, type: '' })}>Cancel</button>
            <button className="btn btn-danger" disabled={actionLoading || !reason.trim()} onClick={() => {
              if (modal.type === 'reject') handleVerify('rejected');
              else if (modal.type === 'suspend') handleSuspend();
              else handleRemove();
            }}>{actionLoading ? 'Processing...' : 'Confirm'}</button>
          </>
        }
      >
        <div className="form-group">
          <label>Reason (required)</label>
          <textarea className="form-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a reason..." rows={3} />
        </div>
      </Modal>
    </div>
  );
};

export default SellerDetailPage;
