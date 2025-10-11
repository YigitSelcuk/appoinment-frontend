import React from 'react';
import { Modal, Row, Col, Badge } from 'react-bootstrap';
import './RequestDetailsModal.css';

const RequestDetailsModal = ({ show, onHide, request }) => {
  if (!request) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (talepDurumu, durum) => {
    let variant = 'secondary';
    let text = durum || talepDurumu || 'Bilinmiyor';

    switch (talepDurumu?.toLowerCase() || durum?.toLowerCase()) {
      case 'beklemede':
      case 'pending':
        variant = 'warning';
        text = 'Beklemede';
        break;
      case 'tamamlandı':
      case 'completed':
        variant = 'success';
        text = 'Tamamlandı';
        break;
      case 'iptal':
      case 'cancelled':
        variant = 'danger';
        text = 'İptal';
        break;
      case 'devam ediyor':
      case 'in_progress':
        variant = 'info';
        text = 'Devam Ediyor';
        break;
      default:
        variant = 'secondary';
        break;
    }

    return <Badge bg={variant}>{text}</Badge>;
  };

  const InfoRow = ({ label, value, colSize = 6 }) => (
    <Col md={colSize} className="mb-3">
      <div className="info-item">
        <label className="info-label">{label}:</label>
        <div className="info-value">{value || 'Belirtilmemiş'}</div>
      </div>
    </Col>
  );

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="request-details-modal">
      <Modal.Header closeButton className="request-details-header">
        <Modal.Title>
          <i className="fas fa-info-circle me-2"></i>
          Talep Detayları
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="request-details-body">
        <div className="request-details-container">
          {/* Talep Detayları */}
          <div className="details-section">
            <Row className="request-details-grid">
              <InfoRow label="ID" value={request.id} />
              <InfoRow label="Ad" value={request.ad} />
              <InfoRow label="Soyad" value={request.soyad} />
              <InfoRow label="TC No" value={request.tc_no} />
              <InfoRow label="Telefon" value={request.telefon} />
              <InfoRow label="İlçe" value={request.ilce} />
              <InfoRow label="Mahalle" value={request.mahalle} />
              <InfoRow label="Adres" value={request.adres} colSize={12} />
              <InfoRow label="Talep Durumu" value={getStatusBadge(request.talep_durumu, request.durum)} />
              <InfoRow label="Talep Türü" value={request.talep_turu} />
              <InfoRow label="Talep Başlığı" value={request.talep_basligi} colSize={12} />
              <InfoRow label="Durum" value={request.durum} />
              <InfoRow label="İlgili Müdürlük" value={request.ilgili_mudurluk} />
              <InfoRow label="Açıklama" value={request.aciklama} colSize={12} />
              <InfoRow label="Oluşturan" value={request.created_by_name} />
              <InfoRow label="Oluşturma Tarihi" value={formatDate(request.created_at)} />
            </Row>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer className="request-details-footer">
        <button type="button" className="btn btn-secondary" onClick={onHide}>
          <i className="fas fa-times me-2"></i>
          Kapat
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default RequestDetailsModal;