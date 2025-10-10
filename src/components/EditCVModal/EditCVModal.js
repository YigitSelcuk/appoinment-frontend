import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { cvsService } from '../../services/cvsService';
import './EditCVModal.css';

const EditCVModal = ({ show, onHide, cv, onCVUpdated }) => { 
  const [formData, setFormData] = useState({
    adi: '',
    soyadi: '',
    email: '',
    telefon: '',
    meslek: '',
    adres: '',
    durum: 'İŞ ARIYOR',
    notlar: '',
    referans: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [referansInputs, setReferansInputs] = useState([{ isim: '', meslek: '', telefon: '' }]);

  const statusOptions = [
    'İŞ ARIYOR',
    'İŞ BULUNDU',
    'BEKLEMEDE',
    'YETİŞTİRİLDİ',
    'İŞLENMEDE',
    'DEĞERLENDİRİLİYOR',
    'YETİŞTİRİLECEK'
  ];

  useEffect(() => {
    if (show && cv) {
      fetchCVDetails();
    }
  }, [show, cv]);

  const fetchCVDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cvsService.getCVById(cv.id);
      if (response.success) {
        const cvData = response.data;
        setFormData({
          adi: cvData.adi || '',
          soyadi: cvData.soyadi || '',
          email: cvData.email || '',
          telefon: cvData.telefon || '',
          meslek: cvData.meslek || '',
          adres: cvData.adres || '',
          durum: cvData.durum || 'İŞ ARIYOR',
          notlar: cvData.notlar || '',
          referans: cvData.referans || []
        });
        
        // Referans verilerini input formatına çevir
        if (cvData.referans) {
          try {
            let referansListesi;
            if (typeof cvData.referans === 'object') {
              referansListesi = cvData.referans;
            } else if (typeof cvData.referans === 'string') {
              referansListesi = JSON.parse(cvData.referans);
            }
            
            if (Array.isArray(referansListesi) && referansListesi.length > 0) {
              setReferansInputs(referansListesi);
            }
          } catch (e) {
            console.log('Referans parse hatası:', e);
          }
        }
      } else {
        setError('CV bilgileri yüklenemedi.');
      }
    } catch (error) {
      console.error('CV detayları yüklenirken hata:', error);
      setError('CV bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReferansChange = (index, field, value) => {
    const newReferansInputs = [...referansInputs];
    newReferansInputs[index][field] = value;
    setReferansInputs(newReferansInputs);
  };

  const addReferans = () => {
    setReferansInputs([...referansInputs, { isim: '', meslek: '', telefon: '' }]);
  };

  const removeReferans = (index) => {
    if (referansInputs.length > 1) {
      const newReferansInputs = referansInputs.filter((_, i) => i !== index);
      setReferansInputs(newReferansInputs);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Referans verilerini filtrele ve hazırla
      const validReferanslar = referansInputs.filter(ref => 
        ref.isim.trim() !== '' || ref.meslek.trim() !== '' || ref.telefon.trim() !== ''
      );
      
      const submitData = {
        ...formData,
        referans: validReferanslar.length > 0 ? JSON.stringify(validReferanslar) : null
      };
      
      const response = await cvsService.updateCV(cv.id, submitData);
      
      if (response.success) {
        onCVUpdated && onCVUpdated();
        handleClose();
      } else {
        setError(response.message || 'CV güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('CV güncelleme hatası:', error);
      setError('CV güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      adi: '',
      soyadi: '',
      email: '',
      telefon: '',
      meslek: '',
      adres: '',
      durum: 'İŞ ARIYOR',
      notlar: '',
      referans: []
    });
    setReferansInputs([{ isim: '', meslek: '', telefon: '' }]);
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="edit-cv-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          CV Düzenle
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">CV bilgileri yükleniyor...</div>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="danger" className="mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ad *</Form.Label>
                  <Form.Control
                    type="text"
                    name="adi"
                    value={formData.adi}
                    onChange={handleInputChange}
                    required
                    placeholder="Adını giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Soyad *</Form.Label>
                  <Form.Control
                    type="text"
                    name="soyadi"
                    value={formData.soyadi}
                    onChange={handleInputChange}
                    required
                    placeholder="Soyadını giriniz"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="email@example.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleInputChange}
                    placeholder="0555 123 45 67"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Meslek *</Form.Label>
                  <Form.Control
                    type="text"
                    name="meslek"
                    value={formData.meslek}
                    onChange={handleInputChange}
                    required
                    placeholder="Mesleğini giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Durum</Form.Label>
                  <Form.Select
                    name="durum"
                    value={formData.durum}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Adres</Form.Label>
                  <Form.Control
                    type="text"
                    name="adres"
                    value={formData.adres}
                    onChange={handleInputChange}
                    placeholder="Adresini giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
              </Col>
            </Row>
            
            {/* Referanslar */}
            <div className="mb-3">
              <Form.Label className="d-flex align-items-center justify-content-between">
                <span>Referanslar</span>
                <Button 
                  type="button" 
                  variant="outline-primary" 
                  size="sm"
                  onClick={addReferans}
                >
                  <i className="fas fa-plus me-1"></i>
                  Referans Ekle
                </Button>
              </Form.Label>
              
              {referansInputs.map((referans, index) => (
                <div key={index} className="referans-input-group">
                  <Row className="align-items-end">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>İsim</Form.Label>
                        <Form.Control
                          type="text"
                          value={referans.isim}
                          onChange={(e) => handleReferansChange(index, 'isim', e.target.value)}
                          placeholder="Referans kişi adı"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Meslek</Form.Label>
                        <Form.Control
                          type="text"
                          value={referans.meslek}
                          onChange={(e) => handleReferansChange(index, 'meslek', e.target.value)}
                          placeholder="Meslek"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Telefon</Form.Label>
                        <Form.Control
                          type="tel"
                          value={referans.telefon}
                          onChange={(e) => handleReferansChange(index, 'telefon', e.target.value)}
                          placeholder="Telefon"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      {referansInputs.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => removeReferans(index)}
                          className="mb-3"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      )}
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Notlar</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notlar"
                value={formData.notlar}
                onChange={handleInputChange}
                placeholder="Ek notlar..."
              />
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          İptal
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={submitting || loading}
        >
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Güncelleniyor...
            </>
          ) : (
            <>
              <i className="fas fa-save me-2"></i>
              Güncelle
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditCVModal;