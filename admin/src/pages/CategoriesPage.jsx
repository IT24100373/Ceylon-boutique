import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Power, PowerOff } from 'lucide-react';
import apiClient from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: '📦' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/categories');
      setCategories(res.data.categories || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', icon: '📦' });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, icon: cat.icon || '📦' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setActionLoading(true);
    try {
      if (editingCategory) {
        await apiClient.put(`/api/admin/categories/${editingCategory._id}`, formData);
      } else {
        await apiClient.post('/api/admin/categories', formData);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  const toggleStatus = async (cat) => {
    if (!cat.isActive && !window.confirm('Activate this category? Sellers will be able to select it.')) return;
    if (cat.isActive && !window.confirm('Deactivate this category? Sellers will no longer be able to select it (existing products are unaffected).')) return;
    
    try {
      await apiClient.put(`/api/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
  };

  return (
    <div>
      <div className="actions-row mb-2">
        <h3>Product Categories</h3>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Icon</th><th>Category Name</th><th>Active Products</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="loading-container"><div className="spinner"></div></div></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={5} className="text-center" style={{ padding: '3rem' }}><div className="empty-state"><h3>No categories created</h3></div></td></tr>
              ) : categories.map(c => (
                <tr key={c._id}>
                  <td style={{ fontSize: '1.5rem' }}>{c.icon}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.productCount}</td>
                  <td><StatusBadge status={c.isActive ? 'active' : 'deactivated'} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(c)}><Edit2 size={14} /></button>
                      <button 
                        className={`btn btn-sm ${c.isActive ? 'btn-danger' : 'btn-success'}`} 
                        onClick={() => toggleStatus(c)}
                        title={c.isActive ? 'Deactivate' : 'Activate'}
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" form="category-form" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label>Emoji Icon</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.icon} 
              onChange={e => setFormData({...formData, icon: e.target.value})} 
              maxLength={5}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
