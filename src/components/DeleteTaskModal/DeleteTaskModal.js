import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import './DeleteTaskModal.css';

const DeleteTaskModal = ({ isOpen, onClose, onConfirm, task }) => {
  // Toast hook'u
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
    showSuccess('Görev başarıyla silindi!');
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      className="delete-task-modal"
    >
      <Modal.Header closeButton>
        <div className="warning-icon">
          <i className="fas fa-trash-alt"></i>
        </div>
        <Modal.Title>Görev Sil</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="delete-confirmation">
          <div className="warning-icon">
            <i className="fas fa-trash-alt"></i>
          </div>
          
          <div className="confirmation-text">
            <h5>Bu görevi silmek istediğinizden emin misiniz?</h5>
            <p className="text-muted">Bu işlem geri alınamaz ve görev kalıcı olarak silinecektir.</p>
          </div>

          {task && (
            <div className="task-info">
              <div className="task-info-item">
                <strong>Görev:</strong>
                <span>{task.title}</span>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          İptal
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          <i className="fas fa-trash me-2"></i>
          Evet, Sil
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteTaskModal;