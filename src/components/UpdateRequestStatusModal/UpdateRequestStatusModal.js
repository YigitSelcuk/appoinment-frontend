import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import requestsService from "../../services/requestsService";
import "./UpdateRequestStatusModal.css";

const UpdateRequestStatusModal = ({ show, onHide, request, onStatusUpdated }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [formData, setFormData] = useState({
    durum: "",
    comments: ""
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Modal açıldığında mevcut durumu set et
  useEffect(() => {
    if (request && show) {
      setFormData({
        durum: request.durum || "",
        comments: ""
      });
      setAlert({ show: false, message: "", type: "" });
    }
  }, [request, show]);

  const statusOptions = [
    "DÜŞÜK",
    "NORMAL", 
    "ACİL",
    "ÇOK ACİL",
    "KRİTİK",
    "İNCELENİYOR",
    "ÇÖZÜM AŞAMASINDA", 
    "TEST AŞAMASINDA",
    "TAMAMLANDI",
    "İPTAL EDİLDİ",
    "REDDEDİLDİ",
    "BEKLEMEDE",
    "ATANDI"
  ];

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.durum) {
      setAlert({
        show: true,
        message: "Lütfen yeni durumu seçiniz",
        type: "danger"
      });
      return;
    }

    if (formData.durum === request.durum) {
      setAlert({
        show: true,
        message: "Seçilen durum mevcut durumla aynı",
        type: "warning"
      });
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    try {
      await requestsService.updateRequestStatus(request.id, {
        durum: formData.durum,
        comments: formData.comments
      });

      showSuccess("Talep durumu başarıyla güncellendi");

      setAlert({
        show: true,
        message: "Talep durumu başarıyla güncellendi",
        type: "success"
      });

      // 1.5 saniye sonra modal'ı kapat ve listeyi yenile
      setTimeout(() => {
        onStatusUpdated();
        onHide();
      }, 1500);

    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      
      showError(error.message || "Durum güncellenirken hata oluştu");
      
      setAlert({
        show: true,
        message: error.message || "Durum güncellenirken hata oluştu",
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      durum: "",
      comments: ""
    });
    setAlert({ show: false, message: "", type: "" });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Talep Durumu Güncelle</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {alert.show && (
          <Alert variant={alert.type} className="mb-3">
            {alert.message}
          </Alert>
        )}

        {request && (
          <div className="request-info mb-3">
            <h6>Talep Bilgileri</h6>
            <p><strong>Başlık:</strong> {request.talep_basligi}</p>
            <p><strong>Talep Eden:</strong> {request.ad} {request.soyad}</p>
            <p>
              <strong>Mevcut Durum:</strong>{" "}
              <span className={`status-badge ${getStatusBadgeClass(request.durum)}`}>
                {request.durum}
              </span>
            </p>
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Yeni Durum <span className="required">*</span></Form.Label>
            <Form.Select
              name="durum"
              value={formData.durum}
              onChange={handleChange}
              required
            >
              <option value="">Durum Seçiniz</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Açıklama/Notlar</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              placeholder="Durum değişikliği hakkında açıklama yazabilirsiniz..."
            />
          </Form.Group>

          {formData.durum && formData.durum !== request?.durum && (
            <div className="status-preview mb-3">
              <small className="text-muted">Yeni durum:</small>
              <div>
                <span className={`status-badge ${getStatusBadgeClass(formData.durum)}`}>
                  {formData.durum}
                </span>
              </div>
            </div>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          İptal
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading || !formData.durum || formData.durum === request?.durum}
        >
          {loading ? "Güncelleniyor..." : "Durumu Güncelle"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateRequestStatusModal;