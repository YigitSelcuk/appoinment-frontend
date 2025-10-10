import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import './DeleteAppointmentModal.css';

const DeleteAppointmentModal = ({ isOpen, onClose, onConfirm, appointmentData }) => {
  const { user } = useAuth();
  const { showError } = useSimpleToast();
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    // Yetki kontrolü kaldırıldı - herkes silebilir
    onConfirm(appointmentData?.id);
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      size="sm"
      centered
      className="delete-appointment-modal"
    >
      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <i className="fas fa-trash-alt text-danger" style={{ fontSize: '2.5rem' }}></i>
        </div>
        
        <h5 className="mb-3">Randevuyu Sil</h5>
        
        <p className="text-muted mb-3">
          <strong>{appointmentData?.title}</strong> adlı randevuyu silmek istediğinizden emin misiniz?
        </p>
        
        <div className="d-flex gap-2 justify-content-center">
          <Button 
            variant="outline-secondary" 
            onClick={onClose} 
            size="sm"
          >
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirm} 
            size="sm"
          >
            Sil
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteAppointmentModal;