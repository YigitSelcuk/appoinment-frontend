import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { FaTimes, FaTag, FaCalendar, FaInfo } from 'react-icons/fa';
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
    <Modal show={show} onHide={onHide} centered size="xl" className="view-category-modal">
      <div className="modal-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-text">
              <h4 className="modal-title">
                <FaTag className="me-2" />
                Kategori Detayları
              </h4>
              <p className="category-name">{category.name}</p>
            </div>
          </div>
          <Button variant="link" onClick={onHide} className="close-btn">
            <FaTimes />
          </Button>
        </div>
      </div>

      <Modal.Body>
        <div className="category-details">
          <Row className="mb-4">
            <Col md={6}>
              <div className="detail-item">
                <label className="detail-label">
                  <FaTag className="me-2" />
                  Kategori ID
                </label>
                <div className="detail-value">#{category.id || 'Belirtilmemiş'}</div>
              </div>
            </Col>
            <Col md={6}>
              <div className="detail-item">
                <label className="detail-label">
                  <FaTag className="me-2" />
                  Kategori Adı
                </label>
                <div className="detail-value">{category.name || 'Belirtilmemiş'}</div>
              </div>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <div className="detail-item">
                <label className="detail-label">
                  <FaTag className="me-2" />
                  Alt Kategori
                </label>
                <div className="detail-value">{category.alt_kategori || 'Belirtilmemiş'}</div>
              </div>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <div className="detail-item">
                <label className="detail-label">
                  <FaInfo className="me-2" />
                  Açıklama
                </label>
                <div className="detail-value description">
                  {category.description || 'Açıklama belirtilmemiş'}
                </div>
              </div>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <div className="detail-item">
                <label className="detail-label">
                  <FaTag className="me-2" />
                  Kişi Sayısı
                </label>
                <div className="detail-value contact-count">
                  {category.contact_count || 0} kişi
                </div>
              </div>
            </Col>
          </Row>


        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Kapat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewCategoryModal;