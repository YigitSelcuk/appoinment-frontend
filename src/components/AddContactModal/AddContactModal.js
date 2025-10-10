import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { contactsService } from "../../services/contactsService";
import { fetchCategoriesWithStats } from "../../services/categoriesService";
import { ilceler, getMahalleler } from "../../data/istanbulData";
import "./AddContactModal.css";

const AddContactModal = ({ show, onHide, onContactAdded, categories = [] }) => {
    const [formData, setFormData] = useState({
    tcNo: "",
    name: "",
    surname: "",
    title: "",
    category: "",
    district: "", // İlçe
    neighborhood: "", // Mahalle
    phone1: "",
    phone2: "",
    email: "",
    gender: "ERKEK", // Varsayılan olarak erkek seçili
    avatar: null, // Profil resmi
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [tcCheckStatus, setTcCheckStatus] = useState({ checking: false, exists: false, message: "" });
  const [availableMahalleler, setAvailableMahalleler] = useState([]);

  // Kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchCategoriesWithStats(1, 100); // Tüm kategorileri getir
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

  // Modal açıldığında formu sıfırla
  useEffect(() => {
    if (show) {
      setFormData({
        tcNo: "",
        name: "",
        surname: "",
        title: "",
        category: "", // Boş olarak başlasın
        district: "",
        neighborhood: "",
        phone1: "",
        phone2: "",
        email: "",
        gender: "ERKEK",
        avatar: null,
      });
      setError("");
      setShowCategoryDropdown(false);
      setCategorySearchTerm("");
      setAvatarPreview(null);
      setTcCheckStatus({ checking: false, exists: false, message: "" });
      setAvailableMahalleler([]);
    }
  }, [show, availableCategories]);

  // TC Kimlik No doğrulama algoritması
  const validateTCKimlik = (tcNo) => {
    if (!tcNo || tcNo.length !== 11) return false;
    
    // Sadece rakam kontrolü
    if (!/^\d+$/.test(tcNo)) return false;
    
    // İlk rakam 0 olamaz
    if (tcNo[0] === '0') return false;
    
    // Tüm rakamlar aynı olamaz
    if (tcNo.split('').every(digit => digit === tcNo[0])) return false;
    
    const digits = tcNo.split('').map(Number);
    
    // İlk 10 rakamın toplamının mod 10'u, 11. rakama eşit olmalı
    const sum10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
    if (sum10 % 10 !== digits[10]) return false;
    
    // 1,3,5,7,9. rakamların toplamının 7 katı ile 2,4,6,8. rakamların toplamının farkının mod 10'u, 10. rakama eşit olmalı
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const checkDigit = (oddSum * 7 - evenSum) % 10;
    if (checkDigit !== digits[9]) return false;
    
    return true;
  };

  // TC Kimlik No formatla (- - - - - - - - - - -)
  const formatTCKimlik = (value) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    
    // 11 rakamla sınırla
    const limited = numbers.slice(0, 11);
    
    // Her rakam arasına boşluk ekle
    return limited.split('').join(' ');
  };

  // Telefon numarası formatla 0 (5XX) XXX XX XX
  const formatPhone = (value) => {
    // Sadece rakamları al
    let numbers = value.replace(/\D/g, '');
    
    // Eğer boşsa boş döndür
    if (numbers.length === 0) return '';
    
    // Eğer 0 ile başlamıyorsa ve rakam varsa başa 0 ekle
    if (numbers.length > 0 && !numbers.startsWith('0')) {
      numbers = '0' + numbers;
    }
    
    // 11 rakamla sınırla (0 ile başlayan Türk telefon numarası)
    const limited = numbers.slice(0, 11);
    
    // Formatla: 0 (5XX) XXX XX XX
    let formatted = '';
    
    if (limited.length >= 1) {
      formatted = limited[0]; // 0
      
      if (limited.length > 1) {
        formatted += ' (';
        formatted += limited.slice(1, 4); // 5XX kısmı
        
        if (limited.length > 4) {
          formatted += ') ';
          formatted += limited.slice(4, 7); // XXX kısmı
          
          if (limited.length > 7) {
            formatted += ' ';
            formatted += limited.slice(7, 9); // XX kısmı
            
            if (limited.length > 9) {
              formatted += ' ';
              formatted += limited.slice(9, 11); // XX kısmı
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

  const handleInputChange = (field, value) => {
    if (field === 'tcNo') {
      const formatted = formatTCKimlik(value);
      setFormData((prev) => ({
        ...prev,
        [field]: formatted,
      }));
      
      // TC kontrolü yap (debounce ile)
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
    } else if (field === 'district') {
      // İlçe seçildiğinde mahalle listesini güncelle
      const mahalleler = getMahalleler(value);
      setAvailableMahalleler(mahalleler);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        neighborhood: "", // İlçe değiştiğinde mahalle seçimini sıfırla
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

  // Resim yükleme fonksiyonu
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Resim boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        setError("Sadece resim dosyaları yüklenebilir");
        return;
      }

      setFormData(prev => ({
        ...prev,
        avatar: file
      }));

      // Önizleme için FileReader kullan
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Resmi kaldır
  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: null
    }));
    setAvatarPreview(null);
    // File input'u sıfırla
    const fileInput = document.getElementById('avatar-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleCategoryNavigation = () => {
    // Kategori sayfasına yönlendirme
    window.location.href = '/categories';
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

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.group-container')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      // Zorunlu alanları kontrol et
      if (!formData.name || !formData.surname || !formData.phone1) {
        setError("Ad, soyad ve telefon alanları zorunludur");
        return;
      }

      // TC Kimlik No doğrulama
      if (formData.tcNo) {
        const cleanTcNo = formData.tcNo.replace(/\s/g, ''); // Boşlukları temizle
        if (cleanTcNo.length > 0 && !validateTCKimlik(cleanTcNo)) {
          setError("Geçersiz TC Kimlik No");
          return;
        }
        
        // TC zaten kullanılıyorsa uyar
        if (tcCheckStatus.exists) {
          const confirmAdd = window.confirm(`${tcCheckStatus.message}\n\nYine de eklemek istiyor musunuz?`);
          if (!confirmAdd) {
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

      // FormData kullanarak resim ile birlikte gönder
      const contactFormData = new FormData();
      contactFormData.append('name', formData.name);
      contactFormData.append('surname', formData.surname);
      contactFormData.append('phone1', formData.phone1.replace(/\D/g, ''));
      contactFormData.append('phone2', formData.phone2 ? formData.phone2.replace(/\D/g, '') : '');
      contactFormData.append('email', formData.email || '');
      contactFormData.append('title', formData.title || '');
      contactFormData.append('category', formData.category || 'GENEL');
      contactFormData.append('district', formData.district || '');
      contactFormData.append('neighborhood', formData.neighborhood || '');
      contactFormData.append('tc_no', formData.tcNo ? formData.tcNo.replace(/\s/g, '') : '');
      contactFormData.append('gender', formData.gender);
      
      // Resim varsa ekle
      if (formData.avatar) {
        contactFormData.append('avatar', formData.avatar);
      }

      const response = await contactsService.createContactWithAvatar(contactFormData);

      if (response.success) {
        onContactAdded();
        onHide();
      }
    } catch (error) {
      setError(error.message || "Kişi eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onHide();
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

    const renderFormContent = () => (
    <div className="form-content">
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
              maxLength="21" // 11 rakam + 10 boşluk
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

      <Row className="mb-3">
        <Col>
          <Form.Label>ÜNVANI</Form.Label>
          <Form.Control
            type="text"
            placeholder="ERZURUM DERNEKLER FEDERASYONU BAŞKANI"
            value={formData.title || ""}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Form.Label>GRUP</Form.Label>
          <div className="group-container">
            <div className="group-select-box" onClick={toggleCategoryDropdown}>
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
                <div className="group-divider"></div>
                <button 
                  type="button" 
                  className="group-category-btn"
                  onClick={() => handleCategoryNavigation()}
                  title="Kategori sayfasına git"
                >
                  <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_160_11460)">
                      <path d="M4.99982 2.625C4.40943 2.62408 3.83777 2.84258 3.3861 3.24181C2.93443 3.64104 2.6319 4.19523 2.53208 4.80622C2.43227 5.41722 2.54162 6.04559 2.84077 6.58004C3.13991 7.11449 3.60955 7.52054 4.16649 7.72625V14.875C4.16649 15.5712 4.42988 16.2389 4.89872 16.7312C5.36756 17.2234 6.00345 17.5 6.66649 17.5H12.6415C12.8381 18.0841 13.225 18.5763 13.7338 18.8898C14.2427 19.2033 14.8407 19.3178 15.4221 19.2131C16.0036 19.1084 16.5311 18.7912 16.9114 18.3176C17.2917 17.844 17.5002 17.2445 17.5002 16.625C17.5002 16.0055 17.2917 15.406 16.9114 14.9324C16.5311 14.4588 16.0036 14.1416 15.4221 14.0369C14.8407 13.9322 14.2427 14.0467 13.7338 14.3602C13.225 14.6737 12.8381 15.1659 12.6415 15.75H6.66649C6.44548 15.75 6.23352 15.6578 6.07723 15.4937C5.92095 15.3296 5.83316 15.1071 5.83316 14.875V11.375H12.6415C12.8381 11.9591 13.225 12.4513 13.7338 12.7648C14.2427 13.0783 14.8407 13.1928 15.4221 13.0881C16.0036 12.9834 16.5311 12.6662 16.9114 12.1926C17.2917 11.719 17.5002 11.1195 17.5002 10.5C17.5002 9.88054 17.2917 9.28103 16.9114 8.80743C16.5311 8.33383 16.0036 8.01663 15.4221 7.91192C14.8407 7.8072 14.2427 7.92171 13.7338 8.23519C13.225 8.54867 12.8381 9.04095 12.6415 9.625H5.83316V7.72625C6.38911 7.51962 6.85763 7.11333 7.15596 6.57916C7.45428 6.04498 7.56321 5.41729 7.46351 4.80695C7.36381 4.19662 7.06189 3.64292 6.61108 3.24367C6.16027 2.84441 5.58958 2.62529 4.99982 2.625Z" fill="#E84E0F"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_160_11460">
                        <rect width="20" height="21" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Kategori Dropdown */}
            {showCategoryDropdown && (
              <div className="category-dropdown">
                {/* Arama kutusu */}
                <div className="category-search" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    placeholder="Kategori ara..."
                    value={categorySearchTerm || ""}
                    onChange={(e) => handleCategorySearch(e.target.value)}
                    className="category-search-input"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* Kategori listesi */}
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

      <Row className="mb-3">
        <Col md={6}>
          <Form.Label>İLÇE</Form.Label>
          <Form.Select
            value={formData.district || ""}
            onChange={(e) => handleInputChange("district", e.target.value)}
          >
            <option value="">İlçe seçiniz</option>
            {ilceler.map((ilce) => (
              <option key={ilce} value={ilce}>
                {ilce}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Label>MAHALLE</Form.Label>
          <Form.Select
            value={formData.neighborhood || ""}
            onChange={(e) => handleInputChange("neighborhood", e.target.value)}
            disabled={!formData.district}
          >
            <option value="">
              {formData.district ? "Mahalle seçiniz" : "Önce ilçe seçiniz"}
            </option>
            {availableMahalleler.map((mahalle) => (
              <option key={mahalle} value={mahalle}>
                {mahalle}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

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
          {formData.phone1 && formData.phone1.replace(/\D/g, '').length > 0 && (
            <div className="form-text">
              {formData.phone1.replace(/\D/g, '').length === 11 && formData.phone1.replace(/\D/g, '').startsWith('0') ? (
                <span className="text-success">
                  <i className="fas fa-check-circle me-1"></i>
                  Geçerli telefon numarası
                </span>
              ) : (
                <span className="text-danger">
                  <i className="fas fa-times-circle me-1"></i>
                  Telefon 11 haneli olmalı ve 0 ile başlamalıdır
                </span>
              )}
            </div>
          )}
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
          {formData.phone2 && formData.phone2.replace(/\D/g, '').length > 0 && (
            <div className="form-text">
              {formData.phone2.replace(/\D/g, '').length === 11 && formData.phone2.replace(/\D/g, '').startsWith('0') ? (
                <span className="text-success">
                  <i className="fas fa-check-circle me-1"></i>
                  Geçerli telefon numarası
                </span>
              ) : (
                <span className="text-danger">
                  <i className="fas fa-times-circle me-1"></i>
                  Telefon 11 haneli olmalı ve 0 ile başlamalıdır
                </span>
              )}
            </div>
          )}
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Form.Label>E-MAİL</Form.Label>
          <Form.Control
            type="email"
            placeholder="ornek@email.com"
            value={formData.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
        </Col>
      </Row>

      {/* Profil Resmi Yükleme */}
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
                  id="avatar-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-input" className="avatar-upload-label">
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
  );

  return (
    <Modal
      show={show}
      onHide={handleCancel}
      size="lg"
      centered
      className="add-contact-modal"
    >
      <Modal.Header className="modal-header-custom">
        <div className="header-content">
          <div className="header-icon">
          <svg width="53" height="57" viewBox="0 0 53 57" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M52.1057 46.0192H46.7151V40.6285C46.7151 40.3321 46.4725 40.0895 46.1761 40.0895H42.9417C42.6452 40.0895 42.4026 40.3321 42.4026 40.6285V46.0192H37.012C36.7155 46.0192 36.4729 46.2617 36.4729 46.5582V49.7926C36.4729 50.0891 36.7155 50.3317 37.012 50.3317H42.4026V55.7223C42.4026 56.0188 42.6452 56.2614 42.9417 56.2614H46.1761C46.4725 56.2614 46.7151 56.0188 46.7151 55.7223V50.3317H52.1057C52.4022 50.3317 52.6448 50.0891 52.6448 49.7926V46.5582C52.6448 46.2617 52.4022 46.0192 52.1057 46.0192ZM17.1677 27.5832C17.1071 26.997 17.0734 26.404 17.0734 25.8043C17.0734 24.7329 17.1745 23.6885 17.3632 22.671C17.4103 22.4284 17.2823 22.1791 17.0599 22.078C16.1435 21.667 15.3012 21.101 14.5735 20.3867C13.716 19.5553 13.0412 18.5542 12.5922 17.4474C12.1432 16.3406 11.9299 15.1523 11.9658 13.9584C12.0264 11.7954 12.8957 9.74025 14.4118 8.19045C16.0761 6.48566 18.3133 5.55578 20.6919 5.58273C22.8414 5.60295 24.9168 6.43176 26.4868 7.9007C27.0191 8.39934 27.4773 8.95187 27.8614 9.54484C27.9962 9.75373 28.259 9.84133 28.4881 9.76047C29.674 9.34943 30.9273 9.05969 32.2143 8.92492C32.5917 8.88449 32.8073 8.48019 32.6388 8.14328C30.4489 3.81056 25.9747 0.818769 20.7997 0.737909C13.3337 0.623358 7.10749 6.74846 7.10749 14.2145C7.10749 18.4461 9.05486 22.2196 12.1073 24.6925C9.96452 25.683 7.99021 27.0509 6.27868 28.7624C2.58611 32.4483 0.497239 37.3133 0.362473 42.5085C0.360675 42.5804 0.373289 42.652 0.399574 42.719C0.425858 42.7859 0.465279 42.8469 0.515516 42.8984C0.565753 42.9499 0.625788 42.9908 0.692085 43.0188C0.758381 43.0467 0.829597 43.0611 0.901536 43.0611H4.68171C4.97146 43.0611 5.21404 42.832 5.22077 42.5422C5.3488 38.634 6.9323 34.9751 9.71521 32.1989C11.6963 30.2179 14.122 28.8433 16.7702 28.1762C17.0262 28.1021 17.2014 27.8528 17.1677 27.5832ZM47.5237 25.8043C47.5237 18.4326 41.6008 12.4423 34.256 12.3278C26.79 12.2132 20.5706 18.3383 20.5706 25.8043C20.5706 30.036 22.5247 33.8094 25.5704 36.2823C23.4054 37.2859 21.4346 38.6637 19.7485 40.3523C16.0559 44.0381 13.9671 48.9031 13.8323 54.0916C13.8305 54.1635 13.8431 54.2351 13.8694 54.3021C13.8957 54.369 13.9351 54.43 13.9853 54.4815C14.0356 54.533 14.0956 54.574 14.1619 54.6019C14.2282 54.6298 14.2994 54.6442 14.3714 54.6442H18.1448C18.4345 54.6442 18.6771 54.4151 18.6839 54.1253C18.8119 50.2171 20.3954 46.5582 23.1783 43.7821C26.0825 40.8779 29.9368 39.2809 34.0471 39.2809C41.4862 39.2809 47.5237 33.2501 47.5237 25.8043ZM40.1453 31.9025C38.5146 33.5331 36.3516 34.4293 34.0471 34.4293C31.7427 34.4293 29.5797 33.5331 27.949 31.9025C27.1353 31.093 26.4923 30.1284 26.0583 29.0658C25.6242 28.0033 25.4079 26.8644 25.4221 25.7167C25.4424 23.5066 26.3251 21.3705 27.8681 19.787C29.4853 18.1294 31.6483 17.2063 33.9595 17.1793C36.2438 17.1591 38.4607 18.0486 40.0914 19.6455C41.7625 21.2829 42.6789 23.4729 42.6789 25.8043C42.6721 28.1088 41.776 30.2718 40.1453 31.9025Z" fill="#6D26F6"/>
</svg>


          </div>
          <Modal.Title>KİŞİ EKLE</Modal.Title>
        </div>
        <Button variant="link" onClick={handleCancel} className="close-btn">
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

        {renderFormContent()}
      </Modal.Body>

            <Modal.Footer className="modal-footer-custom">
        <div className="footer-buttons">
          <Button 
            variant="warning" 
            onClick={handleCancel}
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
                Kaydediliyor...
              </>
            ) : (
              "KAYDET"
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AddContactModal;
 