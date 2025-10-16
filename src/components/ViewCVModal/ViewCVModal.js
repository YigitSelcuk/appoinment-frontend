import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaTimes, FaUser, FaBriefcase } from 'react-icons/fa';
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
    <Modal show={show} onHide={handleClose} centered size="lg" className="view-cv-modal">
      <div className="modal-header">
        <h4 className="modal-title">CV Detayları</h4>
        <button className="close-btn" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>
      <div className="modal-body">
        <div className="unified-info-card">
          {/* Kişisel Bilgiler */}
          <div className="info-section">
            <div className="section-header">
              <div className="section-icon"><FaUser /></div>
              <h5 className="section-title">Kişisel Bilgiler</h5>
            </div>
            <div className="info-grid-row">
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Ad Soyad</span>
                </div>
                <div className="item-value">{cv.adi && cv.soyadi ? `${cv.adi} ${cv.soyadi}` : '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">TC Kimlik No</span>
                </div>
                <div className="item-value">{cv.tc_kimlik_no || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Email</span>
                </div>
                <div className="item-value email-address">{cv.email || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Telefon</span>
                </div>
                <div className="item-value">{cv.telefon || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">İlçe</span>
                </div>
                <div className="item-value">{cv.ilce || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Mahalle</span>
                </div>
                <div className="item-value">{cv.mahalle || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Adres</span>
                </div>
                <div className="item-value">{cv.adres || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Kayıt Tarihi</span>
                </div>
                <div className="item-value date-value">{formatDate(cv.kayit_tarihi)}</div>
              </div>
            </div>
          </div>

          {/* Mesleki Bilgiler */}
          <div className="info-section">
            <div className="section-header">
              <div className="section-icon"><FaBriefcase /></div>
              <h5 className="section-title">Mesleki Bilgiler</h5>
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
                  <span className="item-label">Talep Edilen İş</span>
                </div>
                <div className="item-value">{cv.talep_edilen_is || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Durum</span>
                </div>
                <div className="item-value">{cv.durum || '-'}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Referans</span>
                </div>
                <div className="item-value">{cv.referans || '-'}</div>
              </div>
            </div>
          </div>

          {/* Notlar */}
          {cv.notlar && (
            <div className="info-section">
              <div className="section-header">
                <div className="section-icon"><FaBriefcase /></div>
                <h5 className="section-title">Notlar</h5>
              </div>
              <div className="info-grid-row">
                <div className="info-item full-width">
                  <div className="item-header">
                    <span className="item-label">Notlar</span>
                  </div>
                  <div className="notes-container">
                    <div className="notes-text">{cv.notlar}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <div className="footer-info"></div>
        <Button className="close-button" onClick={handleClose}>Kapat</Button>
      </div>
    </Modal>
  );
};

export default ViewCVModal;