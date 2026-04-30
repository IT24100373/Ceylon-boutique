import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PackageCheck, Ban } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: '' });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await apiClient.get(`/api/orders/admin/${id}`);
      setOrder(res.data.order);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    if (!reason.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/api/orders/admin/${id}/cancel`, { reason });
      setModal({ open: false, type: '' });
      fetchOrder();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleDeliver = async () => {
    setActionLoading(true);
    try {
      await apiClient.put(`/api/orders/admin/${id}/deliver`);
      setModal({ open: false, type: '' });
      fetchOrder();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>;

  return (
    <div>
      <button className="btn btn-outline mb-2" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      <div className="card mb-3">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Order {order.orderNumber}</h3>
            <span className="text-muted text-small">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={order.status} />
            {['pending', 'confirmed'].includes(order.status) && (
              <button className="btn btn-danger btn-sm" onClick={() => { setReason(''); setModal({ open: true, type: 'cancel' }); }}><Ban size={14} /> Cancel Order</button>
            )}
            {order.status === 'shipped' && (
              <button className="btn btn-success btn-sm" onClick={() => setModal({ open: true, type: 'deliver' })}><PackageCheck size={14} /> Mark Delivered</button>
            )}
          </div>
        </div>
        
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-section">
              <h4>Customer</h4>
              <div className="detail-row"><span>Name</span><span>{order.customer?.fullName || 'N/A'}</span></div>
              <div className="detail-row"><span>Email</span><span>{order.customer?.email || 'N/A'}</span></div>
              <div className="detail-row"><span>Phone</span><span>{order.customer?.phone || 'N/A'}</span></div>
            </div>
            
            <div className="detail-section">
              <h4>Shipping Info</h4>
              <div className="detail-row"><span>Address</span><span>{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</span></div>
              <div className="detail-row"><span>City</span><span>{order.shippingAddress.city}</span></div>
              <div className="detail-row"><span>Province</span><span>{order.shippingAddress.province}</span></div>
              <div className="detail-row"><span>Postal</span><span>{order.shippingAddress.postalCode}</span></div>
            </div>

            <div className="detail-section">
              <h4>Payment</h4>
              <div className="detail-row"><span>Method</span><span>{order.paymentMethod.toUpperCase()}</span></div>
              <div className="detail-row"><span>Status</span><span><StatusBadge status={order.paymentStatus} /></span></div>
              <div className="detail-row"><span>Subtotal</span><span>LKR {order.subtotal.toLocaleString()}</span></div>
              <div className="detail-row"><span>Delivery Fee</span><span>LKR {order.deliveryFee.toLocaleString()}</span></div>
              <div className="detail-row" style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span className="font-bold">Total Amount</span><span className="font-bold">LKR {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Logistics</h4>
              <div className="detail-row"><span>Courier</span><span>{order.courierName || '—'}</span></div>
              <div className="detail-row"><span>Tracking #</span><span>{order.trackingNumber || '—'}</span></div>
              {order.cancellationReason && (
                <div className="detail-row" style={{ color: 'var(--color-danger)' }}><span>Cancellation Reason</span><span style={{ textAlign: 'right' }}>{order.cancellationReason}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <h3 className="mb-2">Order Items</h3>
      <div className="card mb-3">
        <div className="table-container">
          <table>
            <thead><tr><th>Product</th><th>Seller</th><th>Variant</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: '4px' }}></div>
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.productName}</div>
                        <div className="text-small text-muted">{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.seller?.shopName || 'N/A'}</td>
                  <td>{item.color} / {item.size}</td>
                  <td>LKR {item.price.toLocaleString()}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 600 }}>LKR {item.itemTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="mb-2">Status Timeline</h3>
      <div className="card">
        <div className="card-body">
          {order.statusHistory.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: i === order.statusHistory.length - 1 ? 0 : '1.5rem', position: 'relative' }}>
              {i !== order.statusHistory.length - 1 && (
                <div style={{ position: 'absolute', top: '24px', left: '11px', bottom: '-24px', width: '2px', background: 'var(--color-border)' }}></div>
              )}
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
              </div>
              <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span className="font-semibold" style={{ textTransform: 'capitalize' }}>{h.status}</span>
                  <span className="text-small text-muted">{new Date(h.timestamp).toLocaleString()}</span>
                </div>
                {h.note && <p className="text-small text-muted">{h.note}</p>}
                <div className="text-small text-muted mt-1">By: {h.updatedBy}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, type: '' })}
        title={modal.type === 'cancel' ? 'Cancel Order' : 'Mark as Delivered'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal({ open: false, type: '' })}>Close</button>
            <button 
              className={`btn ${modal.type === 'cancel' ? 'btn-danger' : 'btn-success'}`} 
              disabled={actionLoading || (modal.type === 'cancel' && !reason.trim())}
              onClick={modal.type === 'cancel' ? handleCancel : handleDeliver}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </button>
          </>
        }
      >
        {modal.type === 'cancel' ? (
          <div className="form-group">
            <label>Cancellation Reason (required)</label>
            <textarea className="form-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a reason..." rows={3} />
            <p className="text-small text-muted mt-1">Cancelling will restore inventory stock.</p>
          </div>
        ) : (
          <p>Are you sure you want to mark this order as delivered? This will open the review window for the customer.</p>
        )}
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
