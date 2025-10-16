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
          <h4 className="modal-title">Kullanıcı Detayları</h4>
          <button className="close-btn" onClick={onHide}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="unified-info-card">
            {/* Kişisel Bilgiler */}
            <div className="info-section">
              <div className="section-header">
                <div className="title-group">
                  <FaUser className="section-icon" />
                  <div className="section-texts">
                    <h5 className="section-title">Kişisel Bilgiler</h5>
                    <span className="section-subtitle">Profil ve iletişim bilgileri</span>
                  </div>
                </div>
              </div>
              <div className="info-grid-row">
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Ad Soyad</span>
                  </div>
                  <div className="item-value">{user.name || 'Belirtilmemiş'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">E-posta</span>
                  </div>
                  <div className="item-value email-address">
                    {user.email || 'Belirtilmemiş'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Telefon</span>
                  </div>
                  <div className="item-value phone-number">{formatPhone(user.phone)}</div>
                </div>
                {user.address && (
                  <div className="info-item full-width">
                    <div className="item-header">
                      <span className="item-label">Adres</span>
                    </div>
                    <div className="item-value location-value">{user.address}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Hesap Bilgileri */}
            <div className="info-section">
              <div className="section-header">
                <div className="title-group">
                  <FaUser className="section-icon" />
                  <div className="section-texts">
                    <h5 className="section-title">Hesap Bilgileri</h5>
                    <span className="section-subtitle">Rol, departman ve zamanlar</span>
                  </div>
                </div>
              </div>
              <div className="info-grid-row">
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Rol</span>
                  </div>
                  <div className="item-value">
                    <span className="role-indicator" style={{ backgroundColor: user.color || '#4E0DCC', color: 'white' }}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                </div>
                {user.department && (
                  <div className="info-item">
                    <div className="item-header">
                      <span className="item-label">Departman</span>
                    </div>
                    <div className="item-value">{user.department}</div>
                  </div>
                )}
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Kayıt Tarihi</span>
                  </div>
                  <div className="item-value date-value">{formatDate(user.created_at)}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Son Giriş</span>
                  </div>
                  <div className="item-value last-seen-value">{formatLastSeen(user.last_seen)}</div>
                </div>
              </div>
            </div>

            {/* Yetkiler */}
            {user.permissions && (
              <div className="info-section">
                <div className="section-header">
                  <div className="title-group">
                    <FaUser className="section-icon" />
                    <div className="section-texts">
                      <h5 className="section-title">Yetkiler</h5>
                      <span className="section-subtitle">Tanımlı izinler</span>
                    </div>
                  </div>
                </div>
                <div className="info-grid-row">
                  <div className="info-item full-width">
                    <div className="item-header">
                      <span className="item-label">Yetki Listesi</span>
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
                </div>
              </div>
            )}

            {/* Biyografi */}
            {user.bio && (
              <div className="info-section">
                <div className="section-header">
                  <div className="title-group">
                    <FaUser className="section-icon" />
                    <div className="section-texts">
                      <h5 className="section-title">Biyografi</h5>
                      <span className="section-subtitle">Serbest metin</span>
                    </div>
                  </div>
                </div>
                <div className="info-grid-row">
                  <div className="info-item full-width">
                    <div className="item-header">
                      <span className="item-label">Biyografi</span>
                    </div>
                    <div className="notes-container">
                      <div className="notes-text">{user.bio}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info"></div>
          <Button className="close-button" onClick={onHide}>Kapat</Button>
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