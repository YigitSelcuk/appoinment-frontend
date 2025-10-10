import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { ilceler, getMahalleler } from "../../data/istanbulData";
import requestsService from "../../services/requestsService";
import { getDepartments } from "../../services/usersService";
import "./AddRequestModal.css";

const AddRequestModal = ({ show, onHide, onRequestAdded }) => {
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
    ilgiliMudurluk: "",
    talepBasligi: "",
    aciklama: "",
    durum: "DÜŞÜK"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tcCheckStatus, setTcCheckStatus] = useState({ 
    checking: false, 
    exists: false, 
    message: "" 
  });
  const [availableMahalleler, setAvailableMahalleler] = useState([]);
  const [departments, setDepartments] = useState([]);
  const editorRef = useRef(null);

  // Cursor pozisyonunu kaydet
  const saveCursorPosition = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        return {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        };
      }
    }
    return null;
  };

  // Cursor pozisyonunu geri yükle
  const restoreCursorPosition = (position) => {
    if (position && editorRef.current) {
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(position.startContainer, position.startOffset);
        range.setEnd(position.endContainer, position.endOffset);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // Eğer pozisyon geçersizse, editörün sonuna git
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  // Editör fonksiyonları
  const formatText = (command, value = null) => {
    if (editorRef.current) {
      const position = saveCursorPosition();
      document.execCommand(command, false, value);
      handleInputChange('aciklama', editorRef.current.innerHTML);
      setTimeout(() => restoreCursorPosition(position), 0);
      editorRef.current.focus();
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const position = saveCursorPosition();
      handleInputChange('aciklama', editorRef.current.innerHTML);
      setTimeout(() => restoreCursorPosition(position), 0);
    }
  };

  // Modal açıldığında formu sıfırla
  useEffect(() => {
    if (show) {
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
        durum: "DÜŞÜK"
      });
      setError("");
      setTcCheckStatus({ checking: false, exists: false, message: "" });
      setAvailableMahalleler([]);
    }
  }, [show]);

  // Editör içeriğini güncelle
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== formData.aciklama) {
      const position = saveCursorPosition();
      editorRef.current.innerHTML = formData.aciklama || '';
      setTimeout(() => restoreCursorPosition(position), 0);
    }
  }, [formData.aciklama]);

  // Departments verilerini çek
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getDepartments();
        // Backend'den gelen response: { success: true, departments: [...] }
        const departmentList = response.departments || [];
        setDepartments(departmentList);
      } catch (error) {
        console.error('Departments yüklenirken hata:', error);
        setDepartments([]); // Hata durumunda boş array
      }
    };

    fetchDepartments();
  }, []);

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
      
      const response = await requestsService.checkTCExists(cleanTcNo);
      
      setTcCheckStatus({
        checking: false,
        exists: response.exists,
        message: response.message,
        request: response.request
      });
      
    } catch (error) {
      console.error('TC kontrolü hatası:', error);
      setTcCheckStatus({ 
        checking: false, 
        exists: false, 
        message: "TC kontrolü yapılırken hata oluştu" 
      });
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'tcNo') {
      const formatted = formatTCKimlik(value);
      setFormData((prev) => ({
        ...prev,
        [field]: formatted,
      }));
      
      // TC kontrolü yap
      const cleanTcNo = value.replace(/\D/g, '');
      if (cleanTcNo.length === 11) {
        checkTCExists(formatted);
      } else {
        setTcCheckStatus({ checking: false, exists: false, message: "" });
      }
    } else if (field === 'telefon') {
      const formatted = formatPhone(value);
      setFormData((prev) => ({
        ...prev,
        [field]: formatted,
      }));
    } else if (field === 'ilce') {
      // İlçe seçildiğinde mahalle listesini güncelle
      const mahalleler = getMahalleler(value);
      setAvailableMahalleler(mahalleler);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        mahalle: "", // İlçe değiştiğinde mahalle seçimini sıfırla
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    // Form doğrulaması
    const cleanTcNo = formData.tcNo.replace(/\s/g, '');
    
    if (!cleanTcNo) {
      setError("TC Kimlik No gereklidir");
      return;
    }
    
    if (!validateTCKimlik(cleanTcNo)) {
      setError("Geçerli bir TC Kimlik No giriniz");
      return;
    }
    
    if (!formData.ad.trim()) {
      setError("Ad gereklidir");
      return;
    }
    
    if (!formData.soyad.trim()) {
      setError("Soyad gereklidir");
      return;
    }
    
    if (!formData.talepBasligi.trim()) {
      setError("Talep başlığı gereklidir");
      return;
    }

    // TC zaten kullanılıyorsa uyar
    if (tcCheckStatus.exists) {
      const confirmAdd = window.confirm(`${tcCheckStatus.message}\n\nYine de eklemek istiyor musunuz?`);
      if (!confirmAdd) {
        return;
      }
    }

    try {
      setLoading(true);
      
      // Form verilerini hazırla
      const requestData = {
        tcNo: cleanTcNo,
        ad: formData.ad.trim(),
        soyad: formData.soyad.trim(),
        ilce: formData.ilce,
        mahalle: formData.mahalle,
        adres: formData.adres?.trim() || null,
        telefon: formData.telefon?.replace(/\D/g, '') || null,
        talepDurumu: formData.talepDurumu,
        talepTuru: formData.talepTuru,
        ilgiliMudurluk: formData.ilgiliMudurluk,
        talepBasligi: formData.talepBasligi.trim(),
        aciklama: formData.aciklama?.trim() || null,
        durum: formData.durum
      };
      
      const response = await requestsService.createRequest(requestData);
      
      if (response.success) {
        showSuccess('Talep başarıyla eklendi!');
        if (onRequestAdded) {
          onRequestAdded();
        }
        handleClose();
      }
    } catch (error) {
      console.error('Talep ekleme hatası:', error);
      const errorMessage = error.message || "Talep eklenirken bir hata oluştu";
      setError(errorMessage);
      showError(errorMessage);
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
      durum: "DÜŞÜK"
    });
    setError("");
    setTcCheckStatus({ checking: false, exists: false, message: "" });
    onHide();
  };

  const handleCancel = () => {
    handleClose();
  };

  // TC input durumunu belirle
  const getTCInputClass = () => {
    const cleanTcNo = formData.tcNo.replace(/\s/g, '');
    
    if (cleanTcNo.length === 0) return 'tc-input';
    if (cleanTcNo.length < 11) return 'tc-input';
    if (!validateTCKimlik(cleanTcNo)) return 'tc-input invalid';
    if (tcCheckStatus.checking) return 'tc-input';
    if (tcCheckStatus.exists) return 'tc-input warning';
    return 'tc-input valid';
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      className="add-request-modal"
    >
      {/* Header */}
      <div className="modal-header-custom">
        <h4 className="modal-title">TALEP OLUŞTUR</h4>
        <Button 
          variant="link" 
          className="close-btn"
          onClick={handleClose}
        >
          ×
        </Button>
      </div>

      <Modal.Body className="request-modal-body">
        {/* Hata Mesajı */}
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="form-content">
         
          {/* TC Kimlik No */}
          <div className="tc-input-container">
            <Form.Label className="form-label">TC KİMLİK NO</Form.Label>
            <Form.Control
              type="text"
              value={formData.tcNo}
              onChange={(e) => handleInputChange('tcNo', e.target.value)}
              placeholder="- - - - - - - - - - -"
              className={getTCInputClass()}
              maxLength="21"
            />
            <div className="tc-status-container">
              {tcCheckStatus.checking && (
                <div className="tc-checking">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span>TC Kimlik No kontrol ediliyor...</span>
                </div>
              )}
              {tcCheckStatus.message && !tcCheckStatus.checking && (
                <div className={`tc-validation-result ${tcCheckStatus.exists ? 'tc-warning' : 'tc-success'}`}>
                  <span>{tcCheckStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Alanları */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">AD</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.ad}
                  onChange={(e) => handleInputChange('ad', e.target.value)}
                  placeholder="Ad"
                  className="form-input"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">SOYAD</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.soyad}
                  onChange={(e) => handleInputChange('soyad', e.target.value)}
                  placeholder="Soyad"
                  className="form-input"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">İLÇE</Form.Label>
                <div className="select-wrapper">
                  <Form.Select
                    value={formData.ilce}
                    onChange={(e) => handleInputChange('ilce', e.target.value)}
                    className="form-select"
                  >
                    <option value="">İlçe seçiniz</option>
                    {ilceler.map((ilce) => (
                      <option key={ilce} value={ilce}>
                        {ilce}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">MAHALLE</Form.Label>
                <div className="select-wrapper">
                  <Form.Select
                    value={formData.mahalle}
                    onChange={(e) => handleInputChange('mahalle', e.target.value)}
                    className="form-select"
                    disabled={!formData.ilce}
                  >
                    <option value="">
                      {formData.ilce ? "Mahalle seçiniz" : "Önce ilçe seçiniz"}
                    </option>
                    {availableMahalleler.map((mahalle) => (
                      <option key={mahalle} value={mahalle}>
                        {mahalle}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="form-label">ADRES</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.adres}
                  onChange={(e) => handleInputChange('adres', e.target.value)}
                  className="form-textarea"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">
                  <span className="phone-icon">📞</span> TELEFON
                </Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => handleInputChange('telefon', e.target.value)}
                  placeholder="0 (5XX) XXX XX XX"
                  className="form-control form-input"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">TALEP DURUMU</Form.Label>
                <div className="select-wrapper">
                  <Form.Select
                    value={formData.talepDurumu}
                    onChange={(e) => handleInputChange('talepDurumu', e.target.value)}
                    className="form-select"
                  >
                    <option value="SEÇİNİZ">SEÇİNİZ</option>
                    <option value="KRİTİK">KRİTİK</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="DÜŞÜK">DÜŞÜK</option>
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">TALEP TÜRÜ</Form.Label>
                <div className="select-wrapper">
                  <Form.Select
                    value={formData.talepTuru}
                    onChange={(e) => handleInputChange('talepTuru', e.target.value)}
                    className="form-select"
                  >
                    <option value="ARIZA TALEBİNİN GİDERİLMESİ">ARIZA TALEBİNİN GİDERİLMESİ</option>
                    <option value="YENİ HİZMET TALEBİ">YENİ HİZMET TALEBİ</option>
                    <option value="BİLGİ TALEBİ">BİLGİ TALEBİ</option>
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">İLGİLİ MÜDÜRLÜK</Form.Label>
                <div className="select-wrapper">
                  <Form.Select
                    value={formData.ilgiliMudurluk}
                    onChange={(e) => handleInputChange('ilgiliMudurluk', e.target.value)}
                    className="form-select"
                  >
                    <option value="">SEÇİNİZ</option>
                    {Array.isArray(departments) && departments.map((department, index) => (
                      <option key={index} value={department}>
                        {department}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label">DURUM</Form.Label>
                <div className="select-wrapper">
                  <Form.Select
                    value={formData.durum}
                    onChange={(e) => handleInputChange('durum', e.target.value)}
                    className="form-select"
                  >
                    <option value="DÜŞÜK">DÜŞÜK</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="ACİL">ACİL</option>
                    <option value="ÇOK ACİL">ÇOK ACİL</option>
                    <option value="KRİTİK">KRİTİK</option>
                    <option value="TAMAMLANDI">TAMAMLANDI</option>
                    <option value="İPTAL EDİLDİ">İPTAL EDİLDİ</option>
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              {/* Boş kolon - tasarım için */}
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="form-label">TALEP BAŞLIĞI</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.talepBasligi}
                  onChange={(e) => handleInputChange('talepBasligi', e.target.value)}
                  className="form-input"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="form-label">AÇIKLAMA</Form.Label>
                <div className="simple-editor">
                  <div className="editor-toolbar">
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => formatText('bold')}
                      title="Kalın"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => formatText('italic')}
                      title="İtalik"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => formatText('underline')}
                      title="Altı Çizili"
                    >
                      <u>U</u>
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => formatText('insertUnorderedList')}
                      title="Liste"
                    >
                      •
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => formatText('insertOrderedList')}
                      title="Numaralı Liste"
                    >
                      1.
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    className="editor-textarea"
                    onInput={handleEditorChange}
                    style={{ 
                      minHeight: '100px', 
                      padding: '12px', 
                      border: 'none',
                      fontSize: '14px',
                      color: '#374151'
                    }}
                    data-placeholder="Açıklama Giriniz..."
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </div>
      </Modal.Body>

      {/* Footer */}
      <div className="modal-footer-custom">
        <div className="footer-buttons">
          <Button 
            variant="secondary"
            className="cancel-btn"
            onClick={handleCancel}
            disabled={loading}
          >
            İPTAL ET
          </Button>
          <Button 
            variant="success"
            className="save-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'KAYDET...' : 'KAYDET'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddRequestModal;