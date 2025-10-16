import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaUserPlus, FaTimes, FaSave, FaPlus } from 'react-icons/fa';
import PagePermissions from '../PagePermissions/PagePermissions';
import { getDepartmentOptions } from '../../services/departmentsService';
import { checkEmailExists } from '../../services/usersService';
import AddDepartmentModal from '../AddDepartmentModal/AddDepartmentModal';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './AddUserModal.css';

const AddUserModal = ({ show, onHide, onSave }) => {
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  const { accessToken } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);

  // Departmanları yükle
  useEffect(() => {
    if (show) {
      loadDepartments();
    }
  }, [show]);

  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const departmentOptions = await getDepartmentOptions();
      setDepartments(departmentOptions);
    } catch (error) {
      console.error('Departmanlar yüklenirken hata:', error);
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

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

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (formData.phone && !/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmailExists = async (email) => {
    try {
      const result = await checkEmailExists(email, accessToken);
      return result.exists;
    } catch (error) {
      console.error('E-posta kontrolü sırasında hata:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // E-posta kontrolü yap
      const emailExists = await validateEmailExists(formData.email);
      if (emailExists) {
        showError('Bu e-posta adresi zaten sistemde kayıtlı!');
        setLoading(false);
        return;
      }

      const newUser = {
        ...formData,
        permissions: [],
        created_at: new Date().toISOString()
      };
      
      // Remove confirmPassword before sending
      delete newUser.confirmPassword;
      
      await onSave(newUser);
      handleClose();
    } catch (error) {
      console.error('Error creating user:', error);
      
      // E-posta zaten var hatası kontrolü
      if (error.response?.status === 409 || 
          error.response?.data?.message?.includes('email') || 
          error.response?.data?.message?.includes('kayıtlı') ||
          error.message?.includes('email') || 
          error.message?.includes('duplicate')) {
        showError('Bu e-posta adresi zaten sistemde kayıtlı!');
      } else {
        showError(error.response?.data?.message || 'Kullanıcı oluşturulurken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
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

  // Yeni departman eklendikten sonra dropdown'ı güncelle
  const handleDepartmentAdded = (newDepartment) => {
    // Departmanları yeniden yükle
    loadDepartments();
    
    // Yeni eklenen departmanı seç
    setFormData(prev => ({
      ...prev,
      department: newDepartment.id
    }));
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" className="add-user-modal">
      <div className="modal-header-custom">
        <div className="header-content">
          
          <h4 className="modal-title">Yeni Kullanıcı Ekle</h4>
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

          <div className="user-form-content">
            <div className="user-form-row">
              <div className="user-form-group">
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

              <div className="user-form-group">
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

            <div className="user-form-row">
              <div className="user-form-group">
                <Form.Label>Şifre *</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  isInvalid={!!errors.password}
                  placeholder="Şifre giriniz"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              </div>

              <div className="user-form-group">
                <Form.Label>Şifre Tekrarı *</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  isInvalid={!!errors.confirmPassword}
                  placeholder="Şifreyi tekrar giriniz"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword}
                </Form.Control.Feedback>
              </div>
            </div>

            <div className="user-form-row">
              <div className="user-form-group">
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

              <div className="user-form-group">
                 <Form.Label>Departman</Form.Label>
                 <div className="department-input-container">
                   <div className="department-select-wrapper">
                     <Form.Select
                       name="department"
                       value={formData.department}
                       onChange={handleInputChange}
                       disabled={departmentsLoading}
                     >
                       <option value="">
                         {departmentsLoading ? 'Departmanlar yükleniyor...' : 'Departman seçiniz'}
                       </option>
                       {departments.map((dept) => (
                         <option key={dept.value} value={dept.value}>
                           {dept.label}
                         </option>
                       ))}
                     </Form.Select>
                   </div>
                   <button
                     type="button"
                     className="add-department-btn"
                     onClick={() => setShowAddDepartmentModal(true)}
                     disabled={departmentsLoading}
                     title="Yeni Departman Ekle"
                   >
                     <FaPlus />
                   </button>
                 </div>
               </div>
            </div>

            <div className="user-form-row">
              <div className="user-form-group">
                <Form.Label>Rol</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Yönetici</option>
                </Form.Select>
              </div>

              <div className="user-form-group">
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

            <div className="user-form-group">
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

            <div className="user-form-group">
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
              Ekleniyor...
            </>
          ) : (
            <>
              <FaSave /> Kullanıcı Ekle
            </>
          )}
        </Button>
      </div>

      <AddDepartmentModal
        show={showAddDepartmentModal}
        onHide={() => setShowAddDepartmentModal(false)}
        onSave={handleDepartmentAdded}
      />
    </Modal>
  );
};

export default AddUserModal;