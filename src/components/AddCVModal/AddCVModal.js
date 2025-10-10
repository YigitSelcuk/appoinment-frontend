import React, { useState, useEffect } from "react";
import { Modal, Button } from 'react-bootstrap';
import { contactsService } from '../../services/contactsService';
import { cvsService, getProfileImageUrl } from '../../services/cvsService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { iller, getIlceler, getMahalleler } from '../../data/turkiyeData';
import "./AddCVModal.css";

const AddCVModal = ({ isOpen, onClose, onSubmit }) => {
  const { showError, showSuccess } = useSimpleToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    tc_kimlik_no: "",
    adi: "",
    soyadi: "",
    il: "SEÇİNİZ",
    ilce: "SEÇİNİZ",
    mahalle: "SEÇİNİZ",
    adres: "",
    talep_edilen_is: "",
    meslek: "",
    telefon: "",
    email: "",
    referans_kisi: "",
    referans_telefon: "",
    referans_meslek: "",
    referans_listesi: [],
    is_yonlendirildi: "SEÇİNİZ",
    durum: "SEÇİNİZ",
    notlar: ""
  });

  const [files, setFiles] = useState({
    yakupOzGecmis: null,
    yakupOzGecmis2: null,
    profilResmi: null
  });

  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  // İlçe ve mahalle listeleri için state
  const [ilceler, setIlceler] = useState([]);
  const [mahalleler, setMahalleler] = useState([]);

  // İl değiştiğinde ilçeleri güncelle
  useEffect(() => {
    if (formData.il && formData.il !== "SEÇİNİZ") {
      const ilceList = getIlceler(formData.il);
      setIlceler(ilceList);
      
      // İl değiştiğinde ilçe ve mahalleyi sıfırla
      setFormData(prev => ({
        ...prev,
        ilce: "SEÇİNİZ",
        mahalle: "SEÇİNİZ"
      }));
      setMahalleler([]);
    } else {
      setIlceler([]);
      setMahalleler([]);
    }
  }, [formData.il]);

  // İlçe değiştiğinde mahalleleri güncelle
  useEffect(() => {
    if (formData.il && formData.il !== "SEÇİNİZ" && formData.ilce && formData.ilce !== "SEÇİNİZ") {
      const mahalleList = getMahalleler(formData.il, formData.ilce);
      setMahalleler(mahalleList);
      
      // İlçe değiştiğinde mahalleyi sıfırla
      setFormData(prev => ({
        ...prev,
        mahalle: "SEÇİNİZ"
      }));
    } else {
      setMahalleler([]);
    }
  }, [formData.il, formData.ilce]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGetContactInfo = async () => {
    const tcNo = formData.tc_kimlik_no.trim();
    
    if (!tcNo || tcNo.length !== 11) {
      showError('Geçerli bir TC Kimlik No giriniz (11 haneli)');
      return;
    }

    try {
      // Önce kişi bilgilerini kontrol et
      const response = await contactsService.checkTCExists(tcNo);
      
      if (response.success && response.exists) {
        const contact = response.contact;
        setFormData(prev => ({
          ...prev,
          adi: contact.name || '',
          soyadi: contact.surname || '',
          telefon: contact.phone1 || '',
          email: contact.email || '',
          adres: contact.address || '',
          ilce: contact.district || 'SULTANGAZI',
          notlar: contact.notes || ''
        }));
        
        // Önce contact'tan avatar kontrolü yap
        if (contact.avatar) {
          // Contact.avatar zaten '/uploads/avatars/' ile başlıyor, sadece base URL ekle
          const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
          const avatarUrl = contact.avatar.startsWith('/uploads/') 
            ? `${baseUrl}${contact.avatar}`
            : `${baseUrl}/uploads/avatars/${contact.avatar}`;
          console.log('Avatar URL oluşturuldu:', avatarUrl);
          console.log('Contact avatar:', contact.avatar);
          setProfileImagePreview(avatarUrl);
          setFiles(prev => ({
            ...prev,
            profilResmi: { name: contact.avatar, isExisting: true, isContactAvatar: true }
          }));
        } else {
          // Avatar yoksa CV bilgilerini kontrol et ve profil resmini getir
          try {
            const cvResponse = await cvsService.getCVs({ search: tcNo });
            if (cvResponse.success && cvResponse.data && cvResponse.data.length > 0) {
              const existingCV = cvResponse.data[0];
              if (existingCV.profil_resmi) {
                const imageUrl = await getProfileImageUrl(existingCV.profil_resmi);
                if (imageUrl) {
                  setProfileImagePreview(imageUrl);
                  // Profil resmini files state'ine de ekle (varolan dosya olarak işaretle)
                  setFiles(prev => ({
                    ...prev,
                    profilResmi: { name: existingCV.profil_resmi, isExisting: true }
                  }));
                }
              }
            }
          } catch (cvError) {
            console.log('CV profil resmi getirilemedi:', cvError);
            // CV bulunamadığında hata gösterme, sadece kişi bilgilerini getir
          }
        }
        
        showSuccess('Kişi bilgileri başarıyla getirildi!');
      } else {
        showError('Bu TC Kimlik No ile kayıtlı kişi bulunamadı.');
      }
    } catch (error) {
      console.error('Kişi bilgileri getirme hatası:', error);
      showError('Kişi bilgileri getirilirken bir hata oluştu.');
    }
  };

  const handleAddReferans = () => {
    if (formData.referans_kisi.trim() !== "") {
      const newReferans = {
        isim: formData.referans_kisi.trim(),
        telefon: formData.referans_telefon.trim(),
        meslek: formData.referans_meslek.trim()
      };
      setFormData(prev => ({
        ...prev,
        referans_listesi: [...prev.referans_listesi, newReferans],
        referans_kisi: "",
        referans_telefon: "",
        referans_meslek: ""
      }));
    }
  };

  const handleRemoveReferans = (index) => {
    setFormData(prev => ({
      ...prev,
      referans_listesi: prev.referans_listesi.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    setFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
    
    // Profil resmi için önizleme oluştur
    if (fileType === 'profilResmi' && file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      setFiles(prev => ({
        ...prev,
        yakupOzGecmis: file
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Zorunlu alanları kontrol et
    if (!formData.adi.trim()) {
      showError('Adı alanı zorunludur!');
      return;
    }
    if (!formData.soyadi.trim()) {
      showError('Soyadı alanı zorunludur!');
      return;
    }
    if (!formData.meslek.trim()) {
      showError('Meslek alanı zorunludur!');
      return;
    }
    
    const submitData = new FormData();
    
    // Kayıt tarihi olarak bugünün tarihini ekle
    const today = new Date().toISOString().split('T')[0];
    submitData.append('kayit_tarihi', today);
    
    // Backend'in beklediği alan adlarına göre form verilerini ekle
    submitData.append('tc_kimlik_no', formData.tc_kimlik_no);
    submitData.append('adi', formData.adi.trim());
    submitData.append('soyadi', formData.soyadi.trim());
    submitData.append('ilce', formData.ilce);
    submitData.append('mahalle', formData.mahalle);
    submitData.append('adres', formData.adres);
    submitData.append('talep_edilen_is', formData.talep_edilen_is);
    submitData.append('meslek', formData.meslek.trim());
    submitData.append('telefon', formData.telefon);
    submitData.append('email', formData.email);
    submitData.append('referans_kisi', formData.referans_kisi);
    submitData.append('referans_telefon', formData.referans_telefon);
    submitData.append('referans_meslek', formData.referans_meslek);
    submitData.append('is_yonlendirildi', formData.is_yonlendirildi === 'SEÇİNİZ' ? 'SEÇİNİZ' : formData.is_yonlendirildi);
    submitData.append('durum', formData.durum === 'SEÇİNİZ' ? 'İŞ ARIYOR' : formData.durum);
    submitData.append('notlar', formData.notlar);
    
    // Referans listesini JSON string olarak ekle
    if (formData.referans_listesi && formData.referans_listesi.length > 0) {
      submitData.append('referans', JSON.stringify(formData.referans_listesi));
    }
    
    // CV dosyasını ekle
    if (files.yakupOzGecmis) {
      submitData.append('cv_dosyasi', files.yakupOzGecmis);
    }
    
    // Profil resmini ekle
    if (files.profilResmi) {
      // Eğer varolan bir dosya ise (isExisting: true), dosya adını gönder
      if (files.profilResmi.isExisting) {
        if (files.profilResmi.isContactAvatar) {
          // Contact avatar'ı ise özel parametre gönder
          submitData.append('contact_avatar', files.profilResmi.name);
        } else {
          // CV profil resmi ise
          submitData.append('existing_profil_resmi', files.profilResmi.name);
        }
      } else {
        // Yeni yüklenen dosya ise, dosyayı gönder
        submitData.append('profil_resmi', files.profilResmi);
      }
    }
    
    onSubmit(submitData);
  };

  const resetForm = () => {
    setFormData({
      tc_kimlik_no: "",
      adi: "",
      soyadi: "",
      ilce: "SULTANGAZI",
      mahalle: "SEÇİNİZ",
      adres: "",
      talep_edilen_is: "",
      meslek: "",
      telefon: "",
      email: "",
      referans_kisi: "",
      referans_telefon: "",
      referans_meslek: "",
      referans_listesi: [],
      is_yonlendirildi: "SEÇİNİZ",
      durum: "SEÇİNİZ",
      notlar: ""
    });
    setFiles({
      yakupOzGecmis: null,
      yakupOzGecmis2: null,
      profilResmi: null
    });
    setProfileImagePreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" className="add-cv-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          CV EKLE
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
            <form id="cv-form" onSubmit={handleSubmit} className="modal-form">
              <div className="form-content">
            {/* Üst Bölüm - Profil ve TC Bilgileri */}
            <div className="top-section">
              {/* Sol: Profil Resmi */}
              <div className="profile-image-container">
                <div 
                  className="profile-image-placeholder"
                  onClick={() => document.getElementById('profile-image-input').click()}
                  style={{ cursor: 'pointer' }}
                >
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profil" 
                      className="profile-image"
                    />
                  ) : (
                    <div className="profile-placeholder-content">
                      <div className="profile-icon">👤</div>
                      <span className="profile-text">Profil Resmi</span>
                    </div>
                  )}
                  {files.profilResmi && (
                    <button 
                      type="button" 
                      className="remove-profile-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiles(prev => ({ ...prev, profilResmi: null }));
                        setProfileImagePreview(null);
                      }}
                      title="Profil resmini kaldır"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'profilResmi')}
                  style={{ display: 'none' }}
                />
              </div>
              
              {/* Orta: TC Kimlik ve Bilgiler */}
              <div className="tc-info-section">
                <div className="tc-row">
                  <span className="tc-label">TC KİMLİK NO</span>
                  <input
                    type="text"
                    name="tc_kimlik_no"
                    value={formData.tc_kimlik_no}
                    onChange={handleInputChange}
                    className="tc-input"
                    placeholder="24324324323"
                  />
                  <button type="button" className="info-button" onClick={handleGetContactInfo}>
                    BİLGİLERİ GETİR
                  </button>
                </div>
                
                <div className="name-info-row">
                  <div className="name-group">
                    <span className="name-label">ADI</span>
                    <span className="name-label">SOYADI</span>
                  </div>
                  <div className="name-inputs">
                    <input
                      type="text"
                      name="adi"
                      value={formData.adi}
                      onChange={handleInputChange}
                      className="name-input"
                      placeholder="ÖMER"
                      required
                    />
                    <input
                      type="text"
                      name="soyadi"
                      value={formData.soyadi}
                      onChange={handleInputChange}
                      className="name-input"
                      placeholder="GÖK"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Adres Bölümü */}
            <div className="address-section">
              <div className="address-field">
                <span className="address-label">İLÇE</span>
                <select
                  name="ilce"
                  value={formData.ilce}
                  onChange={handleInputChange}
                  className="address-select"
                >
                  <option value="">İLÇE SEÇİNİZ</option>
                  {ilceler.map((ilce, index) => (
                    <option key={index} value={ilce}>
                      {ilce}
                    </option>
                  ))}
                </select>
              </div>
              <div className="address-field">
                <span className="address-label">MAHALLE</span>
                <select
                  name="mahalle"
                  value={formData.mahalle}
                  onChange={handleInputChange}
                  className="address-select"
                >
                  <option value="SEÇİNİZ">MAHALLE SEÇİNİZ</option>
                  {mahalleler.map((mahalle, index) => (
                    <option key={index} value={mahalle}>
                      {mahalle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="address-field">
                <span className="address-label">ADRES</span>
                <input
                  type="text"
                  name="adres"
                  value={formData.adres}
                  onChange={handleInputChange}
                  className="address-input"
                />
              </div>
            </div>

            {/* Form Alanları */}
            <div className="form-fields-section">
              {/* Talep Edilen İş ve Meslek Bölümü */}
              <div className="is-meslek-section">
                <div className="is-meslek-fields">
                  <div className="talep-field">
                    <span className="field-label">TALEP EDİLEN İŞ</span>
                    <div className="talep-input-row">
                      <input
                        type="text"
                        name="talep_edilen_is" 
                        value={formData.talep_edilen_is}
                        onChange={handleInputChange}
                        className="field-input"
                        placeholder="Talep edilen işi giriniz"
                      />
                    </div>
                  </div>
                  <div className="meslek-field">
                    <span className="field-label">MESLEĞİ</span>
                    <input
                      type="text"
                      name="meslek"
                      value={formData.meslek}
                      onChange={handleInputChange}
                      className="field-input"
                      placeholder="Mesleğinizi giriniz"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Telefon ve Email Bölümü */}
              <div className="telefon-email-section">
                {/* Telefon Bölümü */}
                <div className="telefon-container">
                  <div className="telefon-label-row">
                    <span className="field-label">TELEFON</span>
                  </div>
                  <div className="telefon-input-row">
                    <input
                      type="text"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleInputChange}
                      className="field-input"
                    />
                  </div>
                </div>

                {/* Email Bölümü */}
                <div className="email-container">
                  <span className="field-label">EMAIL</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="field-input"
                    placeholder="E M A İ L   A D R E S İ N İ Z"
                  />
                </div>
              </div>

              {/* Referans ve Yönlendirme Bölümü */}
              <div className="referans-yonlendirme-container">
                {/* Referans Kişi */}
                <div className="referans-container">
                  <span className="field-label">REFERANS KİŞİ</span>
                  <div className="referans-input-section">
                    <div className="referans-input-row">
                      <input
                        type="text"
                        name="referans_kisi"
                        value={formData.referans_kisi}
                        onChange={handleInputChange}
                        className="referans-input"
                        placeholder="Ad Soyad"
                      />
                      <input
                        type="text"
                        name="referans_telefon"
                        value={formData.referans_telefon}
                        onChange={handleInputChange}
                        className="referans-input"
                        placeholder="Telefon"
                      />
                      <input
                        type="text"
                        name="referans_meslek"
                        value={formData.referans_meslek}
                        onChange={handleInputChange}
                        className="referans-input"
                        placeholder="Meslek"
                      />
                      <button type="button" className="orange-icon-btn" onClick={handleAddReferans}>+</button>
                    </div>
                  </div>
                  {/* Referans Kişi Listesi */}
                  {formData.referans_listesi && formData.referans_listesi.length > 0 && (
                    <div className="referans-list">
                      {formData.referans_listesi.map((referans, index) => (
                        <div key={index} className="referans-item">
                          <div className="referans-info">
                            <span className="referans-name">{referans.isim}</span>
                            <span className="referans-phone">{referans.telefon}</span>
                            <span className="referans-job">{referans.meslek}</span>
                          </div>
                          <button 
                            type="button" 
                            className="remove-referans-btn"
                            onClick={() => handleRemoveReferans(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* İş Yönlendirildi */}
                <div className="yonlendirme-container">
                  <span className="field-label">İŞ YÖNLENDİRİLDİ</span>
                  <div className="yonlendirme-input-row">
                    <select
                      name="is_yonlendirildi"
                      value={formData.is_yonlendirildi || "SEÇİNİZ"}
                      onChange={handleInputChange}
                      className="field-select"
                    >
                      <option value="SEÇİNİZ">SEÇİNİZ</option>
                      <option value="EVET">EVET</option>
                      <option value="HAYIR">HAYIR</option>
                    </select>
                  </div>
                </div>
              </div>

         

              {/* Dosya Yükleme Bölümü */}
              <div className="file-upload-section">
                <div 
                 className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
                 onClick={() => document.getElementById('cv-file-input').click()}
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
               >
                 <div className="file-upload-placeholder">
                   <div className="file-icon-large">📄</div>
                   <span className="file-upload-text">
                      {isDragOver ? 'DOSYAYI BURAYA BIRAK' : 'CV YÜKLE VEYA SÜRÜKLE BIRAK'}
                    </span>
                 </div>
                 <input
                   id="cv-file-input"
                   type="file"
                   accept=".pdf,.doc,.docx"
                   onChange={(e) => handleFileChange(e, 'yakupOzGecmis')}
                   style={{ display: 'none' }}
                 />
               </div>

                <div className="file-buttons-row">
                  <button 
                    type="button" 
                    className="file-button"
                    onClick={() => document.getElementById('cv-file-input').click()}
                  >
                    DOSYA SEÇ
                  </button>
                </div>

                {/* Yüklenen Dosyalar Listesi */}
                 {files.yakupOzGecmis && (
                   <div className="uploaded-files-list">
                     <div className="file-icon-item" title={files.yakupOzGecmis.name}>
                       <div className="file-icon-wrapper">
                         <div className="file-icon-display">
                           {files.yakupOzGecmis.type === 'application/pdf' ? '📄' : '📝'}
                         </div>
                         <button 
                           type="button" 
                           className="remove-icon-btn"
                           onClick={() => setFiles(prev => ({ ...prev, yakupOzGecmis: null }))}
                           title="Dosyayı Kaldır"
                         >
                           ✕
                         </button>
                       </div>
                       <span className="file-icon-name">{files.yakupOzGecmis.name.length > 15 ? files.yakupOzGecmis.name.substring(0, 15) + '...' : files.yakupOzGecmis.name}</span>
                     </div>
                   </div>
                 )}
              </div>

              {/* Not Editörü Bölümü */}
              <div className="notes-editor-section">
                <div className="notes-label">NOT EKLE</div>
                <div className="notes-editor">
                  <div className="editor-toolbar">
                    <button type="button" className="toolbar-button">B</button>
                    <button type="button" className="toolbar-button italic">I</button>
                    <button type="button" className="toolbar-button">U</button>
                    <button type="button" className="toolbar-button">≡</button>
                    <button type="button" className="toolbar-button">≡</button>
                    <button type="button" className="toolbar-button">🔗</button>
                    <button type="button" className="toolbar-button">📷</button>
                  </div>
                  <textarea
                    name="notlar"
                    value={formData.notlar}
                    onChange={handleInputChange}
                    className="editor-textarea"
                    placeholder="50-70 yaşında doğan internet çıkışı otomobil endüstride talebi."
                    rows="4"
                  />
                </div>
              </div>
            </div>
            </div>
            </form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          İPTAL ET
        </Button>
        <Button variant="primary" type="submit" form="cv-form">
          KAYDET
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddCVModal;