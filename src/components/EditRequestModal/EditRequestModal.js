import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { ilceler, getMahalleler } from "../../data/istanbulData";
import requestsService from "../../services/requestsService";
import "./EditRequestModal.css";

const EditRequestModal = ({ show, onHide, request, onRequestUpdated }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [formData, setFormData] = useState({
    tcNo: "",
    ad: "",
    soyad: "",
    ilce: "",
    mahalle: "",
    adres: "",
    telefon: "",
    talepDurumu: "SEÇİNİZ",
    talepTuru: "ARIZA TALEBİNİN GİDERİLMESİ",
    ilgiliMudurluk: "BİLGİ İŞLEM MÜDÜRLÜĞÜ",
    talepBasligi: "",
    aciklama: "",
    durum: "DÜŞÜK"
  });

  const [mahalleler, setMahalleler] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [tcValidation, setTcValidation] = useState({ status: '', message: '' });

  // Request değiştiğinde form verilerini güncelle
  useEffect(() => {
    if (request) {
      setFormData({
        tcNo: request.tc_no || "",
        ad: request.ad || "",
        soyad: request.soyad || "",
        ilce: request.ilce || "",
        mahalle: request.mahalle || "",
        adres: request.adres || "",
        telefon: request.telefon || "",
        talepDurumu: request.talep_durumu || "SEÇİNİZ",
        talepTuru: request.talep_turu || "ARIZA TALEBİNİN GİDERİLMESİ",
        ilgiliMudurluk: request.ilgili_mudurluk || "BİLGİ İŞLEM MÜDÜRLÜĞÜ",
        talepBasligi: request.talep_basligi || "",
        aciklama: request.aciklama || "",
        durum: request.durum || "DÜŞÜK"
      });

      // İlçe seçiliyse mahalleler listesini güncelle
      if (request.ilce) {
        setMahalleler(getMahalleler(request.ilce));
      }
    }
  }, [request]);

  // İlçe değiştiğinde mahalleler listesini güncelle
  useEffect(() => {
    if (formData.ilce) {
      setMahalleler(getMahalleler(formData.ilce));
      // İlçe değiştiğinde mahalle seçimini sıfırla
      if (formData.mahalle && !getMahalleler(formData.ilce).includes(formData.mahalle)) {
        setFormData(prev => ({ ...prev, mahalle: "" }));
      }
    } else {
      setMahalleler([]);
      setFormData(prev => ({ ...prev, mahalle: "" }));
    }
  }, [formData.ilce]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // TC Kimlik No formatlaması ve doğrulama
  const handleTCChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Sadece rakamlar
    if (value.length <= 11) {
      // Her rakam arasına boşluk ekle
      const formattedValue = value.split("").join(" ");
      setFormData(prev => ({ ...prev, tcNo: formattedValue }));
      
      // TC doğrulama
      if (value.length === 11) {
        const isValid = validateTC(value);
        if (isValid) {
          setTcValidation({ status: 'valid', message: 'Geçerli TC Kimlik No' });
        } else {
          setTcValidation({ status: 'invalid', message: 'Geçersiz TC Kimlik No' });
        }
      } else if (value.length > 0) {
        setTcValidation({ status: 'warning', message: `${11 - value.length} rakam eksik` });
      } else {
        setTcValidation({ status: '', message: '' });
      }
      
      if (errors.tcNo) {
        setErrors(prev => ({ ...prev, tcNo: "" }));
      }
    }
  };

  // Telefon formatlaması
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Sadece rakamlar
    
    if (value.length <= 11) {
      // 0 (5XX) XXX XX XX formatı
      let formattedValue = "";
      if (value.length >= 1) {
        formattedValue = value[0];
        if (value.length >= 2) {
          formattedValue += " (" + value.substring(1, 4);
          if (value.length >= 4) {
            formattedValue += ") " + value.substring(4, 7);
            if (value.length >= 7) {
              formattedValue += " " + value.substring(7, 9);
              if (value.length >= 9) {
                formattedValue += " " + value.substring(9, 11);
              }
            }
          }
        }
      }
      
      setFormData(prev => ({ ...prev, telefon: formattedValue }));
      
      if (errors.telefon) {
        setErrors(prev => ({ ...prev, telefon: "" }));
      }
    }
  };

  // TC Kimlik No doğrulama
  const validateTC = (tc) => {
    if (!tc) return true; // TC zorunlu değil
    
    const cleanTC = tc.replace(/\s/g, "");
    if (cleanTC.length !== 11) return false;
    
    const digits = cleanTC.split("").map(Number);
    
    // İlk rakam 0 olamaz
    if (digits[0] === 0) return false;
    
    // 10. rakam kontrolü
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const tenthDigit = ((oddSum * 7) - evenSum) % 10;
    
    if (tenthDigit !== digits[9]) return false;
    
    // 11. rakam kontrolü
    const eleventhDigit = (digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0)) % 10;
    
    return eleventhDigit === digits[10];
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ad.trim()) {
      newErrors.ad = "Ad alanı zorunludur";
    }

    if (!formData.soyad.trim()) {
      newErrors.soyad = "Soyad alanı zorunludur";
    }

    if (formData.tcNo && !validateTC(formData.tcNo.replace(/\s/g, ""))) {
      newErrors.tcNo = "Geçerli bir TC Kimlik No giriniz";
    }

    if (!formData.talepBasligi.trim()) {
      newErrors.talepBasligi = "Talep başlığı zorunludur";
    }

    if (!formData.aciklama.trim()) {
      newErrors.aciklama = "Açıklama alanı zorunludur";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setAlert({
        show: true,
        message: "Lütfen tüm zorunlu alanları doldurunuz",
        type: "danger"
      });
      return;
    }

    setLoading(true);
    
    try {
      const cleanData = {
        ...formData,
        tcNo: formData.tcNo.replace(/\s/g, ""),
        telefon: formData.telefon.replace(/\D/g, "")
      };

      const response = await requestsService.updateRequest(request.id, cleanData);
      
      if (response.success) {
        showSuccess("Talep başarıyla güncellendi");
        
        setAlert({
          show: true,
          message: "Talep başarıyla güncellendi",
          type: "success"
        });
        
        setTimeout(() => {
          onRequestUpdated();
          onHide();
          setAlert({ show: false, message: "", type: "" });
        }, 1500);
      } else {
        showError(response.message || "Talep güncellenirken bir hata oluştu");
        
        setAlert({
          show: true,
          message: response.message || "Talep güncellenirken bir hata oluştu",
          type: "danger"
        });
      }
    } catch (error) {
      console.error("Talep güncelleme hatası:", error);
      
      showError("Talep güncellenirken bir hata oluştu");
      
      setAlert({
        show: true,
        message: "Talep güncellenirken bir hata oluştu",
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      tcNo: "",
      ad: "",
      soyad: "",
      ilce: "",
      mahalle: "",
      adres: "",
      telefon: "",
      talepDurumu: "SEÇİNİZ",
      talepTuru: "ARIZA TALEBİNİN GİDERİLMESİ",
      ilgiliMudurluk: "BİLGİ İŞLEM MÜDÜRLÜĞÜ",
      talepBasligi: "",
      aciklama: "",
      durum: "Beklemede"
    });
    setErrors({});
    setAlert({ show: false, message: "", type: "" });
    setTcValidation({ status: '', message: '' });
    onHide();
  };

  const statusOptions = [
    { value: 'DÜŞÜK', label: 'DÜŞÜK', className: 'dusuk' },
    { value: 'NORMAL', label: 'NORMAL', className: 'normal' },
    { value: 'ACİL', label: 'ACİL', className: 'acil' },
    { value: 'ÇOK ACİL', label: 'ÇOK ACİL', className: 'cok-acil' },
    { value: 'KRİTİK', label: 'KRİTİK', className: 'kritik' },
    { value: 'TAMAMLANDI', label: 'TAMAMLANDI', className: 'tamamlandi' },
    { value: 'İPTAL EDİLDİ', label: 'İPTAL EDİLDİ', className: 'iptal-edildi' }
  ];

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      className="edit-request-modal"
    >
      <Modal.Header className="modal-header-custom">
        <Modal.Title>TALEP DÜZENLE</Modal.Title>
        <Button variant="link" onClick={handleClose} className="close-btn">
          <i className="fas fa-times"></i>
        </Button>
      </Modal.Header>

      <Modal.Body>
        <div className="form-content">
          {alert.show && (
            <Alert variant={alert.type} className="mb-3">
              {alert.message}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* TC Kimlik No */}
            <div className="tc-input-container">
              <Form.Label className="form-label">TC Kimlik Numarası</Form.Label>
              <Form.Control
                type="text"
                value={formData.tcNo}
                onChange={handleTCChange}
                placeholder="- - - - - - - - - - -"
                maxLength="21"
                className={`tc-input ${tcValidation.status}`}
                isInvalid={!!errors.tcNo}
              />
              <div className="tc-status-container">
                {tcValidation.status === 'valid' && (
                  <div className="tc-validation-result tc-success">
                    <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
                    <span style={{ color: '#10B981' }}>{tcValidation.message}</span>
                  </div>
                )}
                {tcValidation.status === 'invalid' && (
                  <div className="tc-validation-result tc-error">
                    <i className="fas fa-times-circle" style={{ color: '#EF4444' }}></i>
                    <span style={{ color: '#EF4444' }}>{tcValidation.message}</span>
                  </div>
                )}
                {tcValidation.status === 'warning' && (
                  <div className="tc-validation-result tc-warning">
                    <i className="fas fa-exclamation-circle" style={{ color: '#F59E0B' }}></i>
                    <span style={{ color: '#F59E0B' }}>{tcValidation.message}</span>
                  </div>
                )}
                {errors.tcNo && (
                  <div className="tc-validation-result tc-error">
                    <i className="fas fa-times-circle" style={{ color: '#EF4444' }}></i>
                    <span style={{ color: '#EF4444' }}>{errors.tcNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ad Soyad */}
            <div className="form-row">
              <div className="form-group">
                <Form.Label className="form-label">Ad *</Form.Label>
                <Form.Control
                  type="text"
                  name="ad"
                  value={formData.ad}
                  onChange={handleInputChange}
                  placeholder="Adınızı giriniz"
                  isInvalid={!!errors.ad}
                />
                {errors.ad && <Form.Control.Feedback type="invalid">{errors.ad}</Form.Control.Feedback>}
              </div>
              
              <div className="form-group">
                <Form.Label className="form-label">Soyad *</Form.Label>
                <Form.Control
                  type="text"
                  name="soyad"
                  value={formData.soyad}
                  onChange={handleInputChange}
                  placeholder="Soyadınızı giriniz"
                  isInvalid={!!errors.soyad}
                />
                {errors.soyad && <Form.Control.Feedback type="invalid">{errors.soyad}</Form.Control.Feedback>}
              </div>
            </div>

            {/* İlçe Mahalle */}
            <div className="form-row">
              <div className="form-group">
                <Form.Label className="form-label">İlçe</Form.Label>
                <Form.Select
                  name="ilce"
                  value={formData.ilce}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">İlçe Seçiniz</option>
                  {ilceler.map((ilce) => (
                    <option key={ilce} value={ilce}>
                      {ilce}
                    </option>
                  ))}
                </Form.Select>
              </div>
              
              <div className="form-group">
                <Form.Label className="form-label">Mahalle</Form.Label>
                <Form.Select
                  name="mahalle"
                  value={formData.mahalle}
                  onChange={handleInputChange}
                  disabled={!formData.ilce}
                  className="form-control"
                >
                  <option value="">Mahalle Seçiniz</option>
                  {mahalleler.map((mahalle) => (
                    <option key={mahalle} value={mahalle}>
                      {mahalle}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>

            {/* Adres */}
            <div className="form-row single">
              <div className="form-group">
                <Form.Label className="form-label">Adres</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="adres"
                  value={formData.adres}
                  onChange={handleInputChange}
                  placeholder="Adres bilgilerinizi giriniz"
                />
              </div>
            </div>

            {/* Telefon ve Talep Durumu */}
            <div className="form-row">
              <div className="form-group">
                <Form.Label className="form-label">Telefon</Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.telefon}
                  onChange={handlePhoneChange}
                  placeholder="0 (5XX) XXX XX XX"
                  maxLength="17"
                />
              </div>
              
              <div className="form-group">
                <Form.Label className="form-label">Talep Durumu</Form.Label>
                <Form.Select
                  name="talepDurumu"
                  value={formData.talepDurumu}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="SEÇİNİZ">SEÇİNİZ</option>
                  <option value="KRİTİK">KRİTİK</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="DÜŞÜK">DÜŞÜK</option>
                </Form.Select>
              </div>
            </div>

            {/* Talep Türü ve İlgili Müdürlük */}
            <div className="form-row">
              <div className="form-group">
                <Form.Label className="form-label">Talep Türü</Form.Label>
                <Form.Select
                  name="talepTuru"
                  value={formData.talepTuru}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="ARIZA TALEBİNİN GİDERİLMESİ">ARIZA TALEBİNİN GİDERİLMESİ</option>
                  <option value="YENİ TALEP">YENİ TALEP</option>
                  <option value="BİLGİ TALEP">BİLGİ TALEP</option>
                  <option value="ŞİKAYET">ŞİKAYET</option>
                </Form.Select>
              </div>
              
              <div className="form-group">
                <Form.Label className="form-label">İlgili Müdürlük</Form.Label>
                <Form.Select
                  name="ilgiliMudurluk"
                  value={formData.ilgiliMudurluk}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="BİLGİ İŞLEM MÜDÜRLÜĞÜ">BİLGİ İŞLEM MÜDÜRLÜĞÜ</option>
                  <option value="TEKNIK MÜDÜRLÜK">TEKNIK MÜDÜRLÜK</option>
                  <option value="İNSAN KAYNAKLARI MÜDÜRLÜĞÜ">İNSAN KAYNAKLARI MÜDÜRLÜĞÜ</option>
                  <option value="MALİ İŞLER MÜDÜRLÜĞÜ">MALİ İŞLER MÜDÜRLÜĞÜ</option>
                </Form.Select>
              </div>
            </div>

            {/* Talep Başlığı */}
            <div className="form-row single">
              <div className="form-group">
                <Form.Label className="form-label">Talep Başlığı *</Form.Label>
                <Form.Control
                  type="text"
                  name="talepBasligi"
                  value={formData.talepBasligi}
                  onChange={handleInputChange}
                  placeholder="Talep başlığını giriniz"
                  isInvalid={!!errors.talepBasligi}
                />
                {errors.talepBasligi && <Form.Control.Feedback type="invalid">{errors.talepBasligi}</Form.Control.Feedback>}
              </div>
            </div>

            {/* Durum Seçimi */}
            <div className="form-group">
              <Form.Label className="form-label">Durum</Form.Label>
              <div className="status-selector">
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`status-option ${option.className} ${
                      formData.durum === option.value ? 'selected' : ''
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, durum: option.value }))}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Açıklama */}
            <div className="form-row single">
              <div className="form-group">
                <Form.Label className="form-label">Açıklama *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="aciklama"
                  value={formData.aciklama}
                  onChange={handleInputChange}
                  placeholder="Talep açıklamasını giriniz"
                  isInvalid={!!errors.aciklama}
                />
                {errors.aciklama && <Form.Control.Feedback type="invalid">{errors.aciklama}</Form.Control.Feedback>}
              </div>
            </div>
          </Form>
        </div>
      </Modal.Body>

      <Modal.Footer className="modal-footer-custom">
        <div className="footer-buttons">
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading}
            className="cancel-btn"
          >
            İPTAL ET
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={loading}
            className="save-btn"
          >
            {loading ? "GÜNCELLENIYOR..." : "GÜNCELLE"}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditRequestModal;