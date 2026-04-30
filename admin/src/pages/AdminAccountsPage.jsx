import React, { useState, useEffect } from 'react';
import { Plus, Shield } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const AdminAccountsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/accounts');
      setAdmins(res.data.admins || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleOpenAdd = () => {
    setFormData({ fullName: '', email: '', phone: '', password: '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiClient.post('/api/admin/accounts', formData);
      setModalOpen(false);
      fetchAdmins();
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <div>
      <div className="actions-row mb-2">
        <div>
          <h3>Admin Accounts</h3>
          <p className="text-muted text-small">Manage staff members with full access to the admin panel</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Create Admin
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={5} className="text-center" style={{ padding: '3rem' }}>No admin accounts found</td></tr>
              ) : admins.map(a => (
                <tr key={a._id}>
                  <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={16} className="text-primary" /> {a.fullName}</div></td>
                  <td>{a.email}</td>
                  <td>{a.phone}</td>
                  <td><StatusBadge status={a.isActive ? 'active' : 'deactivated'} /></td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Admin Account"
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" form="admin-form" disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Account'}
            </button>
          </>
        }
      >
        <form id="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-input" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" className="form-input" placeholder="e.g. 0771234567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Temporary Password</label>
            <input type="password" className="form-input" placeholder="Min 8 chars, 1 uppercase, 1 number" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            <p className="text-small text-muted mt-1">The new admin should change this immediately after logging in.</p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAccountsPage;
