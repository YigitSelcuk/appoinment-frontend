import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FaTimes, FaFileAlt } from 'react-icons/fa';
import { getProfileImageUrl } from '../../services/cvsService';
import './ViewCVModal.css';

const ViewCVModal = ({ show, onHide, cv }) => {
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  useEffect(() => {
    if (show && cv && cv.profil_resmi) {
      const loadProfileImage = async () => {
        try {
          const imageUrl = await getProfileImageUrl(cv.profil_resmi);
          setProfileImageUrl(imageUrl);
        } catch (error) {
          console.error('Profil resmi yüklenirken hata:', error);
        }
      };
      loadProfileImage();
    }
  }, [show, cv]);

  const handleClose = () => {
    setProfileImageUrl(null);
    onHide();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  if (!cv) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="view-cv-modal">
      <div className="modal-header">
        <h4 className="modal-title">CV Detayları</h4>
        <button className="btn-close" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>

      <div className="modal-body">
        {/* Kişisel Bilgiler */}
        <div className="info-section">
          <h5 className="section-title">Kişisel Bilgiler</h5>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Ad Soyad</span>
              <span className="info-value">{cv.adi && cv.soyadi ? `${cv.adi} ${cv.soyadi}` : '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">TC Kimlik No</span>
              <span className="info-value">{cv.tc_kimlik_no || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{cv.email || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Telefon</span>
              <span className="info-value">{cv.telefon || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">İlçe</span>
              <span className="info-value">{cv.ilce || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Mahalle</span>
              <span className="info-value">{cv.mahalle || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Adres</span>
              <span className="info-value">{cv.adres || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Kayıt Tarihi</span>
              <span className="info-value">{formatDate(cv.kayit_tarihi)}</span>
            </div>
          </div>
        </div>

        {/* Mesleki Bilgiler */}
        <div className="info-section">
          <h5 className="section-title">Mesleki Bilgiler</h5>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Meslek</span>
              <span className="info-value">{cv.meslek || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Talep Edilen İş</span>
              <span className="info-value">{cv.talep_edilen_is || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Durum</span>
              <span className="status-badge">{cv.durum || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Referans</span>
              <span className="info-value">{cv.referans || '-'}</span>
            </div>
          </div>
        </div>

  

        {/* Notlar */}
        {cv.notlar && (
          <div className="info-section">
            <h5 className="section-title">Notlar</h5>
            <div className="notes-section">
              <div className="notes-content">{cv.notlar}</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewCVModal;