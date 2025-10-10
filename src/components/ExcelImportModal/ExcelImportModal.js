import React, { useState, useRef } from 'react';
import { Modal, Button, Alert, ProgressBar } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { contactsService } from '../../services/contactsService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import './ExcelImportModal.css';

const ExcelImportModal = ({ show, onHide, onImportComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useSimpleToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      showError('Lütfen sadece Excel dosyası (.xlsx, .xls) seçin.');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      showError('Dosya boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }
    
    setFile(selectedFile);
    setImportResults(null);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const processExcelFile = async () => {
    if (!file) {
      showError('Lütfen bir dosya seçin.');
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showError('Excel dosyası boş veya geçersiz format.');
        setImporting(false);
        return;
      }

      setProgress(25);

      // Excel verilerini API formatına dönüştür
      const contactsData = jsonData.map((row, index) => {
        setProgress(25 + (index / jsonData.length) * 25);
        
        return {
          name: row['ADI'] || row['Ad'] || row['Name'] || '',
          surname: row['SOYADI'] || row['Soyad'] || row['Surname'] || '',
          tc_number: row['TC KİMLİK'] || row['TC'] || row['TC_NUMBER'] || '',
          phone1: row['TELEFON 1'] || row['Telefon1'] || row['Phone1'] || '',
          phone2: row['TELEFON 2'] || row['Telefon2'] || row['Phone2'] || '',
          email: row['E-POSTA'] || row['Email'] || row['E_POSTA'] || '',
          title: row['ÜNVAN'] || row['Unvan'] || row['Title'] || '',
          neighborhood: row['MAHALLE'] || row['Mahalle'] || row['Neighborhood'] || '',
          district: row['İLÇE'] || row['Ilce'] || row['District'] || '',
          address: row['ADRES'] || row['Adres'] || row['Address'] || '',
          birth_date: row['DOĞUM TARİHİ'] || row['Dogum_Tarihi'] || row['Birth_Date'] || '',
          gender: (() => {
            const genderValue = (row['CİNSİYET'] || row['Cinsiyet'] || '').toString().toUpperCase();
            if (genderValue === 'ERKEK' || genderValue === 'MALE' || genderValue === 'E' || genderValue === 'M') {
              return 'ERKEK';
            } else if (genderValue === 'KADIN' || genderValue === 'FEMALE' || genderValue === 'K' || genderValue === 'F') {
              return 'KADIN';
            }
            return '';
          })(),
          notes: row['NOTLAR'] || row['Notlar'] || row['Notes'] || '',
          category_id: 1 // Varsayılan kategori
        };
      });

      setProgress(50);

      // Verileri API'ye gönder
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < contactsData.length; i++) {
        try {
          setProgress(50 + (i / contactsData.length) * 50);
          
          const contact = contactsData[i];
          
          // Zorunlu alanları kontrol et
          if (!contact.name || !contact.surname) {
            errorCount++;
            errors.push(`Satır ${i + 2}: Ad ve Soyad zorunludur`);
            continue;
          }

          const response = await contactsService.createContact(contact);
          
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Satır ${i + 2}: ${response.message || 'Bilinmeyen hata'}`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`Satır ${i + 2}: ${error.message}`);
        }
      }

      setProgress(100);
      
      setImportResults({
        total: contactsData.length,
        success: successCount,
        error: errorCount,
        errors: errors.slice(0, 10) // İlk 10 hatayı göster
      });

      if (successCount > 0) {
        showSuccess(`${successCount} kişi başarıyla eklendi.`);
        onImportComplete();
      }
      
      if (errorCount > 0) {
        showError(`${errorCount} kişi eklenirken hata oluştu.`);
      }

    } catch (error) {
      console.error('Excel import hatası:', error);
      showError('Excel dosyası işlenirken hata oluştu: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setImporting(false);
    setProgress(0);
    setImportResults(null);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Excel şablonu indirme fonksiyonu
  const downloadTemplate = () => {
    // Şablon verisi
    const templateData = [
      {
        'ADI': 'Ahmet',
        'SOYADI': 'Yılmaz',
        'TC KİMLİK': '12345678901',
        'TELEFON 1': '05551234567',
        'TELEFON 2': '05559876543',
        'E-POSTA': 'ahmet.yilmaz@email.com',
        'ÜNVAN': 'Mühendis',
        'MAHALLE': 'Merkez Mahallesi',
        'İLÇE': 'Çankaya',
        'ADRES': 'Atatürk Caddesi No:123 Ankara',
        'DOĞUM TARİHİ': '1990-01-15',
        'CİNSİYET': 'ERKEK',
        'NOTLAR': 'Örnek not'
      },
      {
        'ADI': 'Ayşe',
        'SOYADI': 'Demir',
        'TC KİMLİK': '98765432109',
        'TELEFON 1': '05559876543',
        'TELEFON 2': '',
        'E-POSTA': 'ayse.demir@email.com',
        'ÜNVAN': 'Doktor',
        'MAHALLE': 'Yenişehir Mahallesi',
        'İLÇE': 'Mamak',
        'ADRES': 'İnönü Bulvarı No:456 Ankara',
        'DOĞUM TARİHİ': '1985-05-20',
        'CİNSİYET': 'KADIN',
        'NOTLAR': ''
      }
    ];

    // Excel dosyası oluştur
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kişiler');

    // Sütun genişliklerini ayarla
    const colWidths = [
      { wch: 15 }, // ADI
      { wch: 15 }, // SOYADI
      { wch: 15 }, // TC KİMLİK
      { wch: 15 }, // TELEFON 1
      { wch: 15 }, // TELEFON 2
      { wch: 25 }, // E-POSTA
      { wch: 15 }, // ÜNVAN
      { wch: 20 }, // MAHALLE
      { wch: 15 }, // İLÇE
      { wch: 30 }, // ADRES
      { wch: 15 }, // DOĞUM TARİHİ
      { wch: 10 }, // CİNSİYET
      { wch: 20 }  // NOTLAR
    ];
    ws['!cols'] = colWidths;

    // Dosyayı indir
    const fileName = 'Kisi_Listesi_Sablon.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  const handleClose = () => {
    resetModal();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Excel'den Kişi Aktar</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!importing && !importResults && (
          <>
            <div className="mb-4">
              <Alert variant="info" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Excel Formatı:</strong>
              <br />
              Doğru formatta veri içe aktarmak için örnek şablonu indirin.
            </div>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={downloadTemplate}
              className="ms-3"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="me-1">
                <path
                  d="M8 1V11M8 11L5.5 8.5M8 11L10.5 8.5M2.5 13.5H13.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Şablon İndir
            </Button>
          </div>
        </Alert>
            </div>

            <div 
              className={`excel-drop-zone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-zone-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h5>Excel Dosyasını Buraya Sürükleyin</h5>
                <p className="text-muted">veya dosya seçmek için tıklayın</p>
                <small className="text-muted">Desteklenen formatlar: .xlsx, .xls (Maksimum 10MB)</small>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>

            {file && (
              <div className="selected-file mt-3">
                <Alert variant="success">
                  <strong>Seçilen Dosya:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Alert>
              </div>
            )}
          </>
        )}

        {importing && (
          <div className="import-progress">
            <h5 className="mb-3">Excel dosyası işleniyor...</h5>
            <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
            <p className="text-muted">Lütfen bekleyin, veriler aktarılıyor...</p>
          </div>
        )}

        {importResults && (
          <div className="import-results">
            <Alert variant={importResults.error > 0 ? 'warning' : 'success'}>
              <h5>İçe Aktarma Tamamlandı</h5>
              <p>
                <strong>Toplam:</strong> {importResults.total} kayıt<br/>
                <strong>Başarılı:</strong> {importResults.success} kayıt<br/>
                <strong>Hatalı:</strong> {importResults.error} kayıt
              </p>
            </Alert>
            
            {importResults.errors.length > 0 && (
              <Alert variant="danger">
                <h6>Hatalar:</h6>
                <ul className="mb-0">
                  {importResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {importResults.error > 10 && (
                    <li><em>... ve {importResults.error - 10} hata daha</em></li>
                  )}
                </ul>
              </Alert>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          {importResults ? 'Kapat' : 'İptal'}
        </Button>
        {file && !importing && !importResults && (
          <Button variant="primary" onClick={processExcelFile}>
            İçe Aktar
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ExcelImportModal;