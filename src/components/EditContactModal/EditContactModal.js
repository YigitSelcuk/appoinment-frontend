import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { contactsService } from "../../services/contactsService";
import { fetchCategoriesWithStats } from "../../services/categoriesService";
import "./EditContactModal.css";

const EditContactModal = ({ show, onHide, contact, onContactUpdated }) => {
  const [formData, setFormData] = useState({
    tcNo: "",
    name: "",
    surname: "",
    title: "",
    category: "",
    neighborhood: "",
    phone1: "",
    phone2: "",
    email: "",
    gender: "ERKEK",
    avatar: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [tcCheckStatus, setTcCheckStatus] = useState({ checking: false, exists: false, message: "" });
  const [avatarLoading, setAvatarLoading] = useState(false);

  // TC Kimlik No doğrulama algoritması
  const validateTCKimlik = (tcNo) => {
    if (!tcNo || tcNo.length !== 11) return false;
    
    if (!/^\d+$/.test(tcNo)) return false;
    if (tcNo[0] === '0') return false;
    if (tcNo.split('').every(digit => digit === tcNo[0])) return false;
    
    const digits = tcNo.split('').map(Number);
    
    const sum10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
    if (sum10 % 10 !== digits[10]) return false;
    
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const checkDigit = (oddSum * 7 - evenSum) % 10;
    if (checkDigit !== digits[9]) return false;
    
    return true;
  };

  // TC Kimlik No formatla
  const formatTCKimlik = (value) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    return limited.split('').join(' ');
  };

  // Telefon numarası formatla
  const formatPhone = (value) => {
    let numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    
    if (numbers.length > 0 && !numbers.startsWith('0')) {
      numbers = '0' + numbers;
    }
    
    const limited = numbers.slice(0, 11);
    
    let formatted = '';
    
    if (limited.length >= 1) {
      formatted = limited[0];
      
      if (limited.length > 1) {
        formatted += ' (';
        formatted += limited.slice(1, 4);
        
        if (limited.length > 4) {
          formatted += ') ';
          formatted += limited.slice(4, 7);
          
          if (limited.length > 7) {
            formatted += ' ';
            formatted += limited.slice(7, 9);
            
            if (limited.length > 9) {
              formatted += ' ';
              formatted += limited.slice(9, 11);
            }
          }
        }
      }
    }
    
    return formatted;
  };

  // TC Kimlik No kontrolü
  const checkTCExists = async (tcNo) => {
    const cleanTcNo = tcNo.replace(/\s/g, '');
    
    if (cleanTcNo.length !== 11 || !validateTCKimlik(cleanTcNo)) {
      setTcCheckStatus({ checking: false, exists: false, message: "" });
      return;
    }

    // Mevcut kişinin TC'si ise kontrol etme
    if (contact && contact.tc_no === cleanTcNo) {
      setTcCheckStatus({ checking: false, exists: false, message: "" });
      return;
    }

    try {
      setTcCheckStatus({ checking: true, exists: false, message: "" });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contacts/check-tc/${cleanTcNo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTcCheckStatus({
          checking: false,
          exists: data.exists,
          message: data.message,
          contact: data.contact
        });
      }
    } catch (error) {
      console.error('TC kontrolü hatası:', error);
      setTcCheckStatus({ checking: false, exists: false, message: "" });
    }
  };

  // Kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchCategoriesWithStats(1, 100);
        if (response.success) {
          setAvailableCategories(response.data);
        }
      } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
      }
    };

    if (show) {
      loadCategories();
    }
  }, [show]);

  // Contact bilgilerini forma yükle
  useEffect(() => {
    if (show && contact) {
      setFormData({
        tcNo: contact.tc_no ? contact.tc_no.split('').join(' ') : "",
        name: contact.name || "",
        surname: contact.surname || "",
        title: contact.title || "",
        category: contact.category || "",
        neighborhood: contact.district || "",
        phone1: contact.phone1 ? formatPhone(contact.phone1) : "",
        phone2: contact.phone2 ? formatPhone(contact.phone2) : "",
        email: contact.email || "",
        gender: contact.gender || "ERKEK",
        avatar: null,
      });
      setAvatarPreview(contact.avatar || null);
      setError("");
      setShowCategoryDropdown(false);
      setCategorySearchTerm("");
      setTcCheckStatus({ checking: false, exists: false, message: "" });
    }
  }, [show, contact]);

  const handleInputChange = (field, value) => {
    if (field === 'tcNo') {
      const formatted = formatTCKimlik(value);
      setFormData((prev) => ({
        ...prev,
        [field]: formatted,
      }));
      
      if (formatted.replace(/\s/g, '').length === 11) {
        setTimeout(() => checkTCExists(formatted), 500);
      } else {
        setTcCheckStatus({ checking: false, exists: false, message: "" });
      }
    } else if (field === 'phone1' || field === 'phone2') {
      const formatted = formatPhone(value);
      setFormData((prev) => ({
        ...prev,
        [field]: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleGenderSelect = (gender) => {
    setFormData(prev => ({
      ...prev,
      gender: gender
    }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Resim boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError("Sadece resim dosyaları yüklenebilir");
        return;
      }

      try {
        setAvatarLoading(true);
        setError("");

        // Önce önizleme göster
        const reader = new FileReader();
        reader.onload = (e) => {
          setAvatarPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Backend'e yükle
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await contactsService.updateContactAvatar(contact.id, formData);

        if (response.success) {
          setFormData(prev => ({
            ...prev,
            avatar: file
          }));
          onContactUpdated(); // Kişi listesini güncelle
        }
      } catch (error) {
        setError(error.message || "Avatar yüklenirken hata oluştu");
        // Hata durumunda önizlemeyi geri al
        setAvatarPreview(contact?.avatar || null);
        const fileInput = document.getElementById('edit-avatar-input');
        if (fileInput) {
          fileInput.value = '';
        }
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarLoading(true);
      setError("");

      const formData = new FormData();
      formData.append('removeAvatar', 'true');

      const response = await contactsService.updateContactAvatar(contact.id, formData);

      if (response.success) {
        setAvatarPreview(null);
        setFormData(prev => ({
          ...prev,
          avatar: null
        }));
        const fileInput = document.getElementById('edit-avatar-input');
        if (fileInput) {
          fileInput.value = '';
        }
        onContactUpdated(); // Kişi listesini güncelle
      }
    } catch (error) {
      setError(error.message || "Avatar silinirken hata oluştu");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCategorySelect = (categoryName) => {
    setFormData(prev => ({
      ...prev,
      category: categoryName
    }));
    setShowCategoryDropdown(false);
    setCategorySearchTerm("");
  };

  const toggleCategoryDropdown = () => {
    setShowCategoryDropdown(!showCategoryDropdown);
    if (!showCategoryDropdown) {
      setCategorySearchTerm("");
    }
  };

  const handleCategorySearch = (searchValue) => {
    setCategorySearchTerm(searchValue);
  };

  // Kategorileri filtrele
  const filteredCategories = availableCategories.filter(category => {
    if (!categorySearchTerm) return true;
    
    const searchLower = categorySearchTerm.toLowerCase();
    return (
      category.alt_kategori.toLowerCase().includes(searchLower) ||
      category.name.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!formData.name || !formData.surname || !formData.phone1) {
        setError("Ad, soyad ve telefon alanları zorunludur");
        return;
      }

      // TC Kimlik No doğrulama
      if (formData.tcNo) {
        const cleanTcNo = formData.tcNo.replace(/\s/g, '');
        if (cleanTcNo.length > 0 && !validateTCKimlik(cleanTcNo)) {
          setError("Geçersiz TC Kimlik No");
          return;
        }
        
        if (tcCheckStatus.exists) {
          const confirmUpdate = window.confirm(`${tcCheckStatus.message}\n\nYine de güncellemek istiyor musunuz?`);
          if (!confirmUpdate) {
            return;
          }
        }
      }

      // Telefon numarası doğrulama
      const cleanPhone1 = formData.phone1.replace(/\D/g, '');
      if (cleanPhone1.length !== 11 || !cleanPhone1.startsWith('0')) {
        setError("Telefon numarası 11 haneli olmalı ve 0 ile başlamalıdır");
        return;
      }

      if (formData.phone2) {
        const cleanPhone2 = formData.phone2.replace(/\D/g, '');
        if (cleanPhone2.length > 0 && (cleanPhone2.length !== 11 || !cleanPhone2.startsWith('0'))) {
          setError("İkinci telefon numarası 11 haneli olmalı ve 0 ile başlamalıdır");
          return;
        }
      }

      const updateData = {
        name: formData.name,
        surname: formData.surname,
        phone1: formData.phone1.replace(/\D/g, ''),
        phone2: formData.phone2 ? formData.phone2.replace(/\D/g, '') : '',
        email: formData.email || '',
        title: formData.title || '',
        category: formData.category || 'GENEL',
        district: formData.neighborhood || '',
        tc_no: formData.tcNo ? formData.tcNo.replace(/\s/g, '') : '',
        gender: formData.gender,
      };

      const response = await contactsService.updateContact(contact.id, updateData);

      if (response.success) {
        onContactUpdated();
        onHide();
      }
    } catch (error) {
      setError(error.message || "Kişi güncellenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const renderGenderSelector = () => (
    <div className="gender-selector">
      <div className="gender-toggle-container">
        <span className={`gender-label ${formData.gender === "ERKEK" ? "active" : ""}`}>
          ERKEK
        </span>
        <button
          type="button"
          className={`toggle-switch ${formData.gender === "KADIN" ? "active" : ""}`}
          onClick={() => handleGenderSelect(formData.gender === "ERKEK" ? "KADIN" : "ERKEK")}
        />
        <span className={`gender-label ${formData.gender === "KADIN" ? "active female" : ""}`}>
          KADIN
        </span>
      </div>
    </div>
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="edit-contact-modal"
    >
      <Modal.Header className="modal-header-custom">
        <div className="header-content">
          <Modal.Title>KİŞİ DÜZENLE</Modal.Title>
        </div>
        <Button variant="link" onClick={onHide} className="close-btn">
          <i className="fas fa-times"></i>
        </Button>
      </Modal.Header>

      <Modal.Body>
        {renderGenderSelector()}
        
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="form-content">
          {/* TC Kimlik No */}
          <Row className="mb-3">
            <Col>
              <Form.Label>TC KİMLİK NO</Form.Label>
              <div className="tc-input-container">
                <Form.Control
                  type="text"
                  placeholder="- - - - - - - - - - -"
                  value={formData.tcNo || ""}
                  onChange={(e) => handleInputChange("tcNo", e.target.value)}
                  className={`tc-input ${
                    formData.tcNo && formData.tcNo.replace(/\s/g, '').length === 11
                      ? validateTCKimlik(formData.tcNo.replace(/\s/g, ''))
                        ? tcCheckStatus.exists ? 'warning' : 'valid'
                        : 'invalid'
                      : ''
                  }`}
                  maxLength="21"
                />
                <div className="tc-status-container">
                  {tcCheckStatus.checking && (
                    <div className="tc-checking">
                      <div className="spinner-border spinner-border-sm text-primary me-2" />
                      <span>Kontrol ediliyor...</span>
                    </div>
                  )}
                  
                  {formData.tcNo && formData.tcNo.replace(/\s/g, '').length === 11 && !tcCheckStatus.checking && (
                    <div className="tc-validation-result">
                      {validateTCKimlik(formData.tcNo.replace(/\s/g, '')) ? (
                        tcCheckStatus.exists ? (
                          <div className="tc-warning">
                            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                            <span className="text-warning">{tcCheckStatus.message}</span>
                          </div>
                        ) : (
                          <div className="tc-success">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span className="text-success">TC Kimlik No kullanılabilir</span>
                          </div>
                        )
                      ) : (
                        <div className="tc-error">
                          <i className="fas fa-times-circle text-danger me-2"></i>
                          <span className="text-danger">Geçersiz TC Kimlik No</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Ad Soyad */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>ADI *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label>SOYADI *</Form.Label>
              <Form.Control
                type="text"
                value={formData.surname || ""}
                onChange={(e) => handleInputChange("surname", e.target.value)}
                required
              />
            </Col>
          </Row>

          {/* Ünvan */}
          <Row className="mb-3">
            <Col>
              <Form.Label>ÜNVANI</Form.Label>
              <Form.Control
                type="text"
                value={formData.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </Col>
          </Row>

          {/* Kategori */}
          <Row className="mb-3">
            <Col>
              <Form.Label>GRUP</Form.Label>
              <div className="group-container">
                <div className="group-select-box">
                  <span className="group-selected-text">
                    {formData.category || "Kategori seçiniz"}
                  </span>
                  <div className="group-actions">
                    <button 
                      type="button" 
                      className="group-dropdown-btn"
                      onClick={toggleCategoryDropdown}
                    >
                      <i className={`fas fa-caret-${showCategoryDropdown ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                </div>
                
                {showCategoryDropdown && (
                  <div className="category-dropdown">
                    <div className="category-search">
                      <input
                        type="text"
                        placeholder="Kategori ara..."
                        value={categorySearchTerm || ""}
                        onChange={(e) => handleCategorySearch(e.target.value)}
                        className="category-search-input"
                        autoFocus
                      />
                      <i className="fas fa-search category-search-icon"></i>
                    </div>
                    
                    <div className="category-list">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <div
                            key={category.id}
                            className={`category-option ${formData.category === category.alt_kategori ? 'selected' : ''}`}
                            onClick={() => handleCategorySelect(category.alt_kategori)}
                          >
                            <span className="category-name">{category.alt_kategori}</span>
                            <span className="category-main">({category.name})</span>
                            <span className="category-count">{category.kisiSayisi} kişi</span>
                          </div>
                        ))
                      ) : (
                        <div className="category-option disabled">
                          {categorySearchTerm ? 'Arama sonucu bulunamadı' : 'Kategori bulunamadı'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* Mahalle */}
          <Row className="mb-3">
            <Col>
              <Form.Label>MAHALLE</Form.Label>
              <Form.Control
                type="text"
                value={formData.neighborhood || ""}
                onChange={(e) => handleInputChange("neighborhood", e.target.value)}
              />
            </Col>
          </Row>

          {/* Telefonlar */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>TELEFON 1 *</Form.Label>
              <Form.Control
                type="tel"
                placeholder="0 (5XX) XXX XX XX"
                value={formData.phone1 || ""}
                onChange={(e) => handleInputChange("phone1", e.target.value)}
                required
                className={
                  formData.phone1 && formData.phone1.replace(/\D/g, '').length > 0
                    ? formData.phone1.replace(/\D/g, '').length === 11 && formData.phone1.replace(/\D/g, '').startsWith('0')
                      ? 'is-valid'
                      : 'is-invalid'
                    : ''
                }
              />
            </Col>
            <Col md={6}>
              <Form.Label>TELEFON 2</Form.Label>
              <Form.Control
                type="tel"
                placeholder="0 (5XX) XXX XX XX"
                value={formData.phone2 || ""}
                onChange={(e) => handleInputChange("phone2", e.target.value)}
                className={
                  formData.phone2 && formData.phone2.replace(/\D/g, '').length > 0
                    ? formData.phone2.replace(/\D/g, '').length === 11 && formData.phone2.replace(/\D/g, '').startsWith('0')
                      ? 'is-valid'
                      : 'is-invalid'
                    : ''
                }
              />
            </Col>
          </Row>

          {/* E-mail */}
          <Row className="mb-3">
            <Col>
              <Form.Label>E-MAİL</Form.Label>
              <Form.Control
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </Col>
          </Row>

          {/* Profil Resmi */}
          <Row className="mb-3">
            <Col>
              <Form.Label>PROFİL RESMİ</Form.Label>
              <div className="avatar-upload-container">
                {avatarPreview ? (
                  <div className="avatar-preview">
                    <img 
                      src={avatarPreview} 
                      alt="Profil Önizleme" 
                      className="avatar-preview-image"
                    />
                    <div className="avatar-actions">
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={handleRemoveAvatar}
                        disabled={avatarLoading}
                        className="remove-avatar-btn"
                      >
                        {avatarLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Siliniyor...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-trash"></i> Kaldır
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="avatar-upload-area">
                    <input
                      type="file"
                      id="edit-avatar-input"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={avatarLoading}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="edit-avatar-input" className={`avatar-upload-label ${avatarLoading ? 'disabled' : ''}`}>
                      <div className="upload-icon">
                        {avatarLoading ? (
                          <div className="spinner-border text-primary" />
                        ) : (
                          <i className="fas fa-camera fa-2x"></i>
                        )}
                      </div>
                      <div className="upload-text">
                        <p className="mb-1">
                          {avatarLoading ? 'Yükleniyor...' : 'Profil resmi yükle'}
                        </p>
                        <small className="text-muted">JPG, PNG veya GIF (Max 5MB)</small>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </Modal.Body>

      <Modal.Footer className="modal-footer-custom">
        <div className="footer-buttons">
          <Button 
            variant="warning" 
            onClick={onHide}
            disabled={loading}
            className="cancel-btn"
          >
            İPTAL ET
          </Button>
          
          <Button 
            variant="success" 
            onClick={handleSubmit}
            disabled={loading}
            className="save-btn"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Güncelleniyor...
              </>
            ) : (
              "GÜNCELLE"
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditContactModal;