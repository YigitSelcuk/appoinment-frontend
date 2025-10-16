import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaTimes, FaTag } from 'react-icons/fa';
import './ViewCategoryModal.css';

const ViewCategoryModal = ({ show, onHide, category }) => {
  if (!category) return null;

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

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="view-category-modal">
      <div className="modal-header">
        <h4 className="modal-title">Kategori Detayları</h4>
        <button className="close-btn" onClick={onHide}>
          <FaTimes />
        </button>
      </div>
      <div className="modal-body">
        <div className="unified-info-card">
          <div className="info-section">
            <div className="section-header">
              <div className="section-icon"><FaTag /></div>
              <h5 className="section-title">Kategori Bilgileri</h5>
            </div>

            <div className="info-grid-row">
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Kategori ID</span>
                </div>
                <div className="item-value">#{category.id || 'Belirtilmemiş'}</div>
              </div>

              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Kategori Adı</span>
                </div>
                <div className="item-value">{category.name || 'Belirtilmemiş'}</div>
              </div>

              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Alt Kategori</span>
                </div>
                <div className="item-value">{category.alt_kategori || 'Belirtilmemiş'}</div>
              </div>

              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Kişi Sayısı</span>
                </div>
                <div className="item-value">{category.contact_count || 0} kişi</div>
              </div>

              <div className="info-item full-width">
                <div className="item-header">
                  <span className="item-label">Açıklama</span>
                </div>
                <div className="notes-container">
                  <div className="notes-text">{category.description || 'Açıklama belirtilmemiş'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <div className="footer-info"></div>
        <Button className="close-button" onClick={onHide}>Kapat</Button>
      </div>
    </Modal>
  );
};

export default ViewCategoryModal;