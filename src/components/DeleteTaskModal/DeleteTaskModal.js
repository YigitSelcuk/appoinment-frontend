import React, { useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { deleteTask } from "../../services/tasksService";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { useAuth } from "../../contexts/AuthContext";
import "./DeleteTaskModal.css";

const DeleteTaskModal = ({ show, onHide, task, onTaskDeleted }) => {
  const { showSuccess, showError } = useSimpleToast();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      await deleteTask(accessToken, task.id);
      
      showSuccess('Görev başarıyla silindi');
      onTaskDeleted();
      onHide();
    } catch (error) {
      console.error('Görev silinirken hata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen bir hata oluştu';
      showError('Görev silinirken hata oluştu: ' + errorMessage);
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
      className="delete-task-modal"
    >
      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <i className="fas fa-trash-alt text-danger" style={{ fontSize: '2.5rem' }}></i>
        </div>
        
        <h5 className="mb-3">Görevi Sil</h5>
        
        <p className="text-muted mb-3">
          <strong>{task.title}</strong> adlı görevi silmek istediğinizden emin misiniz?
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

export default DeleteTaskModal;