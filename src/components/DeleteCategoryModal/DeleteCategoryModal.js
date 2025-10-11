import React, { useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import "./DeleteCategoryModal.css";

const DeleteCategoryModal = ({ show, onHide, category, onCategoryDeleted }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [loading, setLoading] = useState(false);

  if (!category) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      // API çağrısı burada yapılacak - şimdilik simüle ediyoruz
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Kategori başarıyla silindi');
      onCategoryDeleted();
      onHide();
    } catch (error) {
      console.error('Kategori silinirken hata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen bir hata oluştu';
      showError('Kategori silinirken hata oluştu: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="md"
      centered
      className="delete-category-modal"
    >
      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <i className="fas fa-trash-alt text-danger" style={{ fontSize: '2.5rem' }}></i>
        </div>
        
        <h5 className="mb-3">Kategoriyi Sil</h5>
        
        <p className="text-muted mb-3">
          <strong>{category.name}</strong> adlı kategoriyi silmek istediğinizden emin misiniz?
        </p>
        
        {category.contact_count > 0 && (
          <div className="alert alert-warning mb-3">
            <small>
              <i className="fas fa-exclamation-triangle me-1"></i>
              Bu kategoride {category.contact_count} kişi bulunmaktadır.
            </small>
          </div>
        )}
        
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

export default DeleteCategoryModal;