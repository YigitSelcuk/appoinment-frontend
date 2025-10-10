import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaFileAlt, FaTimes, FaUser, FaBriefcase, FaUsers, FaStickyNote } from 'react-icons/fa';
import { cvsService, getProfileImageUrl } from '../../services/cvsService';
import './ViewCVModal.css';

const ViewCVModal = ({ isOpen, onClose, cvId }) => {
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  useEffect(() => {
    if (isOpen && cvId) {
      fetchCVDetails();
    }
  }, [isOpen, cvId]);

  const fetchCVDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cvsService.getCVById(cvId);
      if (response.success) {
        console.log('CV verisi:', response.data);
        console.log('Profil resmi:', response.data.profil_resmi);
        setCv(response.data);
        
        // Profil resmi URL'ini async olarak yükle
        if (response.data.profil_resmi) {
          const imageUrl = await getProfileImageUrl(response.data.profil_resmi);
          console.log('Profil resmi URL:', imageUrl);
          setProfileImageUrl(imageUrl);
        }
      } else {
        setError('CV bilgileri yüklenemedi.');
      }
    } catch (error) {
      console.error('CV detayları yüklenirken hata:', error);
      setError('CV bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCv(null);
    setError(null);
    setProfileImageUrl(null);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date.toLocaleDateString('tr-TR') : '-';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'İŞ ARIYOR':
        return 'bg-warning text-dark';
      case 'İŞ BULUNDU':
        return 'bg-success';
      case 'BEKLEMEDE':
        return 'bg-secondary';
      case 'YETİŞTİRİLDİ':
        return 'bg-info';
      case 'İŞLENMEDE':
        return 'bg-primary';
      case 'GÖLDAĞ':
        return 'bg-dark';
      case 'DEĞERLENDİRİLİYOR':
        return 'bg-warning text-dark';
      case 'YETİŞTİRİLECEK':
        return 'bg-info';
      default:
        return 'bg-light text-dark';
    }
  };

  const renderReferanslar = (referans) => {
    if (!referans) return '-';
    
    try {
      let referansListesi;
      
      if (typeof referans === 'object') {
        referansListesi = referans;
      } else if (typeof referans === 'string') {
        referansListesi = JSON.parse(referans);
      }
      
      if (Array.isArray(referansListesi) && referansListesi.length > 0) {
        return (
          <div className="referans-list">
            {referansListesi.map((ref, index) => (
              <div key={index} className="referans-item">
                <strong>{ref.isim}</strong>
                {ref.meslek && <div className="text-muted">{ref.meslek}</div>}
                {ref.telefon && <div className="text-muted">{ref.telefon}</div>}
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      console.log('Referans JSON parse hatası:', e);
    }
    
    return referans;
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" className="view-cv-modal">
      {/* Modal Header - Simple Form Style */}
      <div className="modal-header">
        <h4 className="modal-title">CV Görüntüle</h4>
        <button className="close-btn" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>
      
      {/* Modal Body */}
      <div className="modal-body">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">CV bilgileri yükleniyor...</div>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        ) : cv ? (
          <div className="unified-info-card">
            {/* Profile Section - Special */}
            {cv.profil_resmi && profileImageUrl && (
              <div className="profile-section">
                <div className="profile-image-container">
                  <img 
                    src={profileImageUrl} 
                    alt="Profil Resmi" 
                    className="profile-image"
                    onLoad={() => {
                      console.log('Profil resmi başarıyla yüklendi:', profileImageUrl);
                    }}
                    onError={(e) => {
                      console.log('Profil resmi yüklenirken hata:', profileImageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="profile-info">
                  <h2 className="profile-name">{cv.adi} {cv.soyadi}</h2>
                  {cv.meslek && <div className="profile-profession">{cv.meslek}</div>}
                  <div className="profile-status">
                    <Badge className={`status-badge ${getStatusBadgeClass(cv.durum)}`}>
                      <i className="fas fa-circle me-1"></i>
                      {cv.durum || 'Belirtilmemiş'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Kişisel Bilgiler Kartı */}
            <div className="info-section">
              <div className="section-header">
                <div className="section-icon">
                  <FaUser />
                </div>
                <h5 className="section-title">Kişisel Bilgiler</h5>
              </div>
              <div className="info-grid-row">
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Ad Soyad</span>
                  </div>
                  <div className="item-value">{cv.adi} {cv.soyadi}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Email</span>
                  </div>
                  <div className="item-value email">{cv.email || '-'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Telefon</span>
                  </div>
                  <div className="item-value">{cv.telefon || '-'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Adres</span>
                  </div>
                  <div className="item-value">{cv.adres || '-'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Ekleyen</span>
                  </div>
                  <div className="item-value">{cv.user_name || '-'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Kayıt Tarihi</span>
                  </div>
                  <div className="item-value date">{formatDate(cv.kayit_tarihi)}</div>
                </div>
              </div>
            </div>

            {/* Meslek ve Durum Kartı */}
            <div className="info-section">
              <div className="section-header">
                <div className="section-icon">
                  <FaBriefcase />
                </div>
                <h5 className="section-title">Meslek Bilgileri</h5>
              </div>
              <div className="info-grid-row">
                <div className="info-item">
                    <div className="item-header">
                      <span className="item-label">Meslek</span>
                    </div>
                    <div className="item-value">{cv.meslek || '-'}</div>
                  </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Durum</span>
                  </div>
                  <div className="item-value">
                    <Badge className={`status-badge ${getStatusBadgeClass(cv.durum)}`}>
                      <i className="fas fa-circle me-1"></i>
                      {cv.durum || '-'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Referanslar Kartı */}
            {renderReferanslar(cv.referans) !== '-' && (
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">
                    <FaUsers />
                  </div>
                  <h5 className="section-title">Referanslar</h5>
                </div>
                <div className="info-grid-row">
                  <div className="info-item full-width">
                    {renderReferanslar(cv.referans)}
                  </div>
                </div>
              </div>
            )}

            {/* Notlar Kartı */}
            {cv.notlar && (
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">
                    <FaStickyNote />
                  </div>
                  <h5 className="section-title">Notlar</h5>
                </div>
                <div className="info-grid-row">
                  <div className="info-item full-width">
                    <div className="notes-content">
                      {cv.notlar}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
      
      {/* Modal Footer */}
      <div className="modal-footer">
        <div className="footer-info">
          <span>CV Görüntüleme Sistemi - Tüm bilgiler güvenli şekilde saklanmaktadır</span>
        </div>
        <button className="close-button" onClick={handleClose}>
          <FaTimes />
          Kapat
        </button>
      </div>
    </Modal>
  );
};

export default ViewCVModal;