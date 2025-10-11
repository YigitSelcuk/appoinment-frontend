import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import './DeleteUserModal.css';

const DeleteUserModal = ({ show, onHide, user, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    
    try {
      await onDelete(user.id);
      onHide();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="sm"
      centered
      className="delete-user-modal"
    >
      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <i className="fas fa-trash-alt text-danger" style={{ fontSize: '2.5rem' }}></i>
        </div>
        
        <h5 className="mb-3">Kullanıcıyı Sil</h5>
        
        <p className="text-muted mb-3">
          <strong>{user.name}</strong> adlı kullanıcıyı silmek istediğinizden emin misiniz?
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

export default DeleteUserModal;