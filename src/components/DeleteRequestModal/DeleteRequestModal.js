import React, { useState } from "react";
import { Modal, Button, Alert, Spinner } from "react-bootstrap";
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import requestsService from "../../services/requestsService";
import "./DeleteRequestModal.css";

const DeleteRequestModal = ({ show, onHide, request, onRequestDeleted }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  if (!request) return null;

  const handleDelete = async () => {
    setLoading(true);
    
    try {
      const response = await requestsService.deleteRequest(request.id);
      
      if (response.success) {
        showSuccess("Talep başarıyla silindi");
        
        setAlert({
          show: true,
          message: "Talep başarıyla silindi",
          type: "success"
        });
        
        setTimeout(() => {
          onRequestDeleted();
          onHide();
          setAlert({ show: false, message: "", type: "" });
        }, 1500);
      } else {
        showError(response.message || "Talep silinirken bir hata oluştu");
        
        setAlert({
          show: true,
          message: response.message || "Talep silinirken bir hata oluştu",
          type: "danger"
        });
      }
    } catch (error) {
      console.error("Talep silme hatası:", error);
      
      showError("Talep silinirken bir hata oluştu");
      
      setAlert({
        show: true,
        message: "Talep silinirken bir hata oluştu",
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAlert({ show: false, message: "", type: "" });
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="sm"
      className="delete-request-modal"
    >
      <Modal.Body className="text-center">
     

        <div className="mb-3">
          <i className="fas fa-exclamation-triangle text-danger" style={{fontSize: '3rem'}}></i>
        </div>
        
        <h5 className="mb-3">Bu talebi silmek istediğinizden emin misiniz?</h5>
        
        <div className="mb-4">
          <strong>{request.ad} {request.soyad}</strong>
          <div className="text-muted">{request.talep_basligi || "Belirtilmemiş"}</div>
        </div>

        <div className="d-flex gap-2 justify-content-center">
          <Button 
            variant="outline-secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Siliniyor...
              </>
            ) : (
              'Sil'
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteRequestModal;