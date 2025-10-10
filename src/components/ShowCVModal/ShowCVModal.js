import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { cvsService, getProfileImageUrl } from '../../services/cvsService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import './ShowCVModal.css';

const ShowCVModal = ({ isOpen, onClose, cvId }) => {
  const { showError } = useSimpleToast();
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cvId) {
      fetchCVDetails();
    }
  }, [isOpen, cvId]);

  const fetchCVDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cvsService.getCVById(cvId);
      if (response.success) {
        setCv(response.data);
        // CV dosyası varsa dosyayı da yükle
        if (response.data.cv_dosyasi) {
          await loadCVFile(response.data.cv_dosyasi);
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

  const loadCVFile = async (filename) => {
    try {
      setFileLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/cvs/download/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Dosya yüklenemedi');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch (error) {
      console.error('CV dosyası yükleme hatası:', error);
      setError('CV dosyası yüklenirken bir hata oluştu.');
    } finally {
      setFileLoading(false);
    }
  };

  const handleClose = () => {
    setCv(null);
    setError(null);
    setFileUrl(null);
    setFileLoading(false);
    // Blob URL'i temizle
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date.toLocaleDateString('tr-TR') : '-';
  };

  const renderReferanslar = (referans) => {
    if (!referans) return [];
    
    try {
      let referansListesi;
      
      if (typeof referans === 'object') {
        referansListesi = referans;
      } else if (typeof referans === 'string') {
        referansListesi = JSON.parse(referans);
      }
      
      if (Array.isArray(referansListesi) && referansListesi.length > 0) {
        return referansListesi;
      }
    } catch (e) {
      console.log('Referans JSON parse hatası:', e);
    }
    
    return [];
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (fileUrl && cv && cv.cv_dosyasi) {
      try {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = cv.cv_dosyasi;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('İndirme hatası:', error);
        showError('Dosya indirilemedi.');
      }
    } else if (cv && cv.cv_dosyasi) {
      showError('Dosya henüz yüklenmedi, lütfen bekleyin.');
    } else {
      showError('Bu CV için dosya bulunamadı.');
    }
  };

  const handleOpenCVFile = () => {
    if (fileUrl) {
      // Dosyayı yeni sekmede aç
      window.open(fileUrl, '_blank');
    } else if (cv && cv.cv_dosyasi) {
      showError('Dosya henüz yüklenmedi, lütfen bekleyin.');
    } else {
      showError('Bu CV için dosya bulunamadı.');
    }
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" className="show-cv-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          CV Görüntüle
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">CV bilgileri yükleniyor...</div>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        ) : cv ? (
          cv.cv_dosyasi ? (
            // CV dosyası varsa direkt dosyayı göster
            <div className="cv-file-viewer">
              <div className="text-center mb-3">
              </div>
              
              <div className="cv-file-preview">
                 {fileLoading ? (
                   <div className="text-center py-5">
                     <Spinner animation="border" variant="primary" />
                     <div className="mt-2">CV dosyası yükleniyor...</div>
                   </div>
                 ) : fileUrl ? (
                   <iframe 
                     src={fileUrl}
                     style={{
                       width: '100%',
                       height: '800px',
                       border: '1px solid #ddd',
                       borderRadius: '8px'
                     }}
                     title="CV Önizleme"
                   />
                 ) : (
                   <div className="text-center py-5 text-muted">
                     <i className="fas fa-file-alt fa-3x mb-3"></i>
                     <div>CV dosyası yüklenemedi</div>
                   </div>
                 )}
               </div>
            </div>
          ) : (
            // CV dosyası yoksa tablo bilgilerini göster
            <div className="cv-document" id="cv-document">
            {/* CV Header */}
            <div className="cv-header">
              <div className="cv-header-content">
                <div className="cv-header-main">
                  {cv.profil_resmi && (
                    <div className="cv-profile-image">
                      <img 
                        src={getProfileImageUrl(cv.profil_resmi)} 
                        alt="Profil Resmi" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="cv-header-text">
                    <h1 className="cv-name">{cv.adi} {cv.soyadi}</h1>
                    <h2 className="cv-title">{cv.meslek}</h2>
                  </div>
                </div>
                <div className="cv-contact">
                  <div className="contact-item">
                    <i className="fas fa-envelope"></i>
                    <span>{cv.email}</span>
                  </div>
                  {cv.telefon && (
                    <div className="contact-item">
                      <i className="fas fa-phone"></i>
                      <span>{cv.telefon}</span>
                    </div>
                  )}
                  {cv.adres && (
                    <div className="contact-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{cv.adres}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CV Body */}
            <div className="cv-body">
              {/* Kişisel Bilgiler */}
              <div className="cv-section">
                <h3 className="section-title">
                  <i className="fas fa-user"></i>
                  Kişisel Bilgiler
                </h3>
                <div className="section-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Ad Soyad:</strong>
                      <span>{cv.adi} {cv.soyadi}</span>
                    </div>
                    {cv.yas && (
                      <div className="info-item">
                        <strong>Yaş:</strong>
                        <span>{cv.yas}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <strong>Email:</strong>
                      <span>{cv.email}</span>
                    </div>
                    {cv.telefon && (
                      <div className="info-item">
                        <strong>Telefon:</strong>
                        <span>{cv.telefon}</span>
                      </div>
                    )}
                    {cv.adres && (
                      <div className="info-item">
                        <strong>Adres:</strong>
                        <span>{cv.adres}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <strong>Durum:</strong>
                      <span className="status-badge">{cv.durum}</span>
                    </div>
                    <div className="info-item">
                      <strong>Kayıt Tarihi:</strong>
                      <span>{formatDate(cv.kayit_tarihi)}</span>
                    </div>
                    <div className="info-item">
                      <strong>Ekleyen:</strong>
                      <span>{cv.user_name || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meslek Bilgisi */}
              <div className="cv-section">
                <h3 className="section-title">
                  <i className="fas fa-briefcase"></i>
                  Meslek
                </h3>
                <div className="section-content">
                  <p className="profession">{cv.meslek}</p>
                </div>
              </div>

              {/* Referanslar */}
              {renderReferanslar(cv.referans).length > 0 && (
                <div className="cv-section">
                  <h3 className="section-title">
                    <i className="fas fa-users"></i>
                    Referanslar
                  </h3>
                  <div className="section-content">
                    <div className="referans-grid">
                      {renderReferanslar(cv.referans).map((ref, index) => (
                        <div key={index} className="referans-card">
                          <h4 className="referans-name">{ref.isim}</h4>
                          {ref.meslek && <p className="referans-job">{ref.meslek}</p>}
                          {ref.telefon && (
                            <p className="referans-phone">
                              <i className="fas fa-phone"></i>
                              {ref.telefon}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notlar */}
              {cv.notlar && (
                <div className="cv-section">
                  <h3 className="section-title">
                    <i className="fas fa-sticky-note"></i>
                    Notlar
                  </h3>
                  <div className="section-content">
                    <div className="notes-content">
                      {cv.notlar}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )
        ) : null}
      </Modal.Body>
      
      <Modal.Footer className="no-print">
        <div className="d-flex gap-2">
          {cv && cv.cv_dosyasi ? (
            // CV dosyası varsa sadece kapat butonu
            <Button variant="secondary" onClick={handleClose}>
              Kapat
            </Button>
          ) : (
            // CV dosyası yoksa yazdır ve PDF indir butonları
            <>
              <Button variant="outline-primary" onClick={handlePrint}>
                <i className="fas fa-print me-2"></i>
                Yazdır
              </Button>
              <Button variant="outline-success" onClick={handleDownloadPDF}>
                <i className="fas fa-download me-2"></i>
                PDF İndir
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Kapat
              </Button>
            </>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ShowCVModal;