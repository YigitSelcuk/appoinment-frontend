import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { cvsService } from '../../services/cvsService';
import './DeleteCVModal.css';

const DeleteCVModal = ({ isOpen, onClose, cvId, onCVDeleted }) => {
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && cvId) {
      fetchCVDetails();
    }
  }, [isOpen, cvId]);

  const fetchCVDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cvsService.getCVById(cvId);
      if (response.success) {
        setCv(response.data);
      } else {
        setError('CV bilgileri yüklenemedi.');
      }
    } catch (error) {
      console.error('CV detayları yüklenirken hata:', error);
      setError('CV bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      const response = await cvsService.deleteCV(cvId);
      
      if (response.success) {
        onCVDeleted && onCVDeleted();
        handleClose();
      } else {
        setError(response.message || 'CV silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('CV silme hatası:', error);
      setError('CV silinirken bir hata oluştu: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setCv(null);
    setError(null);
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="sm" className="delete-cv-modal" centered>
      <Modal.Body className="text-center">
        {loading ? (
          <div className="py-4">
            <Spinner animation="border" variant="danger" />
            <div className="mt-2">CV bilgileri yükleniyor...</div>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        ) : cv ? (
          <>
            <div className="mb-3">
              <i className="fas fa-exclamation-triangle text-danger" style={{fontSize: '3rem'}}></i>
            </div>
            
            <h5 className="mb-3">Bu CV'yi silmek istediğinizden emin misiniz?</h5>
            
            <div className="mb-4">
              <strong>{cv.adi} {cv.soyadi}</strong>
              <div className="text-muted">{cv.meslek}</div>
              <div className="text-muted">{cv.email}</div>
            </div>
            
            <div className="d-flex gap-2 justify-content-center">
              <Button 
                variant="outline-secondary" 
                onClick={handleClose} 
                disabled={deleting}
              >
                İptal
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete} 
                disabled={deleting || loading || !cv}
              >
                {deleting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Siliniyor...
                  </>
                ) : (
                  'Sil'
                )}
              </Button>
            </div>
          </>
        ) : null}
      </Modal.Body>
    </Modal>
  );
};

export default DeleteCVModal;