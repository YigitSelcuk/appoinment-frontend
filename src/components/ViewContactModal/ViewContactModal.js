import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaUser, FaBriefcase, FaTimes } from 'react-icons/fa';
import './ViewContactModal.css';

const ViewContactModal = ({ show, onHide, contact }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  if (!contact) return null;

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
      day: 'numeric'
    });
  };

  const formatTCNo = (tcNo) => {
    if (!tcNo) return 'Belirtilmemiş';
    const cleaned = tcNo.toString().replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    return tcNo;
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" className="view-contact-modal">
        <div className="modal-header">
          <div className="header-left">
            <img
              src={contact.avatar || "/assets/images/logo.png"}
              alt="Profil Fotoğrafı"
              className="header-avatar"
              onClick={handleImageClick}
              onError={(e) => { e.target.src = "/assets/images/logo.png"; }}
            />
            <h4 className="modal-title">Kişi Detayları</h4>
          </div>
          <button className="close-btn" onClick={onHide}>
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
                  <div className="item-value">{(contact.name && contact.surname) ? `${contact.name} ${contact.surname}` : '-'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">TC Kimlik No</span>
                  </div>
                  <div className="item-value tc-number">{formatTCNo(contact.tc_no)}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Ünvan</span>
                  </div>
                  <div className="item-value">{contact.title || '-'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Grup</span>
                  </div>
                  <div className="item-value">{contact.category || 'GENEL'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Şehir</span>
                  </div>
                  <div className="item-value location-value">{contact.city || 'Belirtilmemiş'}</div>
                </div>
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">İlçe</span>
                  </div>
                  <div className="item-value location-value">{contact.district || 'Belirtilmemiş'}</div>
                </div>
                {contact.address && (
                  <div className="info-item full-width">
                    <div className="item-header">
                      <span className="item-label">Adres</span>
                    </div>
                    <div className="item-value location-value">{contact.address}</div>
                  </div>
                )}
                
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="info-section">
              <div className="section-header">
                <div className="section-icon"><FaBriefcase /></div>
                <h5 className="section-title">İletişim Bilgileri</h5>
              </div>
              <div className="info-grid-row">
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Birinci Telefon</span>
                  </div>
                  <div className="item-value phone-number">{formatPhone(contact.phone1)}</div>
                </div>
                {contact.phone2 && (
                  <div className="info-item">
                    <div className="item-header">
                      <span className="item-label">İkinci Telefon</span>
                    </div>
                    <div className="item-value phone-number">{formatPhone(contact.phone2)}</div>
                  </div>
                )}
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">E-posta</span>
                  </div>
                  <div className="item-value email-address">{contact.email || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>

            {/* Notlar */}
            {contact.notes && (
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
                      <div className="notes-text">{contact.notes}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info">
          </div>
          <Button className="close-button" onClick={onHide}>
             Kapat
          </Button>
        </div>
      </Modal>

      {/* Image Enlargement Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        centered 
        size="xl"
        className="view-contact-modal image-modal"
      >
        <Modal.Body>
          <img
            src={contact?.avatar || "/assets/images/logo.png"}
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

export default ViewContactModal;