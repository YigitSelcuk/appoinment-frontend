import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaUser, FaTimes } from 'react-icons/fa';
import './ViewUserModal.css';

const ViewUserModal = ({ show, onHide, user }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  if (!user) return null;

  // Format functions
  const formatPhone = (phone) => {
    if (!phone) return 'Belirtilmemiş';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Hiç giriş yapmamış';
    
    // MySQL datetime formatı: "2024-01-15 14:30:00"
    // Bu zaten Türkiye saati olarak kaydedildi, direkt kullan
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Geçersiz tarih';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Bugün ${date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`;
    } else if (diffDays === 1) {
      return `Dün ${date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Yönetici';
      case 'user': return 'Kullanıcı';
      case 'moderator': return 'Moderatör';
      default: return role || 'Belirtilmemiş';
    }
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" className="view-user-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="header-left">
             
              <div className="header-info">
                <h4 className="modal-title">{user.name}</h4>
                <div className="user-meta">
                  <span className="role-badge" style={{ backgroundColor: user.color || '#4E0DCC' }}>
                    {getRoleDisplayName(user.role)}
                  </span>
                  {user.department && (
                    <span className="department-badge">
                      {user.department}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={onHide}>
              <FaTimes />
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
                <div className="info-value">{user.name || 'Belirtilmemiş'}</div>
              </div>

              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">E-posta</span>
                </div>
                <div className="info-value email-address">
                  <i className="fas fa-envelope me-2"></i>
                  {user.email || "Belirtilmemiş"}
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
                  <span className="info-label">Rol</span>
                </div>
                <div className="info-value">
                  <span className="role-indicator" style={{ backgroundColor: user.color || '#4E0DCC' }}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>

              {user.department && (
                <div className="info-item">
                  <div className="item-header">
                    <span className="info-label">Departman</span>
                  </div>
                  <div className="info-value">{user.department}</div>
                </div>
              )}

              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">Kayıt Tarihi</span>
                </div>
                <div className="info-value date-value">{formatDate(user.created_at)}</div>
              </div>

              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">Son Giriş</span>
                </div>
                <div className="info-value last-seen-value">{formatLastSeen(user.last_seen)}</div>
              </div>

              {user.permissions && (
                <div className="info-item" style={{gridColumn: '1 / -1'}}>
                  <div className="item-header">
                    <span className="info-label">Yetkiler</span>
                  </div>
                  <div className="permissions-container">
                    {Array.isArray(user.permissions) ? (
                      user.permissions.length > 0 ? (
                        user.permissions.map((permission, index) => (
                          <span key={index} className="permission-badge">
                            {permission}
                          </span>
                        ))
                      ) : (
                        <span className="no-permissions">Yetki tanımlanmamış</span>
                      )
                    ) : typeof user.permissions === 'object' && user.permissions !== null ? (
                      Object.entries(user.permissions).filter(([key, value]) => value).length > 0 ? (
                        Object.entries(user.permissions).map(([key, value]) => (
                          value && (
                            <span key={key} className="permission-badge">
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          )
                        ))
                      ) : (
                        <span className="no-permissions">Yetki tanımlanmamış</span>
                      )
                    ) : user.permissions ? (
                      <span className="permission-badge">{String(user.permissions)}</span>
                    ) : (
                      <span className="no-permissions">Yetki tanımlanmamış</span>
                    )}
                  </div>
                </div>
              )}

              {user.address && (
                <div className="info-item" style={{gridColumn: '1 / -1'}}>
                  <div className="item-header">
                    <span className="info-label">Adres</span>
                  </div>
                  <div className="info-value location-value">
                    <i className="fas fa-home me-2"></i>
                    {user.address}
                  </div>
                </div>
              )}

              {user.bio && (
                <div className="info-item" style={{gridColumn: '1 / -1'}}>
                  <div className="item-header">
                    <span className="info-label">Biyografi</span>
                  </div>
                  <div className="bio-container">
                    {user.bio}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </Modal>

      {/* Image Enlargement Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        centered 
        size="xl"
        className="view-user-modal image-modal"
      >
        <Modal.Body>
          <img
            src={user?.avatar || "/assets/images/logo.png"}
            alt="Büyütülmüş Profil Fotoğrafı"
            className="enlarged-image"
            onClick={() => setShowImageModal(false)}
            onError={(e) => {
              e.target.src = "/assets/images/logo.png";
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ViewUserModal;