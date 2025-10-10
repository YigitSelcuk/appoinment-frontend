import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { updateCategory } from '../../services/categoriesService';
import './EditCategoryModal.css';

const EditCategoryModal = ({ show, onHide, category, onCategoryUpdated }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [formData, setFormData] = useState({
    name: '',
    alt_kategori: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        alt_kategori: category.alt_kategori || '',
        description: category.description || ''
      });
    }
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim() || !formData.alt_kategori.trim()) {
      setError('Ana Kategori ve Alt Kategori alanları zorunludur.');
      showError('Ana Kategori ve Alt Kategori alanları zorunludur.');
      setLoading(false);
      return;
    }

    try {
      const result = await updateCategory(category.id, formData);
      
      if (result.success) {
        showSuccess('Kategori başarıyla güncellendi!');
        onCategoryUpdated();
        onHide();
        setFormData({ name: '', alt_kategori: '', description: '' });
      } else {
        setError(result.message || 'Kategori güncellenirken hata oluştu.');
        showError(result.message || 'Kategori güncellenirken hata oluştu.');
      }
    } catch (error) {
      console.error('Kategori güncelleme hatası:', error);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      showError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', alt_kategori: '', description: '' });
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Kategori Düzenle
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label">
                  Ana Kategori <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ana kategori adını girin"
                  className="category-input"
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label">
                  Alt Kategori <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="alt_kategori"
                  value={formData.alt_kategori}
                  onChange={handleInputChange}
                  placeholder="Alt kategori adını girin"
                  className="category-input"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label">Açıklama</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Kategori açıklaması (isteğe bağlı)"
                  className="category-input"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            <i className="fas fa-times me-2"></i>
            İptal
          </Button>
          <Button variant="warning" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Güncelleniyor...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Güncelle
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditCategoryModal;