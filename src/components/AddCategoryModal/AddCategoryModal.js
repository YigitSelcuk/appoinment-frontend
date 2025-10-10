import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import './AddCategoryModal.css';

const AddCategoryModal = ({ show, onHide, onCategoryAdded }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [formData, setFormData] = useState({
    name: '',
    alt_kategori: '',
    description: '',
    color: '#4E0DCC'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Ana kategori adı zorunludur');
      return;
    }

    if (!formData.alt_kategori.trim()) {
      setError('Alt kategori adı zorunludur');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contacts/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Form'u temizle
        setFormData({
          name: '',
          alt_kategori: '',
          description: '',
          color: '#4E0DCC'
        });
        
        // Başarılı mesajı göster
        showSuccess('Kategori başarıyla eklendi!');
        
        // Modalı kapat ve parent component'i bilgilendir
        onHide();
        if (onCategoryAdded) {
          onCategoryAdded();
        }
      } else {
        setError(data.message || 'Kategori eklenirken hata oluştu');
        showError(data.message || 'Kategori eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Kategori ekleme hatası:', error);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      showError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      alt_kategori: '',
      description: '',
      color: '#4E0DCC'
    });
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Yeni Kategori Ekle
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Ana Kategori *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Örn: İSTANBUL, ANKARA, ADIYAMAN"
                  required
                  className="category-input"
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Alt Kategori *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="alt_kategori"
                  value={formData.alt_kategori}
                  onChange={handleInputChange}
                  placeholder="Örn: MUHTARLAR, BELEDİYE PERSONELİ"
                  required
                  className="category-input"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Açıklama
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Kategori hakkında kısa açıklama..."
                  className="category-input"
                />
              </Form.Group>
            </Col>
          </Row>

       
        </Modal.Body>
        
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                Ekleniyor...
              </>
            ) : (
              "Kategori Ekle"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddCategoryModal;