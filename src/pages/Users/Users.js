import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { getUsers, createUser, updateUser, updateUserPermissions, deleteUser } from '../../services/usersService';
import { logActivity } from '../../services/activitiesService';
import Calendar from '../../components/Calendar/Calendar';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import UsersTable from '../../components/UsersTable/UsersTable';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { DEPARTMENTS, renderDepartmentOptions } from '../../data/departments';
import '../../components/ViewContactModal/ViewContactModal.css';
import './Users.css';

const defaultPermissions = {
  dashboard: true,
  appointments: false,
  tasks: false,
  contacts: false,
  categories: false,
  messages: false,
  messaging: false,
  requests: false,
  activities: false,
  cv: false,
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(14);
  const [form, setForm] = useState({
    name: '', 
    email: '', 
    password: '', 
    role: 'user', 
    permissions: defaultPermissions,
    phone: '',
    address: '',
    bio: '',
    department: '',
    customDepartment: '',
    color: '#4E0DCC'
  });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  const { accessToken } = useAuth();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers(accessToken);
      setUsers(res.data || []);
      setFilteredUsers(res.data || []);
      
      // Aktivite kaydı - kullanıcılar listesi görüntülendi
      try {
        await logActivity(accessToken, {
          action_type: 'VIEW',
          table_name: 'users',
          description: 'Kullanıcılar listesi görüntülendi'
        });
      } catch (activityError) {
        console.error('Aktivite kaydı hatası:', activityError);
      }
      
      showSuccess('Kullanıcılar başarıyla yüklendi');
    } catch (e) {
      setError(e?.message || 'Kullanıcılar yüklenemedi');
      showError('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Arama fonksiyonu
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    
    if (!term.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      const searchLower = term.toLowerCase();
      const fullName = user.name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const phone = user.phone?.toLowerCase() || '';
      const title = user.title?.toLowerCase() || '';
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower) ||
             title.includes(searchLower);
    });
    
    setFilteredUsers(filtered);
  };

  // Sayfa değiştirme fonksiyonu
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Pagination hesaplamaları
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => { loadUsers(); }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePermToggle = (key) => {
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { 
        ...form,
        department: form.department === 'Diğer' ? form.customDepartment : form.department
      };
      delete payload.customDepartment;
      const res = await createUser(payload, accessToken);
      if (res.success) {
        // Aktivite kaydı - yeni kullanıcı eklendi
        try {
          await logActivity(accessToken, {
            action_type: 'CREATE',
            table_name: 'users',
            record_id: res.data?.id,
            description: `Yeni kullanıcı eklendi: ${payload.name} (${payload.email})`
          });
        } catch (activityError) {
          console.error('Aktivite kaydı hatası:', activityError);
        }
        
        await loadUsers();
        setForm({ 
          name: '', 
          email: '', 
          password: '', 
          role: 'user', 
          permissions: defaultPermissions,
          phone: '',
          address: '',
          bio: '',
          department: '',
          customDepartment: '',
          color: '#4E0DCC'
        });
        setShowAdd(false);
        showSuccess('Kullanıcı başarıyla eklendi');
      } else {
        setError(res.message || 'Kullanıcı oluşturulamadı');
        showError(res.message || 'Kullanıcı eklenirken hata oluştu');
      }
    } catch (e2) {
      setError(e2?.message || 'Kullanıcı oluşturulamadı');
      showError('Kullanıcı eklenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { 
        ...form,
        department: form.department === 'Diğer' ? form.customDepartment : form.department
      };
      delete payload.customDepartment;
      const res = await updateUser(selectedUser.id, payload, accessToken);
      if (res.success) {
        // Aktivite kaydı - kullanıcı güncellendi
        try {
          await logActivity(accessToken, {
            action_type: 'UPDATE',
            table_name: 'users',
            record_id: selectedUser.id,
            description: `Kullanıcı güncellendi: ${payload.name} (${payload.email})`
          });
        } catch (activityError) {
          console.error('Aktivite kaydı hatası:', activityError);
        }
        
        await loadUsers();
        setShowEdit(false);
        showSuccess('Kullanıcı başarıyla güncellendi');
      } else {
        setError(res.message || 'Kullanıcı güncellenemedi');
        showError(res.message || 'Kullanıcı güncellenirken hata oluştu');
      }
    } catch (e2) {
      setError(e2?.message || 'Kullanıcı güncellenemedi');
      showError('Kullanıcı güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePerm = async (userId, key, currentValue) => {
    try {
      const user = users.find(u => u.id === userId);
      const nextPerms = { ...(user.permissions || {}), [key]: !currentValue };
      const res = await updateUserPermissions(userId, nextPerms, accessToken);
      if (res.success) {
        // Aktivite kaydı - kullanıcı izinleri güncellendi
        try {
          await logActivity(accessToken, {
            action_type: 'UPDATE',
            table_name: 'users',
            record_id: userId,
            description: `Kullanıcı izinleri güncellendi: ${user.name} - ${key.toUpperCase()} izni ${!currentValue ? 'verildi' : 'kaldırıldı'}`
          });
        } catch (activityError) {
          console.error('Aktivite kaydı hatası:', activityError);
        }
        
        await loadUsers();
        showSuccess('İzin başarıyla güncellendi');
      } else {
        showError(res.message || 'İzin güncellenemedi');
      }
    } catch (e) {
      showError(e?.message || 'İzin güncellenemedi');
    }
  };

  const permissionKeys = [
    'appointments','tasks','contacts','categories','messages','messaging','requests','activities','cv'
  ];

  // İşlem fonksiyonları
  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowView(true);
    
    // Aktivite kaydı - kullanıcı detayları görüntülendi
    try {
      await logActivity(accessToken, {
        action_type: 'VIEW',
        table_name: 'users',
        record_id: user.id,
        description: `Kullanıcı detayları görüntülendi: ${user.name} (${user.email})`
      });
    } catch (activityError) {
      console.error('Aktivite kaydı hatası:', activityError);
    }
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
      permissions: user.permissions || defaultPermissions,
      phone: user.phone || '',
      address: user.address || '',
      bio: user.bio || '',
      department: user.department || '',
      customDepartment: '',
      color: user.color || '#4E0DCC'
    });
    setShowEdit(true);
    
    // Aktivite kaydı - kullanıcı düzenleme modalı açıldı
    try {
      await logActivity(accessToken, {
        action_type: 'VIEW',
        table_name: 'users',
        record_id: user.id,
        description: `Kullanıcı düzenleme modalı açıldı: ${user.name} (${user.email})`
      });
    } catch (activityError) {
      console.error('Aktivite kaydı hatası:', activityError);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDelete(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await deleteUser(selectedUser.id, accessToken);
      if (res.success) {
        // Aktivite kaydı - kullanıcı silindi
        try {
          await logActivity(accessToken, {
            action_type: 'DELETE',
            table_name: 'users',
            record_id: selectedUser.id,
            description: `Kullanıcı silindi: ${selectedUser.name} (${selectedUser.email})`
          });
        } catch (activityError) {
          console.error('Aktivite kaydı hatası:', activityError);
        }
        
        showSuccess(`${selectedUser.name} kullanıcısı silindi`);
        await loadUsers();
        setShowDelete(false);
        setSelectedUser(null);
      } else {
        showError(res.message || 'Kullanıcı silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      // Backend'den gelen hata mesajını göster
      if (error && typeof error === 'object' && error.message) {
        showError(error.message);
      } else if (typeof error === 'string') {
        showError(error);
      } else {
        showError('Kullanıcı silinirken hata oluştu');
      }
    }
  };

  return (
    <div className="users-admin">
     

      {error && <div className="alert alert-danger custom-alert">{error}</div>}

      <div className="users-admin__content">
        {/* Sol: Takvim */}
        <div className="left-calendar">
          <Calendar onDateChange={() => {}} />
        </div>

        {/* Orta: Tablo (TasksTable stilini yeniden kullan) */}
        <div className="users-admin__table tasks-like">
          <UsersTable
            users={currentUsers}
            onClickAdd={() => setShowAdd(true)}
            onSearchChange={handleSearchChange}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalUsers}
            usersPerPage={usersPerPage}
            onPageChange={handlePageChange}
            searchTerm={searchTerm}
          />
        </div>
        {/* Sağ: FloatingChat */}
        <div className="right-float-chat">
          <FloatingChat />
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        form={form}
        onChange={handleFormChange}
        onTogglePerm={handlePermToggle}
        onSubmit={handleCreateUser}
        saving={saving}
        permissionKeys={permissionKeys}
        setForm={setForm}
      />

      {/* View User Modal */}
      <ViewUserModal
        open={showView}
        onClose={() => setShowView(false)}
        user={selectedUser}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        form={form}
        onChange={handleFormChange}
        onTogglePerm={handlePermToggle}
        onSubmit={handleUpdateUser}
        saving={saving}
        permissionKeys={permissionKeys}
        setForm={setForm}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        user={selectedUser}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
};

export default Users;

// View User Modal
const ViewUserModal = ({ open, onClose, user }) => {
  if (!open || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Belirtilmemiş';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  return (
    <Modal show={open} onHide={onClose} centered size="lg" className="view-contact-modal">
      <div className="modal-header">
        <div className="header-content">
          <div className="header-left">
            <div 
              className="header-avatar"
              style={{
                backgroundColor: user.color || '#4E0DCC',
                color: 'white',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="header-info">
              <h4 className="modal-title">{user.name || 'İsimsiz Kullanıcı'}</h4>
              <div className="contact-meta">
                <span className="category-badge">
                  {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                </span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="modal-body">
        <div className="info-card">
          <div className="info-grid">
            <div className="info-item">
              <div className="item-header">
                <span className="info-label">Ad Soyad</span>
              </div>
              <div className="info-value">
                <i className="fas fa-user me-2"></i>
                {user.name || 'Belirtilmemiş'}
              </div>
            </div>
            <div className="info-item">
              <div className="item-header">
                <span className="info-label">E-posta</span>
              </div>
              <div className="info-value email-address">
                <i className="fas fa-envelope me-2"></i>
                {user.email || 'Belirtilmemiş'}
              </div>
            </div>
            <div className="info-item">
              <div className="item-header">
                <span className="info-label">Telefon</span>
              </div>
              <div className="info-value phone-number">
                <i className="fas fa-phone me-2"></i>
                {formatPhone(user.phone)}
              </div>
            </div>
            <div className="info-item">
              <div className="item-header">
                <span className="info-label">Departman</span>
              </div>
              <div className="info-value">
                <i className="fas fa-building me-2"></i>
                {user.department || 'Belirtilmemiş'}
              </div>
            </div>
            <div className="info-item">
              <div className="item-header">
                <span className="info-label">Rol</span>
              </div>
              <div className="info-value">
                <i className="fas fa-user-tag me-2"></i>
                {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
              </div>
            </div>
            <div className="info-item">
              <div className="item-header">
                <span className="info-label">Kayıt Tarihi</span>
              </div>
              <div className="info-value date-value">
                <i className="fas fa-calendar me-2"></i>
                {formatDate(user.created_at)}
              </div>
            </div>
            {user.address && (
              <div className="info-item" style={{gridColumn: '1 / -1'}}>
                <div className="item-header">
                  <span className="info-label">Adres</span>
                </div>
                <div className="info-value location-value">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {user.address}
                </div>
              </div>
            )}
            {user.bio && (
              <div className="info-item" style={{gridColumn: '1 / -1'}}>
                <div className="item-header">
                  <span className="info-label">Biyografi</span>
                </div>
                <div className="notes-container">
                  {user.bio}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <div className="footer-info">
          Sistem Bilgisi: {new Date().toLocaleDateString('tr-TR')}
        </div>
        <Button className="close-button" onClick={onClose}>
          <i className="fas fa-times"></i> Kapat
        </Button>
      </div>
    </Modal>
  );
};

// Edit User Modal
const EditUserModal = ({ open, onClose, form, onChange, onTogglePerm, onSubmit, saving, permissionKeys, setForm }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="title">KULLANICI DÜZENLE</div>
          <button className="icon-btn" onClick={onClose}><span className="icon-close" /></button>
        </div>
        <form onSubmit={onSubmit} className="modal-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Ad Soyad</label>
              <input className="form-control" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" name="email" value={form.email} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Telefon</label>
              <input type="tel" className="form-control" name="phone" value={form.phone} onChange={onChange} placeholder="0555 123 45 67" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Departman</label>
              <select className="form-select" name="department" value={form.department} onChange={onChange}>
                <option value="">Departman Seçiniz</option>
                {renderDepartmentOptions()}
              </select>
              {form.department === 'Diğer' && (
                <input 
                  className="form-control mt-2" 
                  name="customDepartment" 
                  value={form.customDepartment || ''} 
                  onChange={onChange} 
                  placeholder="Departman adını yazınız" 
                />
              )}
            </div>
            <div className="col-md-12">
              <label className="form-label">Adres</label>
              <textarea className="form-control" name="address" value={form.address} onChange={onChange} rows="2" placeholder="Tam adres bilgisi"></textarea>
            </div>
            <div className="col-md-12">
              <label className="form-label">Biyografi</label>
              <textarea className="form-control" name="bio" value={form.bio} onChange={onChange} rows="3" placeholder="Kişi hakkında kısa bilgi"></textarea>
            </div>
            <div className="col-md-6">
              <label className="form-label">Profil Rengi</label>
              <input type="color" className="form-control form-control-color" name="color" value={form.color} onChange={onChange} />
            </div>
          </div>

          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label mb-0">Sayfa İzinleri</label>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  const allSelected = permissionKeys.every(k => form.permissions[k]);
                  const newPermissions = {};
                  permissionKeys.forEach(k => {
                    newPermissions[k] = !allSelected;
                  });
                  setForm(prev => ({ ...prev, permissions: { ...prev.permissions, ...newPermissions } }));
                }}
              >
                {permissionKeys.every(k => form.permissions[k]) ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </button>
            </div>
            <div className="perm-grid">
              {permissionKeys.map(k => (
                <label className="perm-item" key={k}>
                  <input type="checkbox" checked={!!form.permissions[k]} onChange={() => onTogglePerm(k)} />
                  <span>{k.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Güncelleniyor...' : 'Güncelle'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete User Modal
const DeleteUserModal = ({ open, onClose, user, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  if (!open || !user) return null;
  
  return (
    <Modal
      show={open}
      onHide={onClose}
      size="md"
      className="delete-cv-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
          Kullanıcı Sil
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="delete-confirmation">
          <div className="warning-icon">
            <i className="fas fa-trash-alt"></i>
          </div>
          
          <div className="confirmation-text">
            <h5>Bu kullanıcıyı silmek istediğinizden emin misiniz?</h5>
            <p className="text-muted mb-3">
              Bu işlem geri alınamaz. Kullanıcıya ait tüm bilgiler kalıcı olarak silinecektir.
            </p>
            
            <div className="cv-info">
              <div className="cv-info-item">
                <strong>Ad Soyad:</strong>
                <span>{user.name}</span>
              </div>
              <div className="cv-info-item">
                <strong>Email:</strong>
                <span>{user.email}</span>
              </div>
              <div className="cv-info-item">
                <strong>Rol:</strong>
                <span>{user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</span>
              </div>
              {user.phone && (
                <div className="cv-info-item">
                  <strong>Telefon:</strong>
                  <span>{user.phone}</span>
                </div>
              )}
              {user.department && (
                <div className="cv-info-item">
                  <strong>Departman:</strong>
                  <span>{user.department}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={deleting}
        >
          İptal
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Siliniyor...
            </>
          ) : (
            <>
              <i className="fas fa-trash me-2"></i>
              Evet, Sil
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Basit Add User Modal (tasarıma uygun butonlarla)
const AddUserModal = ({ open, onClose, form, onChange, onTogglePerm, onSubmit, saving, permissionKeys, setForm }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="title">KULLANICI EKLE</div>
          <button className="icon-btn" onClick={onClose}><span className="icon-close" /></button>
        </div>
        <form onSubmit={onSubmit} className="modal-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Ad Soyad</label>
              <input className="form-control" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" name="email" value={form.email} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Şifre</label>
              <input type="password" className="form-control" name="password" value={form.password} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Telefon</label>
              <input type="tel" className="form-control" name="phone" value={form.phone} onChange={onChange} placeholder="0555 123 45 67" />
            </div>

            <div className="col-md-6">
              <label className="form-label">Departman</label>
              <select className="form-select" name="department" value={form.department} onChange={onChange}>
                <option value="">Departman Seçiniz</option>
                {renderDepartmentOptions()}
              </select>
              {form.department === 'Diğer' && (
                <input 
                  className="form-control mt-2" 
                  name="customDepartment" 
                  value={form.customDepartment || ''} 
                  onChange={onChange} 
                  placeholder="Departman adını yazınız" 
                />
              )}
            </div>
            <div className="col-md-12">
              <label className="form-label">Adres</label>
              <textarea className="form-control" name="address" value={form.address} onChange={onChange} rows="2" placeholder="Tam adres bilgisi"></textarea>
            </div>
            <div className="col-md-12">
              <label className="form-label">Biyografi</label>
              <textarea className="form-control" name="bio" value={form.bio} onChange={onChange} rows="3" placeholder="Kişi hakkında kısa bilgi"></textarea>
            </div>
            <div className="col-md-6">
              <label className="form-label">Profil Rengi</label>
              <input type="color" className="form-control form-control-color" name="color" value={form.color} onChange={onChange} />
            </div>
          </div>

          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label mb-0">Sayfa İzinleri</label>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  const allSelected = permissionKeys.every(k => form.permissions[k]);
                  const newPermissions = {};
                  permissionKeys.forEach(k => {
                    newPermissions[k] = !allSelected;
                  });
                  setForm(prev => ({ ...prev, permissions: { ...prev.permissions, ...newPermissions } }));
                }}
              >
                {permissionKeys.every(k => form.permissions[k]) ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </button>
            </div>
            <div className="perm-grid">
              {permissionKeys.map(k => (
                <label className="perm-item" key={k}>
                  <input type="checkbox" checked={!!form.permissions[k]} onChange={() => onTogglePerm(k)} />
                  <span>{k.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
