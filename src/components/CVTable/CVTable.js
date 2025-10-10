import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Button, Form, Row, Col, Pagination, Modal } from "react-bootstrap";
import { createPortal } from 'react-dom';
import { useNavigate } from "react-router-dom";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { cvsService } from "../../services/cvsService";
import { fetchAllCategoriesForDropdown } from "../../services/categoriesService";
import { smsService } from "../../services/smsService";
import { ilceler, getMahalleler } from "../../data/istanbulData";
import AddCVModal from "../AddCVModal/AddCVModal";
import ViewCVModal from "../ViewCVModal/ViewCVModal";
import EditCVModal from "../EditCVModal/EditCVModal";
import DeleteCVModal from "../DeleteCVModal/DeleteCVModal";
import ShowCVModal from "../ShowCVModal/ShowCVModal";
import ExcelImportModal from "../ExcelImportModal/ExcelImportModal";
import * as XLSX from 'xlsx';
import "./CVTable.css";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CVTable = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useSimpleToast();
  
  // Refs
  const tableWrapperRef = useRef(null);
  
  // State tanımlamaları
  const [cvs, setCvs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cvsPerPage] = useState(14);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCvs, setSelectedCvs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Scrollbar state'leri
  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const [scrollbarLeft, setScrollbarLeft] = useState(0);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // Modal state'leri
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [bulkSMSLoading, setBulkSMSLoading] = useState(false);
  // Portal menüye geçildi, açık dropdown state'i gereksiz

  // API'den CV'leri getir
  const fetchCvs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: cvsPerPage,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      };

      const response = await cvsService.getCVs(params);

      if (response.success) {
        setCvs(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.pagination.total);
      }
    } catch (error) {
      showError("CV'ler yüklenirken hata oluştu");
      setCvs([]);
    } finally {
      setLoading(false);
    }
  };

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      const response = await cvsService.getCategories();
      if (response.success) {
        setCategories(["TÜMÜ", ...response.data]);
      }
    } catch (error) {
      showError("Kategoriler yüklenirken hata oluştu");
      setCategories(["TÜMÜ"]);
    }
  };

  // Tüm kategorileri ve alt kategorileri getir (messaging modal için)
  const fetchAllCategories = async () => {
    try {
      const response = await fetchAllCategoriesForDropdown();
      if (response.success) {
        setAllCategories(response.data);
      }
    } catch (error) {
      showError("Tüm kategoriler yüklenirken hata oluştu");
      setAllCategories([]);
    }
  };

  // Component mount edildiğinde kategorileri yükle
  useEffect(() => {
    fetchCategories();
    fetchAllCategories();
  }, []);

  // Sayfa veya debounced arama terimi değiştiğinde CV'leri yükle
  useEffect(() => {
    fetchCvs();
  }, [currentPage, debouncedSearchTerm]);

  // Özel scrollbar logic'i
  useEffect(() => {
    const updateScrollbar = () => {
      if (!tableWrapperRef.current) return;

      const wrapper = tableWrapperRef.current;
      const table = wrapper.querySelector('.cvs-table');
      
      if (!table) return;

      const wrapperWidth = wrapper.clientWidth;
      const tableWidth = table.scrollWidth;
      const scrollLeft = wrapper.scrollLeft;
      const maxScroll = tableWidth - wrapperWidth;

      console.log('Scrollbar Debug:', {
        wrapperWidth,
        tableWidth,
        scrollLeft,
        maxScroll,
        shouldShow: tableWidth > wrapperWidth
      });

      // Scrollbar görünürlüğü
      const shouldShow = tableWidth > wrapperWidth;
      setScrollbarVisible(shouldShow);

      if (shouldShow) {
        // Scrollbar genişliği (wrapper genişliğinin oranı)
        const thumbWidth = Math.max(30, (wrapperWidth / tableWidth) * wrapperWidth);
        setScrollbarWidth(thumbWidth);

        // Scrollbar pozisyonu - Bu kısım çok önemli!
        const thumbLeft = maxScroll > 0 ? (scrollLeft / maxScroll) * (wrapperWidth - thumbWidth) : 0;
        console.log('Updating thumb position:', {
          scrollLeft,
          maxScroll,
          thumbLeft,
          thumbWidth,
          wrapperWidth
        });
        setScrollbarLeft(thumbLeft);
      }
    };

    // Scroll event listener'ı ekle
    const handleScroll = () => {
      updateScrollbar();
    };

    const wrapper = tableWrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', updateScrollbar);
      
      // İlk yükleme - biraz gecikme ile
      setTimeout(updateScrollbar, 100);
      
      // Tablo içeriği değiştiğinde de güncelle
      const observer = new MutationObserver(() => {
        setTimeout(updateScrollbar, 50);
      });
      observer.observe(wrapper, { childList: true, subtree: true });

      return () => {
        wrapper.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', updateScrollbar);
        observer.disconnect();
      };
    }
  }, [cvs]);

  // Scrollbar thumb drag işlemleri
  const handleScrollbarMouseDown = (e) => {
    console.log('Scrollbar mousedown triggered');
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startLeft = scrollbarLeft;
    const wrapper = tableWrapperRef.current;
    
    if (!wrapper) {
      console.log('No wrapper found');
      return;
    }

    const wrapperWidth = wrapper.clientWidth;
    const table = wrapper.querySelector('.cvs-table');
    
    if (!table) {
      console.log('No table found');
      return;
    }
    
    const maxScroll = table.scrollWidth - wrapperWidth;
    const maxThumbLeft = wrapperWidth - scrollbarWidth;

    console.log('Drag values:', {
      startX,
      startLeft,
      wrapperWidth,
      maxScroll,
      maxThumbLeft,
      scrollbarWidth
    });

    const handleMouseMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const deltaX = e.clientX - startX;
      const newThumbLeft = Math.max(0, Math.min(maxThumbLeft, startLeft + deltaX));
      
      console.log('Mouse move:', {
        deltaX,
        newThumbLeft,
        clientX: e.clientX
      });
      
      if (maxThumbLeft > 0) {
        const scrollRatio = newThumbLeft / maxThumbLeft;
        const newScrollLeft = scrollRatio * maxScroll;
        console.log('Setting scroll to:', newScrollLeft);
        
        // Scroll işlemini zorla yap
        wrapper.scrollLeft = newScrollLeft;
        
        // Eğer scroll çalışmıyorsa, table'ı transform ile kaydır
        const table = wrapper.querySelector('.cvs-table');
        if (table && wrapper.scrollLeft !== newScrollLeft) {
          console.log('Fallback: Using transform');
          table.style.transform = `translateX(-${newScrollLeft}px)`;
          
          // Transform kullanıldığında scrollbar pozisyonunu manuel güncelle
          const wrapperWidth = wrapper.clientWidth;
          const maxThumbLeft = wrapperWidth - scrollbarWidth;
          const newThumbLeft = maxThumbLeft > 0 ? (newScrollLeft / maxScroll) * maxThumbLeft : 0;
          console.log('Manual thumb update:', newThumbLeft);
          setScrollbarLeft(newThumbLeft);
        } else if (table) {
          // Normal scroll çalışıyorsa transform'u temizle
          table.style.transform = '';
        }
      }
    };

    const handleMouseUp = () => {
      console.log('Mouse up');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Scrollbar track click işlemi
  const handleScrollbarTrackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const wrapperWidth = wrapper.clientWidth;
    const table = wrapper.querySelector('.cvs-table');
    
    if (!table) return;
    
    const maxScroll = table.scrollWidth - wrapperWidth;
    const maxThumbLeft = wrapperWidth - scrollbarWidth;
    
    if (maxThumbLeft > 0) {
      const targetThumbLeft = Math.max(0, Math.min(maxThumbLeft, clickX - scrollbarWidth / 2));
      const scrollRatio = targetThumbLeft / maxThumbLeft;
      const newScrollLeft = scrollRatio * maxScroll;
      
      console.log('Track click - Setting scroll to:', newScrollLeft);
      wrapper.scrollLeft = newScrollLeft;
      
      // Eğer scroll çalışmıyorsa, table'ı transform ile kaydır
       if (wrapper.scrollLeft !== newScrollLeft) {
         console.log('Track click - Fallback: Using transform');
         table.style.transform = `translateX(-${newScrollLeft}px)`;
         
         // Transform kullanıldığında scrollbar pozisyonunu manuel güncelle
         const maxThumbLeft = wrapperWidth - scrollbarWidth;
         const newThumbLeft = maxThumbLeft > 0 ? (newScrollLeft / maxScroll) * maxThumbLeft : 0;
         console.log('Track click - Manual thumb update:', newThumbLeft);
         setScrollbarLeft(newThumbLeft);
       } else {
         // Normal scroll çalışıyorsa transform'u temizle
         table.style.transform = '';
       }
    }
  };

  // Arama terimi değiştiğinde sayfa numarasını sıfırla
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Arama değiştiğinde hemen ilk sayfaya dön
  };

  // Mevcut sayfa kontakları (API'den gelen veriler zaten sayfalanmış)
  const currentCvs = cvs;

  // Modal işlemleri
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCVAdded = async (formData) => {
    try {
      // Eğer formData varsa (yeni CV ekleme), createCV kullan
      if (formData) {
        const response = await cvsService.createCV(formData);
        if (response.success) {
          showSuccess('CV başarıyla eklendi!');
          setShowAddModal(false);
          fetchCvs(); // Yeni CV eklendikten sonra listeyi yenile
        } else {
          showError(response.message || 'CV eklenirken bir hata oluştu');
        }
      } else {
        // formData yoksa (CV güncelleme), sadece listeyi yenile
        showSuccess('CV başarıyla güncellendi!');
        fetchCvs();
      }
    } catch (error) {
      console.error('CV ekleme hatası:', error);
      showError('CV eklenirken bir hata oluştu');
    }
  };

  // Durum değiştirme fonksiyonu
  const handleStatusChange = async (cvId, newStatus) => {
    try {
      console.log('Frontend - handleStatusChange çağrıldı:', { cvId, newStatus });
      
      const response = await cvsService.updateCVStatus(cvId, newStatus);
      
      console.log('Frontend - API response:', response);

      if (response.success) {
        // CV listesini güncelle
        setCvs(prevCvs => 
          prevCvs.map(cv => 
            cv.id === cvId ? { ...cv, durum: newStatus } : cv
          )
        );
        showSuccess('CV durumu başarıyla güncellendi');
      } else {
        showError(response.message || 'Durum güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      showError('Durum güncellenirken bir hata oluştu');
    }
  };

  // Durum badge renkleri
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'İŞ ARIYOR':
        return 'status-is-ariyor';
      case 'YÖNLENDİRİLDİ':
        return 'status-yonlendirildi';
      case 'İŞE YERLEŞTİRİLDİ':
        return 'status-ise-yerlestirildi';
      case 'BEKLEMEDE':
        return 'status-beklemede';
      case 'İŞ BULUNDU':
        return 'status-is-bulundu';
      default:
        return 'status-default';
    }
  };

  // Durum seçenekleri
  const statusOptions = [
    'İŞ ARIYOR',
    'YÖNLENDİRİLDİ',
    'İŞE YERLEŞTİRİLDİ',
    'BEKLEMEDE',
    'İŞ BULUNDU'
  ];

  // Modal işlem fonksiyonları
  const handleViewCV = (cv) => {
    setSelectedCV(cv);
    setShowViewModal(true);
  };

  const handleEditCV = (cv) => {
    setSelectedCV(cv);
    setShowEditModal(true);
  };

  const handleDeleteCV = (cv) => {
    setSelectedCV(cv);
    setShowDeleteModal(true);
  };

  const handleShowCV = (cv) => {
    setSelectedCV(cv);
    setShowCVModal(true);
  };

  const handleWhatsAppMessage = (cv) => {
    const phones = [];
    if (cv.phone1) phones.push(cv.phone1);
    if (cv.phone2) phones.push(cv.phone2);

    if (phones.length === 0) {
      showWarning("Bu kişinin kayıtlı telefon numarası bulunmamaktadır.");
      return;
    }

    if (phones.length === 1) {
      // Tek numara varsa direkt WhatsApp'a yönlendir
      openWhatsApp(phones[0]);
    } else {
      // Birden fazla numara varsa modal aç
      setSelectedCV(cv);
      setShowCVModal(true);
    }
  };

  const openWhatsApp = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Sadece rakamları al
    const whatsappUrl = `https://wa.me/90${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneSelect = (phoneNumber) => {
    openWhatsApp(phoneNumber);
  };

  // Excel export fonksiyonu
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      
      // Tüm kişileri al (sayfalama olmadan)
       const response = await cvsService.getCVs({
         limit: 10000, // Çok büyük bir sayı ile tüm kayıtları al
         ...(debouncedSearchTerm && { search: debouncedSearchTerm })
       });

      if (!response.success || !response.data) {
        showError('Veriler alınırken bir hata oluştu.');
        return;
      }

      // Excel için veri formatını hazırla
      const excelData = response.data.map((contact, index) => ({
        'SIRA': index + 1,
        'ADI': contact.name || '',
        'SOYADI': contact.surname || '',
        'TC KİMLİK': contact.tc_number || '',
        'KATEGORİ': contact.category_name || '',
        'TELEFON 1': contact.phone1 || '',
        'TELEFON 2': contact.phone2 || '',
        'ÜNVAN': contact.title || '',
        'MAHALLE': contact.neighborhood || '',
        'İLÇE': contact.district || '',
        'ADRES': contact.address || '',
        'E-POSTA': contact.email || '',
        'DOĞUM TARİHİ': contact.birth_date || '',
        'CİNSİYET': contact.gender === 'male' ? 'Erkek' : contact.gender === 'female' ? 'Kadın' : '',
        'NOTLAR': contact.notes || '',
        'OLUŞTURMA TARİHİ': contact.created_at ? new Date(contact.created_at).toLocaleDateString('tr-TR') : ''
      }));

      // Excel workbook oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kişiler');

      // Sütun genişliklerini ayarla
      const columnWidths = [
        { wch: 8 },  // SIRA
        { wch: 15 }, // ADI
        { wch: 15 }, // SOYADI
        { wch: 15 }, // TC KİMLİK
        { wch: 20 }, // KATEGORİ
        { wch: 15 }, // TELEFON 1
        { wch: 15 }, // TELEFON 2
        { wch: 20 }, // ÜNVAN
        { wch: 20 }, // MAHALLE
        { wch: 15 }, // İLÇE
        { wch: 30 }, // ADRES
        { wch: 25 }, // E-POSTA
        { wch: 15 }, // DOĞUM TARİHİ
        { wch: 10 }, // CİNSİYET
        { wch: 30 }, // NOTLAR
        { wch: 18 }  // OLUŞTURMA TARİHİ
      ];
      worksheet['!cols'] = columnWidths;

      // Dosya adını oluştur
      const fileName = `Telefon_Rehberi_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`;
      
      // Excel dosyasını indir
      XLSX.writeFile(workbook, fileName);
      
      showSuccess(`${response.data.length} kişi başarıyla Excel dosyasına aktarıldı.`);
      
    } catch (error) {
      showError('Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Dropdown state kaldırıldı (portal menü kullanılıyor)



  const handleContactUpdated = () => {
    fetchCvs(); // CV güncellendikten sonra listeyi yenile
  };

  const handleContactDeleted = () => {
    fetchCvs(); // CV silindikten sonra listeyi yenile
  };

  const closeAllModals = () => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowCVModal(false);
    setShowExcelImportModal(false);
    setSelectedCV(null);
  };

  // Excel import modal fonksiyonları
  const handleShowExcelImportModal = () => {
    setShowExcelImportModal(true);
  };

  const handleExcelImportComplete = () => {
    fetchCvs(); // Yeni veriler eklendikten sonra listeyi yenile
  };



  // Sayfa değiştirme
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Checkbox işlemleri
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    if (isChecked) {
      setSelectedCvs(currentCvs.map((cv) => cv.id));
    } else {
      setSelectedCvs([]);
    }
  };

  const handleSelectCV = (cvId) => {
    setSelectedCvs((prev) => {
      if (prev.includes(cvId)) {
        return prev.filter((id) => id !== cvId);
      } else {
        return [...prev, cvId];
      }
    });
  };

  // SelectAll checkbox durumunu güncelle
  useEffect(() => {
    if (selectedCvs.length === 0) {
      setSelectAll(false);
    } else if (selectedCvs.length === currentCvs.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedCvs, currentCvs]);



  return (
    <div className="cvs-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
           <img style={{width: '35px', height: '35px'}} src="/assets/images/cv.png" alt="contact" />
          </div>
          <h2 className="header-title">CV BANK</h2>
        </div>

        {/* Arama Kutusu - Ortada */}
        <div className="header-center">
          <div className="search-container">
            <Form.Control
              type="text"
              placeholder="Ad, soyad, telefon veya kategori ile ara..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="header-right">
          <button
            className="header-btn"
            onClick={handleShowAddModal}
            title="Cv Ekle"
          >
            <svg width="40" height="40" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2Z" fill="#12B423"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M11 5C11 4.73478 10.8946 4.48043 10.7071 4.29289C10.5196 4.10536 10.2652 4 10 4C9.73478 4 9.48043 4.10536 9.29289 4.29289C9.10536 4.48043 9 4.73478 9 5V9H5C4.73478 9 4.48043 9.10536 4.29289 9.29289C4.10536 9.48043 4 9.73478 4 10C4 10.2652 4.10536 10.5196 4.29289 10.7071C4.48043 10.8946 4.73478 11 5 11H9V15C9 15.2652 9.10536 15.5196 9.29289 15.7071C9.48043 15.8946 9.73478 16 10 16C10.2652 16 10.5196 15.8946 10.7071 15.7071C10.8946 15.5196 11 15.2652 11 15V11H15C15.2652 11 15.5196 10.8946 15.7071 10.7071C15.8946 10.5196 16 10.2652 16 10C16 9.73478 15.8946 9.48043 15.7071 9.29289C15.5196 9.10536 15.2652 9 15 9H11V5Z" fill="#12B423"/>
</svg>


          </button>




        </div>
      </div>



      {/* Tablo */}
      <div className="table-wrapper" ref={tableWrapperRef}>
        <Table className="cvs-table">
          <thead>
            <tr>
              <th>
                <Form.Check
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="select-all-checkbox"
                />
              </th>
              <th>SIRA</th>
              <th>ADI</th>
              <th>SOYADI</th>
              <th>MESLEK</th>
              <th>REFERANS</th>
              <th>EMAIL</th>
              <th>DURUM</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Veriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : currentCvs.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir kayıt bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              currentCvs.map((cv, index) => (
                <tr key={cv.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedCvs.includes(cv.id)}
                      onChange={() => handleSelectCV(cv.id)}
                      className="cv-checkbox"
                    />
                  </td>
                  <td>{(currentPage - 1) * cvsPerPage + index + 1}</td>
                  <td>{cv.adi}</td>
                  <td>{cv.soyadi}</td>
                  <td>{cv.meslek || "-"}</td>
                  <td>
                    {(() => {
                      if (cv.referans) {
                        try {
                          let referansListesi;
                          
                          if (typeof cv.referans === 'object') {
                            referansListesi = cv.referans;
                          } else if (typeof cv.referans === 'string') {
                            referansListesi = JSON.parse(cv.referans);
                          }
                          
                          if (Array.isArray(referansListesi) && referansListesi.length > 0) {
                            return referansListesi.map(ref => ref.isim).join(', ');
                          }
                        } catch (e) {
                          console.log('Referans JSON parse hatası:', e, 'Veri:', cv.referans);
                        }
                      }
                      
                      return cv.referans_kisi || '-';
                    })()}
                  </td>
                  <td>{cv.email || "-"}</td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={cv.durum}
                      onChange={(e) => handleStatusChange(cv.id, e.target.value)}
                      className={`status-dropdown ${getStatusBadgeClass(cv.durum)}`}
                      style={{ 
                        fontSize: '12px', 
                        padding: '4px 8px',
                        minWidth: '50px',
                        minHeight: '40px',
                        border: 'none',
                        borderRadius: '20px',
                        fontWeight: '500',
                        color: 'white',
                        textAlign: 'center'
                      }}
                    >
                      <option value="İŞ ARIYOR">İŞ ARIYOR</option>
                      <option value="YÖNLENDİRİLDİ">YÖNLENDİRİLDİ</option>
                      <option value="İŞE YERLEŞTİRİLDİ">İŞE YERLEŞTİRİLDİ</option>
                      <option value="BEKLEMEDE">BEKLEMEDE</option>
                      <option value="İŞ BULUNDU">İŞ BULUNDU</option>
                    </Form.Select>
                  </td>
                  <td>
                    <CVActionMenu
                      onView={() => handleViewCV(cv)}
                      onEdit={() => handleEditCV(cv)}
                      onShowCV={() => handleShowCV(cv)}
                      onDelete={() => handleDeleteCV(cv)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Özel Yatay Scrollbar */}
      {scrollbarVisible && (
        <div className="custom-scrollbar-container">
          <div 
            className="custom-scrollbar-track" 
            onClick={handleScrollbarTrackClick}
          >
            <div
              className="custom-scrollbar-thumb"
              style={{
                width: `${scrollbarWidth}px`,
                left: `${scrollbarLeft}px`
              }}
              onMouseDown={handleScrollbarMouseDown}
            />
          </div>
        </div>
      )}

      {/* Alt Bilgi ve Sayfalama */}
      <div className="table-footer">
        <div className="total-records">
          TOPLAM {(totalRecords || 0).toLocaleString("tr-TR")} KİŞİ BULUNMAKTADIR
        </div>
        <div className="pagination-wrapper">
          <Pagination className="custom-pagination">
            <Pagination.First
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M9 2L4 6L9 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 2V10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Pagination.First>
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path
                  d="M6 2L2 6L6 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Pagination.Prev>

            {/* Sayfa numaraları */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum <= totalPages) {
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              }
              return null;
            })}

            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path
                  d="M2 2L6 6L2 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Pagination.Next>
            <Pagination.Last
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 2L8 6L3 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 2V10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Pagination.Last>
          </Pagination>
        </div>
      </div>

      {/* CV Ekleme Modal */}
      <AddCVModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onSubmit={handleCVAdded}
      />

      {/* CV Görüntüleme Modal */}
      <ViewCVModal
        show={showViewModal}
        onHide={closeAllModals}
        cv={selectedCV}
      />

      {/* CV Düzenleme Modal */}
      <EditCVModal
        show={showEditModal}
        onHide={closeAllModals}
        cv={selectedCV}
        onCVUpdated={handleCVAdded}
      />

      {/* CV Silme Modal */}
      <DeleteCVModal
        show={showDeleteModal}
        onHide={closeAllModals}
        cv={selectedCV}
        onCVDeleted={handleCVAdded}
      />

      {/* CV Gösterme Modal */}
      <ShowCVModal
        show={showCVModal}
        onHide={closeAllModals}
        cv={selectedCV}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        show={showExcelImportModal}
        onHide={closeAllModals}
        onImportComplete={handleExcelImportComplete}
      />
    </div>
  );
};

// Portal tabanlı CV aksiyon menüsü
const CVActionMenu = ({ onView, onEdit, onShowCV, onDelete }) => {
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 220) });
    setOpen((p) => !p);
  };

  const Item = ({ icon, color, label, onClick }) => (
    <div className="dropdown-item" onClick={() => { setOpen(false); onClick && onClick(); }} style={{ cursor: 'pointer', display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ width:14, height:14, display:'inline-flex' }}>
        {icon === 'view' && <svg width="14" height="14" viewBox="0 0 24 24" fill={color}><path d="M12 6a9.77 9.77 0 0 0-9 6 9.77 9.77 0 0 0 18 0 9.77 9.77 0 0 0-9-6Zm0 10a4 4 0 1 1 4-4 4.005 4.005 0 0 1-4 4Z"/></svg>}
        {icon === 'cv' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M5 5h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z"/></svg>}
        {icon === 'edit' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M2 10.667V13.333H4.66667L11.7333 6.26667L9.06667 3.6L2 10.667ZM13.2667 4.73333C13.5333 4.46667 13.5333 4.06667 13.2667 3.8L11.8667 2.4C11.6 2.13333 11.2 2.13333 10.9333 2.4L9.8 3.53333L12.4667 6.2L13.2667 5.4V4.73333Z"/></svg>}
        {icon === 'delete' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M6 2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V4H5.33333V3.33333C5.33333 2.96667 5.63333 2.66667 6 2.66667ZM4 4.66667V12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4Z"/></svg>}
      </span>
      {label}
    </div>
  );

  const menu = (
    <div ref={menuRef} className="user-actions-menu" style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2147483647, minWidth:220, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
      <Item icon="view" color="#4E0DCC" label="Görüntüle" onClick={onView} />
      <Item icon="cv" color="#F66700" label="CV Göster" onClick={onShowCV} />
      <div style={{height:1, background:'#f1f3f5', margin:'6px 0'}} />
      <Item icon="edit" color="#3B82F6" label="Düzenle" onClick={onEdit} />
      <Item icon="delete" color="#dc3545" label="Sil" onClick={onDelete} />
    </div>
  );

  return (
    <>
      <button ref={btnRef} onClick={toggle} className="action-menu-btn btn btn-outline-secondary btn-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && createPortal(menu, document.body)}
    </>
  );
};

export default CVTable;