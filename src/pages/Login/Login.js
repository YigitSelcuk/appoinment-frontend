import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useSimpleToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    console.log('🔥 INPUT DEBUG: handleChange çalıştı!', {
      name: e.target.name,
      value: e.target.value,
      timestamp: new Date().toISOString()
    });
    
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validation error'ı temizle
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  // Debug için input focus ve click event'lerini ekle
  const handleInputFocus = (e) => {
    console.log('🎯 INPUT FOCUS DEBUG:', {
      name: e.target.name,
      value: e.target.value,
      timestamp: new Date().toISOString()
    });
  };

  const handleInputClick = (e) => {
    console.log('👆 INPUT CLICK DEBUG:', {
      name: e.target.name,
      value: e.target.value,
      timestamp: new Date().toISOString()
    });
  };

  // Frontend validation
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Geçerli bir email adresi giriniz';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Şifre gereklidir';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!validateForm()) {
      addToast('Lütfen tüm alanları doğru şekilde doldurunuz', 'error');
      return;
    }
    
    setLoading(true);
    setValidationErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        addToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
        // AuthContext otomatik olarak yönlendirme yapacak
        navigate('/dashboard');
      } else {
        if (result.validationErrors) {
          // Backend validation errors
          const backendErrors = {};
          result.validationErrors.forEach(err => {
            backendErrors[err.field] = err.message;
          });
          setValidationErrors(backendErrors);
          addToast('Giriş bilgilerinizi kontrol ediniz', 'error');
        } else {
          addToast(result.error || 'Giriş yapılırken bir hata oluştu', 'error');
        }
      }
    } catch (error) {
      addToast('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <img  src="/assets/images/background-image.png" alt="Background" className="background-image" />
        <div className="background-overlay"></div>
      </div>
      
      <div className="login-content">
        <div className="login-left">
          <div className="login-form-container">
            <div className="login-header">
              <img src="/assets/images/logo.png" alt="Logo" className="logo-icon" />
              <h1 className="login-title">RANDEVU YÖNETİM SİSTEMİ</h1>
            </div>

            <div className="divider"></div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">KULLANICI</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onClick={handleInputClick}
                  className={`form-input ${validationErrors.email ? 'error' : ''}`}
                  placeholder="ornek@belediye.gov.tr"
                  required
                />
                {validationErrors.email && (
                  <span className="field-error">{validationErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">ŞİFRE</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onClick={handleInputClick}
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Güvenli şifrenizi giriniz"
                  required
                />
                {validationErrors.password && (
                  <span className="field-error">{validationErrors.password}</span>
                )}
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ'}
              </button>
            </form>
          </div>
        </div>

        <div className="login-right">
          <div className="background-section">
            <img src="/assets/images/background-image.png" alt="Background" className="background-image-right" />
            <div className="background-overlay-right"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;