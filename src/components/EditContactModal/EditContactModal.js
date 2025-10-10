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

  const handleAvatarChange = (e) => {
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

      setFormData(prev => ({
        ...prev,
        avatar: file
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: null
    }));
    setAvatarPreview(contact?.avatar || null);
    const fileInput = document.getElementById('edit-avatar-input');
    if (fileInput) {
      fileInput.value = '';
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
          <div className="header-icon">
            <svg width="53" height="57" viewBox="0 0 53 57" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M52.1057 46.0192H46.7151V40.6285C46.7151 40.3321 46.4725 40.0895 46.1761 40.0895H42.9417C42.6452 40.0895 42.4026 40.3321 42.4026 40.6285V46.0192H37.012C36.7155 46.0192 36.4729 46.2617 36.4729 46.5582V49.7926C36.4729 50.0891 36.7155 50.3317 37.012 50.3317H42.4026V55.7223C42.4026 56.0188 42.6452 56.2614 42.9417 56.2614H46.1761C46.4725 56.2614 46.7151 56.0188 46.7151 55.7223V50.3317H52.1057C52.4022 50.3317 52.6448 50.0891 52.6448 49.7926V46.5582C52.6448 46.2617 52.4022 46.0192 52.1057 46.0192ZM17.1677 27.5832C17.1071 26.997 17.0734 26.404 17.0734 25.8043C17.0734 24.7329 17.1745 23.6885 17.3632 22.671C17.4103 22.4284 17.2823 22.1791 17.0599 22.078C16.1435 21.667 15.3012 21.101 14.5735 20.3867C13.716 19.5553 13.0412 18.5542 12.5922 17.4474C12.1432 16.3406 11.9299 15.1523 11.9658 13.9584C12.0264 11.7954 12.8957 9.74025 14.4118 8.19045C16.0761 6.48566 18.3133 5.55578 20.6919 5.58273C22.8414 5.60295 24.9168 6.43176 26.4868 7.9007C27.0191 8.39934 27.4773 8.95187 27.8614 9.54484C27.9962 9.75373 28.259 9.84133 28.4881 9.76047C29.674 9.34943 30.9273 9.05969 32.2143 8.92492C32.5917 8.88449 32.8073 8.48019 32.6388 8.14328C30.4489 3.81056 25.9747 0.818769 20.7997 0.737909C13.3337 0.623358 7.10749 6.74846 7.10749 14.2145C7.10749 18.4461 9.05486 22.2196 12.1073 24.6925C9.96452 25.683 7.99021 27.0509 6.27868 28.7624C2.58611 32.4483 0.497239 37.3133 0.362473 42.5085C0.360675 42.5804 0.373289 42.652 0.399574 42.719C0.425858 42.7859 0.465279 42.8469 0.515516 42.8984C0.565753 42.9499 0.625788 42.9908 0.692085 43.0188C0.758381 43.0467 0.829597 43.0611 0.901536 43.0611H4.68171C4.97146 43.0611 5.21404 42.832 5.22077 42.5422C5.3488 38.634 6.9323 34.9751 9.71521 32.1989C11.6963 30.2179 14.122 28.8433 16.7702 28.1762C17.0262 28.1021 17.2014 27.8528 17.1677 27.5832ZM47.5237 25.8043C47.5237 18.4326 41.6008 12.4423 34.256 12.3278C26.79 12.2132 20.5706 18.3383 20.5706 25.8043C20.5706 30.036 22.5247 33.8094 25.5704 36.2823C23.4054 37.2859 21.4346 38.6637 19.7485 40.3523C16.0559 44.0381 13.9671 48.9031 13.8323 54.0916C13.8305 54.1635 13.8431 54.2351 13.8694 54.3021C13.8957 54.369 13.9351 54.43 13.9853 54.4815C14.0356 54.533 14.0956 54.574 14.1619 54.6019C14.2282 54.6298 14.2994 54.6442 14.3714 54.6442H18.1448C18.4345 54.6442 18.6771 54.4151 18.6839 54.1253C18.8119 50.2171 20.3954 46.5582 23.1783 43.7821C26.0825 40.8779 29.9368 39.2809 34.0471 39.2809C41.4862 39.2809 47.5237 33.2501 47.5237 25.8043ZM40.1453 31.9025C38.5146 33.5331 36.3516 34.4293 34.0471 34.4293C31.7427 34.4293 29.5797 33.5331 27.949 31.9025C27.1353 31.093 26.4923 30.1284 26.0583 29.0658C25.6242 28.0033 25.4079 26.8644 25.4221 25.7167C25.4424 23.5066 26.3251 21.3705 27.8681 19.787C29.4853 18.1294 31.6483 17.2063 33.9595 17.1793C36.2438 17.1591 38.4607 18.0486 40.0914 19.6455C41.7625 21.2829 42.6789 23.4729 42.6789 25.8043C42.6721 28.1088 41.776 30.2718 40.1453 31.9025Z" fill="#6D26F6"/>
            </svg>
          </div>
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
                        className="remove-avatar-btn"
                      >
                        <i className="fas fa-trash"></i> Kaldır
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
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="edit-avatar-input" className="avatar-upload-label">
                      <div className="upload-icon">
                        <i className="fas fa-camera fa-2x"></i>
                      </div>
                      <div className="upload-text">
                        <p className="mb-1">Profil resmi yükle</p>
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