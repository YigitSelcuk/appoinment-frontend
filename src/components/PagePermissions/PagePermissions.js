import React from 'react';
import './PagePermissions.css';

const PagePermissions = ({ selectedPermissions = [], onChange, disabled = false }) => {
  // selectedPermissions'ı güvenli bir şekilde array'e dönüştür
  const safeSelectedPermissions = React.useMemo(() => {
    if (Array.isArray(selectedPermissions)) {
      return selectedPermissions;
    }
    if (typeof selectedPermissions === 'object' && selectedPermissions !== null) {
      // Object ise, true olan key'leri array'e çevir
      return Object.entries(selectedPermissions)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
    }
    if (typeof selectedPermissions === 'string') {
      try {
        const parsed = JSON.parse(selectedPermissions);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (typeof parsed === 'object' && parsed !== null) {
          return Object.entries(parsed)
            .filter(([key, value]) => value === true)
            .map(([key]) => key);
        }
      } catch (e) {
        console.warn('PagePermissions: selectedPermissions string parse edilemedi:', selectedPermissions);
      }
    }
    return [];
  }, [selectedPermissions]);

  // Mevcut sayfa listesi
  const availablePages = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Kullanıcılar', icon: '👥' },
    { key: 'contacts', label: 'Kişiler', icon: '📞' },
    { key: 'appointments', label: 'Randevular', icon: '📅' },
    { key: 'tasks', label: 'Görevler', icon: '✅' },
    { key: 'activities', label: 'Aktiviteler', icon: '📋' },
    { key: 'messages', label: 'Mesajlar', icon: '💬' },
    { key: 'messaging', label: 'Mesajlaşma', icon: '📨' },
    { key: 'requests', label: 'Talepler', icon: '📝' },
    { key: 'cv', label: 'CV Yönetimi', icon: '📄' },
    { key: 'categories', label: 'Kategoriler', icon: '🏷️' },
    { key: 'profile', label: 'Profil', icon: '👤' }
  ];

  const handlePermissionChange = (pageKey) => {
    if (disabled) return;
    
    const newPermissions = safeSelectedPermissions.includes(pageKey)
      ? safeSelectedPermissions.filter(p => p !== pageKey)
      : [...safeSelectedPermissions, pageKey];
    
    onChange(newPermissions);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    if (safeSelectedPermissions.length === availablePages.length) {
      onChange([]);
    } else {
      onChange(availablePages.map(page => page.key));
    }
  };

  const isAllSelected = safeSelectedPermissions.length === availablePages.length;
  const isPartiallySelected = safeSelectedPermissions.length > 0 && safeSelectedPermissions.length < availablePages.length;

  return (
    <div className="page-permissions">
      <div className="permissions-header">
        <label className="permissions-title">Sayfa Erişim İzinleri</label>
        <button
          type="button"
          className={`select-all-btn ${isAllSelected ? 'selected' : ''} ${isPartiallySelected ? 'partial' : ''}`}
          onClick={handleSelectAll}
          disabled={disabled}
        >
          {isAllSelected ? 'Tümünü Kaldır' : 'Tümünü Seç'}
        </button>
      </div>
      
      <div className="permissions-grid">
        {availablePages.map((page) => {
          const isSelected = safeSelectedPermissions.includes(page.key);
          
          return (
            <div
              key={page.key}
              className={`permission-item ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => handlePermissionChange(page.key)}
            >
              <div className="permission-icon">{page.icon}</div>
              <div className="permission-label">{page.label}</div>
              <div className={`permission-checkbox ${isSelected ? 'checked' : ''}`}>
                {isSelected && '✓'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="permissions-summary">
        <span className="selected-count">
          {safeSelectedPermissions.length} / {availablePages.length} sayfa seçildi
        </span>
      </div>
    </div>
  );
};

export default PagePermissions;