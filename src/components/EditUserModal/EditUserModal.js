import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaUser, FaTimes, FaSave } from 'react-icons/fa';
import PagePermissions from '../PagePermissions/PagePermissions';
import './EditUserModal.css';

const EditUserModal = ({ show, onHide, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    department: '',
    address: '',
    bio: '',
    color: '#4E0DCC',
    permissions: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Permissions verisini güvenli bir şekilde array'e dönüştür
      let safePermissions = [];
      if (Array.isArray(user.permissions)) {
        safePermissions = user.permissions;
      } else if (typeof user.permissions === 'object' && user.permissions !== null) {
        safePermissions = Object.entries(user.permissions)
          .filter(([key, value]) => value === true)
          .map(([key]) => key);
      } else if (typeof user.permissions === 'string') {
        try {
          const parsed = JSON.parse(user.permissions);
          if (Array.isArray(parsed)) {
            safePermissions = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            safePermissions = Object.entries(parsed)
              .filter(([key, value]) => value === true)
              .map(([key]) => key);
          }
        } catch (e) {
          console.warn('EditUserModal: permissions parse edilemedi:', user.permissions);
        }
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        department: user.department || '',
        address: user.address || '',
        bio: user.bio || '',
        color: user.color || '#4E0DCC',
        permissions: safePermissions
      });
      setErrors({});
    }
  }, [user]);

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

  const handlePermissionsChange = (newPermissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad Soyad gereklidir';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (formData.phone && !/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz';
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
      const updatedUser = {
        ...user,
        ...formData
      };
      
      await onSave(updatedUser);
      onHide();
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ submit: 'Kullanıcı güncellenirken bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      department: '',
      address: '',
      bio: '',
      color: '#4E0DCC',
      permissions: []
    });
    setErrors({});
    onHide();
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" className="edit-user-modal">
      <div className="modal-header-custom">
        <div className="header-content">
          <div className="header-icon">
            <FaUser />
          </div>
          <h4 className="modal-title">Kullanıcı Düzenle</h4>
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
            <div className="form-row">
              <div className="form-group">
                <Form.Label>Ad Soyad *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  isInvalid={!!errors.name}
                  placeholder="Ad Soyad giriniz"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </div>

              <div className="form-group">
                <Form.Label>E-posta *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  isInvalid={!!errors.email}
                  placeholder="E-posta adresi giriniz"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <Form.Label>Telefon</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  isInvalid={!!errors.phone}
                  placeholder="Telefon numarası giriniz"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone}
                </Form.Control.Feedback>
              </div>

              <div className="form-group">
                <Form.Label>Departman</Form.Label>
                <Form.Control
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Departman giriniz"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <Form.Label>Rol</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Yönetici</option>
                  <option value="moderator">Moderatör</option>
                </Form.Select>
              </div>

              <div className="form-group">
                <Form.Label>Renk</Form.Label>
                <div className="color-input-container">
                  <Form.Control
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="color-input"
                  />
                  <span className="color-preview" style={{ backgroundColor: formData.color }}></span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <Form.Label>Adres</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Adres giriniz"
              />
            </div>

            <div className="form-group">
              <Form.Label>Biyografi</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Kısa biyografi giriniz"
              />
            </div>

            <PagePermissions
              selectedPermissions={formData.permissions}
              onChange={handlePermissionsChange}
              disabled={loading}
            />
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
              Güncelleniyor...
            </>
          ) : (
            <>
              <FaSave /> Güncelle
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default EditUserModal;