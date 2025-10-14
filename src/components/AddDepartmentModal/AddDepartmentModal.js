import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaBuilding, FaTimes, FaSave } from 'react-icons/fa';
import { createDepartment } from '../../services/departmentsService';
import './AddDepartmentModal.css';

const AddDepartmentModal = ({ show, onHide, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Departman adı gereklidir';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Departman adı en az 2 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const newDepartment = {
        name: formData.name.trim().toUpperCase(),
        description: formData.description.trim(),
        is_active: true
      };
      
      const createdDepartment = await createDepartment(newDepartment);
      
      // Parent component'e yeni departmanı bildir
      if (onSave) {
        onSave(createdDepartment);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error creating department:', error);
      if (error.response?.status === 409) {
        setErrors({ name: 'Bu departman adı zaten mevcut' });
      } else {
        setErrors({ submit: 'Departman oluşturulurken bir hata oluştu' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: ''
    });
    setErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="md" className="add-department-modal">
      <div className="modal-header-custom">
        <div className="header-content">
          <div className="header-icon">
            <FaBuilding />
          </div>
          <h4 className="modal-title">Yeni Departman Ekle</h4>
        </div>
        <button className="close-btn" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>

      <div className="modal-body">
        <Form onSubmit={handleSubmit}>
          {errors.submit && (
            <Alert variant="danger" className="mb-3">
              {errors.submit}
            </Alert>
          )}

          <div className="form-content">
            <div className="form-group">
              <Form.Label>Departman Adı *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                isInvalid={!!errors.name}
                placeholder="Departman adını giriniz"
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </div>

            <div className="form-group">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Departman açıklaması (isteğe bağlı)"
              />
            </div>
          </div>
        </Form>
      </div>

      <div className="modal-footer-custom">
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          <FaTimes /> İptal
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={loading}
          className="save-button"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Ekleniyor...
            </>
          ) : (
            <>
              <FaSave /> Departman Ekle
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default AddDepartmentModal;