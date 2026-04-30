import React, { useState, useEffect } from 'react';
import { DollarSign, Percent, TrendingUp, CreditCard } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';

const FinancialsPage = () => {
  const [financials, setFinancials] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFinancials = async () => {
    try {
      const res = await apiClient.get('/api/admin/financials');
      setFinancials(res.data.financials);
    } catch (err) { console.error(err); }
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/financials/payouts', { params: { page, limit: 20 } });
      setPayouts(res.data.payouts || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFinancials();
    fetchPayouts();
  }, [page]);

  const handleRecordPayout = async () => {
    if (!payoutAmount || isNaN(payoutAmount) || Number(payoutAmount) <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    
    if (Number(payoutAmount) > selectedSeller.balance) {
      if (!window.confirm(`You are recording a payout (LKR ${payoutAmount}) that is larger than the outstanding balance (LKR ${selectedSeller.balance}). Are you sure?`)) {
        return;
      }
    }

    setActionLoading(true);
    try {
      await apiClient.post('/api/admin/financials/payouts', {
        sellerId: selectedSeller.sellerId,
        amount: Number(payoutAmount),
        method: payoutMethod,
        notes: payoutNotes
      });
      setModalOpen(false);
      fetchFinancials();
      fetchPayouts();
    } catch (err) { alert(err.response?.data?.message || 'Failed to record payout'); }
    finally { setActionLoading(false); }
  };

  const openPayoutModal = (seller) => {
    setSelectedSeller(seller);
    setPayoutAmount(seller.balance > 0 ? seller.balance.toString() : '');
    setPayoutMethod('bank_transfer');
    setPayoutNotes('');
    setModalOpen(true);
  };

  const formatLKR = (v) => `LKR ${(v || 0).toLocaleString()}`;

  if (loading && !financials) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="stats-grid mb-3">
        <div className="stat-card" style={{ background: 'var(--color-primary)', color: '#fff' }}>
          <div>
            <div className="stat-value" style={{ color: '#fff' }}>{formatLKR(financials?.totalRevenue)}</div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Gross Platform Revenue</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}><TrendingUp color="#fff" /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value text-success">{formatLKR(financials?.platformCommission)}</div>
            <div className="stat-label">Platform Commission ({financials?.commissionRate}%)</div>
          </div>
          <div className="stat-icon success"><Percent /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{formatLKR(financials?.totalPaidOut)}</div>
            <div className="stat-label">Total Paid to Sellers</div>
            <div className="stat-change text-muted">{financials?.payoutsProcessed} payouts processed</div>
          </div>
          <div className="stat-icon primary"><DollarSign /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value text-warning">{formatLKR(financials?.outstandingBalance)}</div>
            <div className="stat-label">Outstanding Balances</div>
          </div>
          <div className="stat-icon warning"><CreditCard /></div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">
          <h3>Seller Payout Balances</h3>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Shop</th><th>Gross Revenue</th><th>Commission ({financials?.commissionRate}%)</th><th>Net Payable</th><th>Total Paid</th><th>Balance Due</th><th>Action</th></tr></thead>
            <tbody>
              {loading && payouts.length === 0 ? (
                <tr><td colSpan={7}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : payouts.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: '3rem' }}><div className="empty-state"><h3>No active sellers</h3></div></td></tr>
              ) : payouts.map(p => (
                <tr key={p.sellerId}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.shopName}</div>
                    <div className="text-small text-muted">{p.deliveredOrders} delivered orders</div>
                  </td>
                  <td>{formatLKR(p.grossRevenue)}</td>
                  <td className="text-danger">- {formatLKR(p.commission)}</td>
                  <td className="font-semibold">{formatLKR(p.netPayable)}</td>
                  <td>{formatLKR(p.totalPaid)}</td>
                  <td className={p.balance > 0 ? 'text-warning font-bold' : ''}>
                    {formatLKR(p.balance)}
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => openPayoutModal(p)}
                      disabled={p.balance <= 0}
                    >
                      Record Payout
                    </button>
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
        title="Record Seller Payout"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={actionLoading} onClick={handleRecordPayout}>
              {actionLoading ? 'Processing...' : 'Record Payout'}
            </button>
          </>
        }
      >
        {selectedSeller && (
          <div>
            <div className="detail-section mb-2" style={{ background: 'var(--color-content-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div className="detail-row mb-1"><span>Shop</span><span className="font-bold">{selectedSeller.shopName}</span></div>
              <div className="detail-row"><span>Balance Due</span><span className="font-bold text-warning">{formatLKR(selectedSeller.balance)}</span></div>
            </div>

            <div className="form-group">
              <label>Payout Amount (LKR)</label>
              <input type="number" className="form-input" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} min="1" step="1" />
            </div>

            <div className="form-group">
              <label>Transfer Method</label>
              <select className="form-select" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash Settlement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes / Reference (Optional)</label>
              <input type="text" className="form-input" value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} placeholder="e.g. Transaction #123456789" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinancialsPage;
