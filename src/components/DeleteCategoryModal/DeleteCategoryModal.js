import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { fetchAllCategoriesForDropdown, deleteCategory } from "../../services/categoriesService";
import "./DeleteCategoryModal.css";

const DeleteCategoryModal = ({ show, onHide, category, onCategoryDeleted }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedTargetCategory, setSelectedTargetCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Kategorileri yükle
  useEffect(() => {
    if (show && category?.contact_count > 0) {
      loadCategories();
    }
  }, [show, category]);

  if (!category) return null;

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetchAllCategoriesForDropdown();
      if (response.success) {
        // Silinecek kategoriyi listeden çıkar
        const filteredCategories = response.data.filter(cat => cat.id !== category.id);
        setCategories(filteredCategories);
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      showError('Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Kişi sayısı > 0 ise hedef kategori seçimi zorunlu
      if (category.contact_count > 0 && !selectedTargetCategory) {
        showError('Lütfen kişilerin taşınacağı kategoriyi seçin');
        return;
      }

      setLoading(true);
      
      // API çağrısı - kişi taşıma bilgisiyle birlikte
      const deleteData = {
        categoryId: category.id,
        targetCategoryId: selectedTargetCategory || null
      };

      const response = await deleteCategory(category.id, deleteData);
      
      if (response.success) {
        if (category.contact_count > 0 && selectedTargetCategory) {
          showSuccess(`Kategori silindi ve ${category.contact_count} kişi başka kategoriye taşındı`);
        } else {
          showSuccess('Kategori başarıyla silindi');
        }
        onCategoryDeleted();
        onHide();
        setSelectedTargetCategory('');
      } else {
        showError(response.message || 'Kategori silinirken hata oluştu');
      }
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
          <>
            <div className="alert alert-warning mb-3">
              <small>
                <i className="fas fa-exclamation-triangle me-1"></i>
                Bu kategoride {category.contact_count} kişi bulunmaktadır.
              </small>
            </div>
            
            <div className="mb-3 text-start">
              <Form.Label className="fw-bold text-dark">
                <i className="fas fa-arrow-right me-2"></i>
                Kişileri hangi kategoriye taşımak istiyorsunuz?
              </Form.Label>
              {loadingCategories ? (
                <div className="text-center py-2">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Kategoriler yükleniyor...</span>
                </div>
              ) : (
                <Form.Select
                  value={selectedTargetCategory}
                  onChange={(e) => setSelectedTargetCategory(e.target.value)}
                  disabled={loading}
                  className="mt-2"
                >
                  <option value="">Kategori seçin...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {cat.alt_kategori && `- ${cat.alt_kategori}`}
                    </option>
                  ))}
                </Form.Select>
              )}
            </div>
          </>
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
            disabled={loading || (category.contact_count > 0 && !selectedTargetCategory)}
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