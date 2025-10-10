import React, { useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { contactsService } from "../../services/contactsService";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import "./DeleteContactModal.css";

const DeleteContactModal = ({ show, onHide, contact, onContactDeleted }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [loading, setLoading] = useState(false);

  if (!contact) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const response = await contactsService.deleteContact(contact.id);
      
      if (response.success) {
        showSuccess('Kişi başarıyla silindi');
        onContactDeleted();
        onHide();
      } else {
        showError('Kişi silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Kişi silinirken hata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen bir hata oluştu';
      showError('Kişi silinirken hata oluştu: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="sm"
      centered
      className="delete-contact-modal"
    >
      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <i className="fas fa-trash-alt text-danger" style={{ fontSize: '2.5rem' }}></i>
        </div>
        
        <h5 className="mb-3">Kişiyi Sil</h5>
        
        <p className="text-muted mb-3">
          <strong>{contact.name} {contact.surname}</strong> adlı kişiyi silmek istediğinizden emin misiniz?
        </p>
        
        <div className="d-flex gap-2 justify-content-center">
          <Button 
            variant="outline-secondary" 
            onClick={onHide} 
            disabled={loading}
            size="sm"
          >
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
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

export default DeleteContactModal;