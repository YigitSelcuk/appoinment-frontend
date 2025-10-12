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
 