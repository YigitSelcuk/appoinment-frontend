import React, { useState, useEffect } from "react";
import { Modal, Button, Badge, Form, Spinner } from "react-bootstrap";
import requestsService from "../../services/requestsService";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { useAuth } from "../../contexts/AuthContext";
import "./ViewRequestModal.css";

const ViewRequestModal = ({ show, onHide, request, onRequestUpdated }) => {
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  
  // Durum güncelleme state'leri
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { showSuccess, showError } = useSimpleToast();
  const { accessToken } = useAuth();

  // Modal açıldığında status history'yi yükle ve form'u resetle
  useEffect(() => {
    if (show && request) {
      fetchStatusHistory();
      setNewStatus("");
      setStatusComment("");
    }
  }, [show, request]);

  const fetchStatusHistory = async () => {
    setLoadingHistory(true);
    setHistoryError("");
    
    try {
      const response = await requestsService.getRequestStatusHistory(request.id, accessToken);
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

  // Durum güncelleme fonksiyonu
  const handleStatusUpdate = async () => {
    if (!newStatus.trim()) {
      showError("Lütfen yeni durumu seçiniz");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await requestsService.updateRequestStatus(request.id, {
        durum: newStatus,
        comments: statusComment.trim()
      });

      if (response.success) {
        showSuccess("Talep durumu başarıyla güncellendi");
        
        // Status history'yi yeniden yükle
        await fetchStatusHistory();
        
        // Parent component'i bilgilendir
        if (onRequestUpdated) {
          onRequestUpdated();
        }
        
        // Form'u resetle
        setNewStatus("");
        setStatusComment("");
      } else {
        showError(response.message || "Durum güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
      showError("Durum güncellenirken hata oluştu");
    } finally {
      setIsUpdating(false);
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
      case "OLUŞTURULDU":
      case "OLUSTURULDU": return "primary";
      case "İŞLEM YAPILIYOR":
      case "ISLEM_YAPILIYOR": return "warning";
      case "TAMAMLANDI": return "success";
      case "İPTAL EDİLDİ":
      case "IPTAL_EDILDI": return "secondary";
      case "BEKLEMEDE": return "info";
      case "REDDEDİLDİ": return "danger";
      case "DÜŞÜK": return "success";
      case "NORMAL": return "info";
      case "ACİL": return "warning";
      case "ÇOK ACİL": return "danger";
      case "KRİTİK": return "danger";
      case "İNCELENİYOR": return "secondary";
      case "ÇÖZÜM AŞAMASINDA": return "primary";
      case "TEST AŞAMASINDA": return "info";
      case "ATANDI": return "info";
      default: return "secondary";
    }
  };

  const getTimelineDotColor = (status) => {
    switch (status) {
      case "OLUŞTURULDU":
      case "OLUSTURULDU": return "purple";
      case "İŞLEM YAPILIYOR":
      case "ISLEM_YAPILIYOR": return "orange";
      case "TAMAMLANDI": return "green";
      case "İPTAL EDİLDİ":
      case "IPTAL_EDILDI": return "gray";
      case "BEKLEMEDE": return "blue";
      case "REDDEDİLDİ": return "red";
      default: return "gray";
    }
  };

  const getTimelineTitle = (status) => {
    switch (status) {
      // Öncelik seviyeleri
      case "DÜŞÜK": return "DÜŞÜK ÖNCELİK ATANDI";
      case "NORMAL": return "NORMAL ÖNCELİK ATANDI";
      case "ACİL": return "ACİL ÖNCELİK ATANDI";
      case "ÇOK ACİL": return "ÇOK ACİL ÖNCELİK ATANDI";
      case "KRİTİK": return "KRİTİK ÖNCELİK ATANDI";
      
      // Süreç durumları
      case "İNCELENİYOR": return "TALEP İNCELENİYOR";
      case "ÇÖZÜM AŞAMASINDA": return "ÇÖZÜM AŞAMASINDA";
      case "TEST AŞAMASINDA": return "TEST AŞAMASINDA";
      case "ATANDI": return "TALEP ATANDI";
      
      // Mevcut durumlar (eski kodlarla uyumluluk için)
      case "OLUŞTURULDU":
      case "OLUSTURULDU": return "TALEP OLUŞTURULDU";
      case "İŞLEM YAPILIYOR":
      case "ISLEM YAPILIYOR": return "İŞLEM BAŞLATILDI";
      case "TAMAMLANDI": return "İŞLEM TAMAMLANDI";
      case "İPTAL EDİLDİ":
      case "IPTAL EDILDI": return "TALEP İPTAL EDİLDİ";
      case "BEKLEMEDE": return "TALEP BEKLEMEDE";
      case "REDDEDİLDİ": return "TALEP REDDEDİLDİ";
      
      default: return "DURUM GÜNCELLENDİ";
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
        <Modal.Title className="modal-title-new">TALEP GÖRÜNTÜLEME</Modal.Title>
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

          {!loadingHistory && historyError && (
            <div className="text-center py-4">
              <p className="text-danger mb-0">{historyError}</p>
            </div>
          )}

          {!loadingHistory && !historyError && (
            <>
              {/* İlk talep oluşturma kaydı */}
              <div className="timeline-item">
                <div className="timeline-dot purple"></div>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className="timeline-date">{formatDate(request.created_at_display || request.created_at)}</span>
                    <span className="timeline-separator">•</span>
                    <span className="timeline-department">{request.ilgili_mudurluk}</span>
                    <span className="timeline-separator">•</span>
                    <span className="timeline-user">{request.created_by_name || 'Sistem'}</span>
                  </div>
                  <div className="timeline-title-row">
                    <div className="timeline-title">{request.talep_basligi || 'Talep Başlığı Bulunamadı'}</div>
                    <Badge bg="primary" className="timeline-badge">OLUŞTURULDU</Badge>
                  </div>
                  <div className="timeline-comment mt-2">
                    <small className="text-muted">
                      {request.aciklama && (
                        <>
                          <strong></strong> {request.aciklama}
                        </>
                      )}
                    </small>
                  </div>
                </div>
              </div>

              {/* Durum geçmişi kayıtları */}
              {statusHistory.length > 0 && statusHistory.map((item, index) => (
                <div key={item.id} className="timeline-item">
                  <div className={`timeline-dot ${getTimelineDotColor(item.new_status)}`}></div>
                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span className="timeline-date">{formatDate(item.created_at)}</span>
                      <span className="timeline-separator">•</span>
                      <span className="timeline-department">{item.updated_by_department || request.ilgili_mudurluk}</span>
                      <span className="timeline-separator">•</span>
                      <span className="timeline-user">{item.updated_by_name || 'Sistem'}</span>
                    </div>
                    <div className="timeline-title-row">
                      <div className="timeline-title">{request.talep_basligi || 'Talep Başlığı Bulunamadı'}</div>
                      <Badge bg={getStatusBadgeVariant(item.new_status)} className="timeline-badge">{item.new_status}</Badge>
                    </div>
                    {item.comments && (
                      <div className="timeline-comment mt-2">
                        <small className="text-muted">{item.comments}</small>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Eğer hiç durum geçmişi yoksa sadece oluşturma kaydı gösterilir */}
              {statusHistory.length === 0 && (
                <div className="text-center py-3">
                  <small className="text-muted">Henüz durum güncellemesi yapılmamış</small>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Update Form Section */}
        <div className="form-section">
          <div className="form-header">
            <h5>TALEP DURUM GÜNCELLEME</h5>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>İŞLEM TAMAMLANDI</label>
              <Form.Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-control-new"
              >
                <option value="">Durum seçiniz...</option>
                <option value="OLUSTURULDU">OLUŞTURULDU</option>
                <option value="ISLEM_YAPILIYOR">İŞLEM YAPILIYOR</option>
                <option value="TAMAMLANDI">TAMAMLANDI</option>
                <option value="IPTAL_EDILDI">İPTAL EDİLDİ</option>
                <option value="BEKLEMEDE">BEKLEMEDE</option>
              </Form.Select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>DURUM AÇIKLAMASI</label>
              <Form.Control
                as="textarea"
                rows={4}
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Durum güncellemesi için açıklama giriniz..."
                className="form-control-new"
              />
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="modal-footer-new">
        <Button variant="secondary" onClick={onHide} className="cancel-btn">
          İPTAL ET
        </Button>
        <Button 
          variant="success" 
          onClick={handleStatusUpdate}
          disabled={isUpdating}
          className="save-btn"
        >
          {isUpdating ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Kaydediliyor...
            </>
          ) : (
            "KAYDET"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewRequestModal;