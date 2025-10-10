import React, { useState, useEffect } from "react";
import { Modal, Button, Badge, Form, Spinner } from "react-bootstrap";
import requestsService from "../../services/requestsService";
import "./ViewRequestModal.css";

const ViewRequestModal = ({ show, onHide, request }) => {
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Modal açıldığında status history'yi yükle
  useEffect(() => {
    if (show && request) {
      fetchStatusHistory();
    }
  }, [show, request]);

  const fetchStatusHistory = async () => {
    setLoadingHistory(true);
    setHistoryError("");
    
    try {
      const response = await requestsService.getRequestStatusHistory(request.id);
      if (response.success) {
        setStatusHistory(response.data);
      }
    } catch (error) {
      console.error("Status history alınamadı:", error);
      setHistoryError("Durum geçmişi yüklenemedi");
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!request) return null;

  const formatPhone = (phone) => {
    if (!phone) return "Belirtilmemiş";
    return phone.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Belirtilmemiş";
    }
  };

  const formatTCNo = (tcNo) => {
    if (!tcNo) return "Belirtilmemiş";
    return tcNo.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{1})/, "$1 $2 $3 $4 $5");
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "DÜŞÜK": return "success";
      case "NORMAL": return "info";
      case "ACİL": return "warning";
      case "ÇOK ACİL": return "danger";
      case "KRİTİK": return "danger";
      case "İNCELENİYOR": return "secondary";
      case "ÇÖZÜM AŞAMASINDA": return "primary";
      case "TEST AŞAMASINDA": return "info";
      case "TAMAMLANDI": return "success";
      case "İPTAL EDİLDİ": return "secondary";
      case "REDDEDİLDİ": return "danger";
      case "BEKLEMEDE": return "warning";
      case "ATANDI": return "info";
      default: return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "DÜŞÜK": return "success";
      case "NORMAL": return "info";
      case "KRİTİK": return "danger";
      default: return "secondary";
    }
  };

  const calculateRequestDuration = (createdAt) => {
    if (!createdAt) return "N/A";
    
    try {
      const now = new Date();
      const created = new Date(createdAt);
      
      if (isNaN(created.getTime())) {
        return 'Geçersiz tarih';
      }
      
      const diffMs = now - created;
      
      if (diffMs < 0) {
        return 'Henüz başlamadı';
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days} gün ${hours} saat`;
      } else if (hours > 0) {
        return `${hours} saat ${minutes} dk`;
      } else if (minutes > 0) {
        return `${minutes} dakika`;
      } else {
        return 'Az önce';
      }
    } catch (error) {
      console.error('Tarih hesaplama hatası:', error);
      return 'Hesaplanamadı';
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="view-request-modal-new"
    >
      <Modal.Header className="modal-header-new">
        <Modal.Title className="modal-title-new">TALEP DETAYLARI</Modal.Title>
        <Button variant="link" onClick={onHide} className="close-btn-new">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </Modal.Header>

      <Modal.Body className="modal-body-new">
        {/* Timeline Section */}
        <div className="timeline-section">
          {loadingHistory && (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <p className="mt-2 mb-0">Durum geçmişi yükleniyor...</p>
            </div>
          )}

          {!loadingHistory && statusHistory.length === 0 && (
            <div className="timeline-item">
              <div className="timeline-dot purple"></div>
              <div className="timeline-content">
                <div className="timeline-date">{formatDate(request.created_at_display || request.created_at)}</div>
                <div className="timeline-department">{request.ilgili_mudurluk}</div>
                <div className="timeline-user">{request.ad} {request.soyad}</div>
                <div className="timeline-title">{request.talep_turu}</div>
                <Badge bg={getStatusBadgeVariant(request.durum)} className="timeline-badge">{request.durum}</Badge>
              </div>
            </div>
          )}

          {!loadingHistory && statusHistory.length > 0 && statusHistory.map((item, index) => (
            <div key={item.id} className="timeline-item">
              <div className={`timeline-dot ${index === 0 ? 'purple' : index === 1 ? 'orange' : 'green'}`}></div>
              <div className="timeline-content">
                <div className="timeline-date">{formatDate(item.created_at)}</div>
                <div className="timeline-department">{item.updated_by_department || request.ilgili_mudurluk}</div>
                <div className="timeline-user">{item.updated_by_name}</div>
                <div className="timeline-title">{request.talep_turu}</div>
                <Badge bg={getStatusBadgeVariant(item.new_status)} className="timeline-badge">{item.new_status}</Badge>
                {item.comments && (
                  <div className="timeline-comment mt-2">
                    <small className="text-muted">{item.comments}</small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form Section */}
        <div className="form-section">
          <div className="form-header">
            <h5>TALEP BİLGİLERİ</h5>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>TALEP EDEN</label>
              <Form.Control
                type="text"
                value={request.ad + " " + request.soyad}
                readOnly
                className="form-control-readonly"
              />
            </div>
            <div className="form-group">
              <label>TC KİMLİK NO</label>
              <Form.Control
                type="text"
                value={formatTCNo(request.tc_no)}
                readOnly
                className="form-control-readonly"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>TELEFON</label>
              <Form.Control
                type="text"
                value={formatPhone(request.telefon)}
                readOnly
                className="form-control-readonly"
              />
            </div>
            <div className="form-group">
              <label>İLGİLİ MÜDÜRLÜK</label>
              <Form.Control
                type="text"
                value={request.ilgili_mudurluk}
                readOnly
                className="form-control-readonly"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>İLÇE</label>
              <Form.Control
                type="text"
                value={request.ilce || "Belirtilmemiş"}
                readOnly
                className="form-control-readonly"
              />
            </div>
            <div className="form-group">
              <label>MAHALLE</label>
              <Form.Control
                type="text"
                value={request.mahalle || "Belirtilmemiş"}
                readOnly
                className="form-control-readonly"
              />
            </div>
          </div>

          {request.adres && (
            <div className="form-row">
              <div className="form-group full-width">
                <label>ADRES</label>
                <Form.Control
                  type="text"
                  value={request.adres}
                  readOnly
                  className="form-control-readonly"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group full-width">
              <label>TALEP BAŞLIĞI</label>
              <Form.Control
                type="text"
                value={request.talep_basligi}
                readOnly
                className="form-control-readonly"
              />
            </div>
          </div>

          {request.aciklama && (
            <div className="form-row">
              <div className="form-group full-width">
                <label>AÇIKLAMA</label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={request.aciklama}
                  readOnly
                  className="form-control-readonly"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>ÖNCELİK</label>
              <Form.Control
                type="text"
                value={request.talep_durumu}
                readOnly
                className="form-control-readonly"
              />
            </div>
            <div className="form-group">
              <label>MEVCUT DURUM</label>
              <Form.Control
                type="text"
                value={request.durum}
                readOnly
                className="form-control-readonly"
              />
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="modal-footer-new">
        <Button variant="secondary" onClick={onHide} className="cancel-btn">
          KAPAT
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewRequestModal;