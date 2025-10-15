import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaUser, FaTimes } from 'react-icons/fa';
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
          <div className="header-content">
            <div className="header-left">
              <img
                src={contact.avatar || "/assets/images/logo.png"}
                alt="Profil Fotoğrafı"
                className="header-avatar"
                onClick={handleImageClick}
                onError={(e) => {
                  e.target.src = "/assets/images/logo.png";
                }}
              />
              <div className="header-info">
                <h4 className="modal-title">{contact.name} {contact.surname}</h4>
                <div className="contact-meta">
                  <span className="category-badge">
                    {contact.category}
                  </span>
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
                  <span className="info-label">TC Kimlik No</span>
                </div>
                <div className="info-value tc-number">{formatTCNo(contact.tc_no)}</div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">Cinsiyet</span>
                </div>
                <div className="info-value">
                  <span className={`gender-indicator ${contact.gender === 'ERKEK' ? 'gender-male' : 'gender-female'}`}>
                    {contact.gender === 'ERKEK' ? (
                      <>
                        <i className="fas fa-mars"></i>
                        Erkek
                      </>
                    ) : contact.gender === 'KADIN' ? (
                      <>
                        <i className="fas fa-venus"></i>
                        Kadın
                      </>
                    ) : 'Belirtilmemiş'}
                  </span>
                </div>
              </div>
              {contact.birth_date && (
                <div className="info-item">
                  <div className="item-header">
                    <span className="info-label">Doğum Tarihi</span>
                  </div>
                  <div className="info-value date-value">{formatDate(contact.birth_date)}</div>
                </div>
              )}
              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">Kayıt Tarihi</span>
                </div>
                <div className="info-value date-value">{formatDate(contact.created_at)}</div>
              </div>
              {contact.title && (
                <div className="info-item">
                  <div className="item-header">
                    <span className="info-label">Ünvan</span>
                  </div>
                  <div className="info-value">{contact.title}</div>
                </div>
              )}
              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">Birinci Telefon</span>
                </div>
                <div className="info-value phone-number">
                  <i className="fas fa-phone me-2"></i>
                  {formatPhone(contact.phone1)}
                </div>
              </div>
              {contact.phone2 && (
                <div className="info-item">
                  <div className="item-header">
                    <span className="info-label">İkinci Telefon</span>
                  </div>
                  <div className="info-value phone-number">
                    <i className="fas fa-phone me-2"></i>
                    {formatPhone(contact.phone2)}
                  </div>
                </div>
              )}
              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">E-posta</span>
                </div>
                <div className="info-value email-address">
                  <i className="fas fa-envelope me-2"></i>
                  {contact.email || "Belirtilmemiş"}
                </div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="info-label">Mahalle</span>
                </div>
                <div className="info-value location-value">
                  <i className="fas fa-map-pin me-2"></i>
                  {contact.district || "Belirtilmemiş"}
                </div>
              </div>
              {contact.address && (
                <div className="info-item" style={{gridColumn: '1 / -1'}}>
                  <div className="item-header">
                    <span className="info-label">Tam Adres</span>
                  </div>
                  <div className="info-value location-value">
                    <i className="fas fa-home me-2"></i>
                    {contact.address}
                  </div>
                </div>
              )}
              {contact.notes && (
                <div className="info-item" style={{gridColumn: '1 / -1'}}>
                  <div className="item-header">
                    <span className="info-label">Notlar</span>
                  </div>
                  <div className="notes-container">
                    {contact.notes}
                  </div>
                </div>
              )}
            </div>
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