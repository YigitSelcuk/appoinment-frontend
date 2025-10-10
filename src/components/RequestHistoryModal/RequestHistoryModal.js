import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Spinner, Alert } from "react-bootstrap";
import requestsService from "../../services/requestsService";
import { useAuth } from "../../contexts/AuthContext";
import "./RequestHistoryModal.css";

const RequestHistoryModal = ({ show, onHide, request }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { accessToken } = useAuth();

  useEffect(() => {
    if (show && request) {
      fetchHistory();
    }
  }, [show, request]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await requestsService.getRequestStatusHistory(request.id, accessToken);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error("Talep geçmişi alınırken hata:", error);
      setError("Talep geçmişi alınamadı: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "DÜŞÜK": return "badge-low";
      case "NORMAL": return "badge-normal";
      case "ACİL": return "badge-urgent";
      case "ÇOK ACİL": return "badge-very-urgent";
      case "KRİTİK": return "badge-critical";
      case "İNCELENİYOR": return "badge-reviewing";
      case "ÇÖZÜM AŞAMASINDA": return "badge-solving";
      case "TEST AŞAMASINDA": return "badge-testing";
      case "TAMAMLANDI": return "badge-completed";
      case "İPTAL EDİLDİ": return "badge-cancelled";
      case "REDDEDİLDİ": return "badge-rejected";
      case "BEKLEMEDE": return "badge-waiting";
      case "ATANDI": return "badge-assigned";
      default: return "badge-default";
    }
  };

  const handleClose = () => {
    setHistory([]);
    setError("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Talep Durum Geçmişi</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {request && (
          <div className="request-info mb-4">
            <h6>Talep Bilgileri</h6>
            <div className="row">
              <div className="col-md-6">
                <p><strong>Başlık:</strong> {request.talep_basligi}</p>
                <p><strong>Talep Eden:</strong> {request.ad} {request.soyad}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Telefon:</strong> {request.telefon}</p>
                <p><strong>İlgili Müdürlük:</strong> {request.ilgili_mudurluk}</p>
              </div>
            </div>
            <p>
              <strong>Mevcut Durum:</strong>{" "}
              <span className={`status-badge ${getStatusBadgeClass(request.durum)}`}>
                {request.durum}
              </span>
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Geçmiş yükleniyor...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {!loading && !error && history.length === 0 && (
          <Alert variant="info">
            Bu talep için henüz durum güncellemesi yapılmamış.
          </Alert>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="history-timeline">
            <h6 className="mb-3">Durum Değişiklikleri</h6>
            
            <div className="timeline">
              {history.map((item, index) => (
                <div key={item.id} className={`timeline-item ${index === 0 ? 'first' : ''}`}>
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    {index < history.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div className="status-change">
                        {item.old_status && (
                          <span className={`status-badge ${getStatusBadgeClass(item.old_status)}`}>
                            {item.old_status}
                          </span>
                        )}
                        {item.old_status && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="arrow-icon">
                            <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        <span className={`status-badge ${getStatusBadgeClass(item.new_status)}`}>
                          {item.new_status}
                        </span>
                      </div>
                      <small className="text-muted">
                        {item.created_at_display}
                      </small>
                    </div>
                    
                    <div className="timeline-meta">
                      <p className="mb-1">
                        <strong>Güncelleyen:</strong> {item.updated_by_name}
                        {item.updated_by_department && (
                          <span className="department-badge">
                            {item.updated_by_department}
                          </span>
                        )}
                      </p>
                      
                      {item.comments && (
                        <div className="comments">
                          <strong>Açıklama:</strong>
                          <p className="comment-text">{item.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Kapat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RequestHistoryModal;