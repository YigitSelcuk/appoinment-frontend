import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Button, Form, Row, Col, Pagination, Modal } from "react-bootstrap";
import { createPortal } from 'react-dom';
import { useNavigate } from "react-router-dom";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { useAuth } from "../../contexts/AuthContext";
import requestsService from "../../services/requestsService";
import { fetchAllCategoriesForDropdown } from "../../services/categoriesService";
import { smsService } from "../../services/smsService";
import { ilceler, getMahalleler } from "../../data/istanbulData";
import AddRequestModal from "../AddRequestModal/AddRequestModal";
import ViewRequestModal from "../ViewRequestModal/ViewRequestModal";
import EditRequestModal from "../EditRequestModal/EditRequestModal";
import DeleteRequestModal from "../DeleteRequestModal/DeleteRequestModal";
import RequestDetailsModal from "../RequestDetailsModal/RequestDetailsModal";
import ExcelImportModal from "../ExcelImportModal/ExcelImportModal";

import * as XLSX from 'xlsx';
import "./RequestsTable.css";

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

const RequestsTable = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useSimpleToast();
  const { accessToken } = useAuth();
  
  const tableWrapperRef = useRef(null);
  
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(14);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const [scrollbarLeft, setScrollbarLeft] = useState(0);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [bulkSMSLoading, setBulkSMSLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ role: '', department: '', isAdmin: false });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: requestsPerPage,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      };

      const response = await requestsService.getRequests(params, accessToken);

      if (response.success) {
        setRequests(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.total || 0);
        
        // UserInfo'yu set et
        if (response.userInfo) {
          setUserInfo(response.userInfo);
        }
      } else {
        setRequests([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      showError("Talepler yüklenirken hata oluştu");
      setRequests([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchAllCategoriesForDropdown();
      if (response.success) {
        // Alt kategorileri çıkar ve benzersiz hale getir
        const uniqueCategories = [...new Set(response.data.map(cat => cat.alt_kategori).filter(Boolean))];
        setCategories(["TÜMÜ", ...uniqueCategories]);
      }
    } catch (error) {
      showError("Kategoriler yüklenirken hata oluştu");
      setCategories(["TÜMÜ"]);
    }
  };

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

  useEffect(() => {
    fetchCategories();
    fetchAllCategories();
  }, []);

  // Sayfa veya debounced arama terimi değiştiğinde talepleri yükle
  useEffect(() => {
    fetchRequests();
  }, [currentPage, debouncedSearchTerm]);

  // Özel scrollbar logic'i
  useEffect(() => {
    const updateScrollbar = () => {
      if (!tableWrapperRef.current) return;

      const wrapper = tableWrapperRef.current;
      const table = wrapper.querySelector('.requests-table');
      
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
  }, [requests]);

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
    const table = wrapper.querySelector('.requests-table');
    
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
        const table = wrapper.querySelector('.requests-table');
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
    const table = wrapper.querySelector('.requests-table');
    
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
  const currentRequests = requests;

  // Modal işlemleri
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleRequestAdded = () => {
    fetchRequests(); // Yeni talep eklendikten sonra listeyi yenile
  };

  // Modal işlem fonksiyonları
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  const handleDeleteRequest = (request) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  const handleDetailsRequest = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleWhatsAppMessage = (request) => {
    const phones = [];
    if (request.phone1) phones.push(request.phone1);
    if (request.phone2) phones.push(request.phone2);

    if (phones.length === 0) {
      showWarning("Bu talebin kayıtlı telefon numarası bulunmamaktadır.");
      return;
    }

    if (phones.length === 1) {
      // Tek numara varsa direkt WhatsApp'a yönlendir
      openWhatsApp(phones[0]);
    } else {
      // Birden fazla numara varsa modal aç
      setSelectedRequest(request);
      setShowWhatsAppModal(true);
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
      
      // Tüm talepleri al (sayfalama olmadan)
      const response = await requestsService.getRequests({
        limit: 10000, // Çok büyük bir sayı ile tüm kayıtları al
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      }, accessToken);

      if (!response.success || !response.data) {
        showError('Veriler alınırken bir hata oluştu.');
        return;
      }

      // Excel için veri formatını hazırla
      const excelData = response.data.map((request, index) => ({
        'SIRA': index + 1,
        'ADI': request.name || '',
        'SOYADI': request.surname || '',
        'TC KİMLİK': request.tc_number || '',
        'KATEGORİ': request.category_name || '',
        'TELEFON 1': request.phone1 || '',
        'TELEFON 2': request.phone2 || '',
        'ÜNVAN': request.title || '',
        'MAHALLE': request.neighborhood || '',
        'İLÇE': request.district || '',
        'ADRES': request.address || '',
        'E-POSTA': request.email || '',
        'DOĞUM TARİHİ': request.birth_date || '',
        'CİNSİYET': request.gender === 'male' ? 'Erkek' : request.gender === 'female' ? 'Kadın' : '',
        'NOTLAR': request.notes || '',
        'OLUŞTURMA TARİHİ': request.created_at ? new Date(request.created_at).toLocaleDateString('tr-TR') : ''
      }));

      // Excel workbook oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Talepler');

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
      const fileName = `Talepler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`;
      
      // Excel dosyasını indir
      XLSX.writeFile(workbook, fileName);
      
      showSuccess(`${response.data.length} talep başarıyla Excel dosyasına aktarıldı.`);
      
    } catch (error) {
      showError('Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Dropdown state kaldırıldı (portal menü kullanılıyor)



  const handleRequestUpdated = () => {
    fetchRequests(); // Talep güncellendikten sonra listeyi yenile
  };

  const handleRequestDeleted = () => {
    fetchRequests(); // Talep silindikten sonra listeyi yenile
  };

  // Tarih formatlaması
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Tarih formatlaması hatası:', error);
      return 'N/A';
    }
  };

  // Talep süresi hesaplama
  const calculateRequestDuration = (createdAt) => {
    if (!createdAt) return 'N/A';
    
    try {
      const now = new Date();
      
      // Türkçe tarih formatını (dd.mm.yyyy hh:mm:ss) parse et
      let created;
      if (createdAt.includes('.') && createdAt.includes(' ')) {
        // "03.07.2025 14:30:45" formatı
        const [datePart, timePart] = createdAt.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hour, minute, second] = timePart.split(':');
        created = new Date(year, month - 1, day, hour, minute, second);
      } else {
        // ISO formatı veya diğer formatlar
        created = new Date(createdAt);
      }
      
      // Geçersiz tarih kontrolü
      if (isNaN(created.getTime())) {
        return 'Geçersiz tarih';
      }
      
      const diffMs = now - created;
      
      // Negatif süre kontrolü (gelecek tarih)
      if (diffMs < 0) {
        return 'Henüz başlamadı';
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days} gün ${hours} saat`;
      } else if (hours > 0) {
        return `${hours} saat ${minutes} dk`;
      } else if (minutes > 0) {
        return `${minutes} dakika`;
      } else {
        return 'Az önce';
      }
    } catch (error) {
      console.error('Tarih hesaplama hatası:', error, 'createdAt:', createdAt);
      return 'Hesaplanamadı';
    }
  };

  // Durum badge'i
  const getStatusBadge = (talepDurumu, durum) => {
    // Talep durumu renkleri (KRİTİK, NORMAL, DÜŞÜK)
    const talepDurumuConfig = {
      KRİTİK: { cssClass: "status-kritik", color: "#dc3545" },
      NORMAL: { cssClass: "status-normal", color: "#28a745" },
      DÜŞÜK: { cssClass: "status-dusuk", color: "#17a2b8" },
      "SEÇİNİZ": { cssClass: "status-default", color: "#6c757d" },
    };

    // Genel durum renkleri - Yeni durumlar eklendi
    const durumConfig = {
      DÜŞÜK: { cssClass: "status-dusuk", color: "#6c757d" },
      NORMAL: { cssClass: "status-normal", color: "#17a2b8" },
      ACİL: { cssClass: "status-acil", color: "#ffc107" },
      "ÇOK ACİL": { cssClass: "status-cok-acil", color: "#fd7e14" },
      KRİTİK: { cssClass: "status-kritik", color: "#dc3545" },
      TAMAMLANDI: { cssClass: "status-tamamlandi", color: "#28a745" },
      "İPTAL EDİLDİ": { cssClass: "status-iptal", color: "#6c757d" },
      // Eski durumlar da korunuyor
      BEKLEMEDE: { cssClass: "status-beklemede", color: "#ffc107" },
      İŞLEMDE: { cssClass: "status-islemde", color: "#fd7e14" },
      İPTAL: { cssClass: "status-iptal", color: "#6c757d" },
    };

    // Önce durum alanını kontrol et, yoksa talep durumunu kullan
    const displayStatus = durum || talepDurumu || 'DÜŞÜK';
    const config = durumConfig[displayStatus] || talepDurumuConfig[displayStatus] || {
      cssClass: "status-default",
      color: "#6c757d",
    };

    return (
      <span
        className={`badge custom-status-badge ${config.cssClass}`}
        style={{
          backgroundColor: config.color,
          color: "white",
          fontSize: "11px",
          fontWeight: "600",
          padding: "4px 8px",
          borderRadius: "4px",
          border: "none",
        }}
      >
        {displayStatus}
      </span>
    );
  };

  // Mevcut kullanıcının ID'sini al
  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
    setShowWhatsAppModal(false);
    setShowBulkSMSModal(false);
    setShowExcelImportModal(false);
    setSelectedRequest(null);
  };

  // Excel import modal fonksiyonları
  const handleShowExcelImportModal = () => {
    setShowExcelImportModal(true);
  };

  const handleExcelImportComplete = () => {
    fetchRequests(); // Yeni veriler eklendikten sonra listeyi yenile
  };

  // Toplu SMS gönderim modalını aç
  const handleShowBulkSMSModal = () => {
    if (selectedRequests.length === 0) {
      showWarning('Lütfen SMS göndermek için en az bir talep seçin.');
      return;
    }
    setShowBulkSMSModal(true);
  };

  // Toplu SMS gönder
  const handleBulkSMSSend = async (smsData) => {
    setBulkSMSLoading(true);
    try {
      // Seçili taleplerin telefon numaralarını topla
      const phoneNumbers = [];
      selectedRequests.forEach(requestId => {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          if (request.phone1) phoneNumbers.push(request.phone1);
          if (request.phone2) phoneNumbers.push(request.phone2);
        }
      });

      if (phoneNumbers.length === 0) {
        showWarning('Seçili taleplerde geçerli telefon numarası bulunamadı.');
        return;
      }

      const bulkSmsData = {
        phones: phoneNumbers,
        message: smsData.message,
        listName: smsData.listName || 'Toplu SMS',
        sendingTitle: smsData.sendingTitle || 'Rehber SMS',
        categoryName: 'Toplu Gönderim'
      };

      const result = await smsService.sendBulkSMS(bulkSmsData);

      if (result.success) {
        showSuccess(`Başarıyla ${result.data.sentCount} numaraya SMS gönderildi.`);
        setSelectedRequests([]); // Seçimleri temizle
        setSelectAll(false);
        closeAllModals();
      } else {
        showError('SMS gönderilemedi: ' + (result.error || result.message));
      }
    } catch (error) {
      showError('SMS gönderilirken bir hata oluştu: ' + error.message);
    } finally {
      setBulkSMSLoading(false);
    }
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
      setSelectedRequests(currentRequests.map((request) => request.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId) => {
    setSelectedRequests((prev) => {
      if (prev.includes(requestId)) {
        return prev.filter((id) => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  // SelectAll checkbox durumunu güncelle
  useEffect(() => {
    if (selectedRequests.length === 0) {
      setSelectAll(false);
    } else if (selectedRequests.length === currentRequests.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRequests, currentRequests]);



  return (
    <div className="requests-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
       <svg width="22" height="31" viewBox="0 0 22 31" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.1837 21.6114L17.761 19.1757C19.3247 16.2307 18.9283 12.5107 16.4616 10.0307C15.7467 9.30598 14.8957 8.73119 13.9581 8.33967C13.0205 7.94816 12.0149 7.74773 10.9996 7.75C10.9336 7.75 10.8675 7.77214 10.8014 7.77214L13.2021 10.1857L10.8675 12.5329L4.63468 6.26643L10.8675 0L13.2021 2.34714L11.0877 4.47286C13.8848 4.495 16.6598 5.53571 18.7962 7.66143C22.5403 11.4479 23.0028 17.3157 20.1837 21.6114ZM17.3646 24.7336L11.1318 31L8.79724 28.6529L10.8895 26.5493C8.01133 26.5267 5.25781 25.3653 3.22514 23.3164C1.43247 21.5122 0.313415 19.1417 0.0566492 16.6045C-0.200117 14.0674 0.421115 11.5188 1.8156 9.38857L4.23825 11.8243C2.67454 14.7693 3.07098 18.4893 5.53767 20.9693C7.07936 22.5193 9.1276 23.2721 11.1758 23.2057L8.79724 20.8143L11.1318 18.4671L17.3646 24.7336Z" fill="#3C02AA"/>
</svg>

          </div>
          <h2 className="header-title">
            {userInfo.department} - TALEPLER
          </h2>
        </div>

        <div className="header-center">
          <div className="search-input-container">
            <Form.Control
              type="text"
              placeholder="Taleplerde ara..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="header-search-input"
            />
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="header-clear-btn"
              title="Aramayı Temizle"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="header-right">
          <button
            className="add-request-btn"
            onClick={handleShowAddModal}
            title="Talep Ekle"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12ZM12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4Z"
                fill="#12B423"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13 7C13 6.73478 12.8946 6.48043 12.7071 6.29289C12.5196 6.10536 12.2652 6 12 6C11.7348 6 11.4804 6.10536 11.2929 6.29289C11.1054 6.48043 11 6.73478 11 7V11H7C6.73478 11 6.48043 11.1054 6.29289 11.2929C6.10536 11.4804 6 11.7348 6 12C6 12.2652 6.10536 12.5196 6.29289 12.7071C6.48043 12.8946 6.73478 13 7 13H11V17C11 17.2652 11.1054 17.5196 11.2929 17.7071C11.4804 17.8946 11.7348 18 12 18C12.2652 18 12.5196 17.8946 12.7071 17.7071C12.8946 17.5196 13 17.2652 13 17V13H17C17.2652 13 17.5196 12.8946 17.7071 12.7071C17.8946 12.5196 18 12.2652 18 12C18 11.7348 17.8946 11.4804 17.7071 11.2929C17.5196 11.1054 17.2652 11 17 11H13V7Z"
                fill="#12B423"
              />
            </svg>

            <span>TALEP EKLE</span>
          </button>

       
     
        </div>
      </div>



      {/* Tablo */}
      <div className="table-wrapper" ref={tableWrapperRef}>
        <Table className="requests-table">
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
              <th>TARİH</th>
              <th>BAŞLIK</th>
              <th>TALEP EDEN</th>
              <th className="contact-header">İLETİŞİM</th>
              <th>İLGİLİ BİRİM</th>
              <th>DURUM</th>
              <th>TALEP SÜRESİ</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Talepler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : currentRequests.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir talep bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              currentRequests.map((request, index) => (
                <tr key={request.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedRequests.includes(request.id)}
                      onChange={() => handleSelectRequest(request.id)}
                      className="request-checkbox"
                    />
                  </td>
                  <td>{(currentPage - 1) * requestsPerPage + index + 1}</td>
                  <td>{request.created_at_display?.split(' ')[0] || formatDate(request.created_at) || 'N/A'}</td>
                  <td className="request-title">{request.talep_basligi || 'Başlık Yok'}</td>
                  <td className="requester-name">{`${request.ad} ${request.soyad}`}</td>
                  <td className="contact-info">{request.telefon || 'N/A'}</td>
                  <td className="related-unit">{request.ilgili_mudurluk || 'N/A'}</td>
                  <td>{getStatusBadge(request.talep_durumu, request.durum)}</td>
                  <td className="request-duration">{calculateRequestDuration(request.created_at_display || request.created_at)}</td>
                  <td>
                    <RequestActionMenu
                      request={request}
                      onView={() => handleViewRequest(request)}
                      onDetails={() => handleDetailsRequest(request)}
                      onEdit={() => handleEditRequest(request)}
                      onDelete={() => handleDeleteRequest(request)}
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
          TOPLAM {totalRecords?.toLocaleString("tr-TR") || 0} TALEP BULUNMAKTADIR
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

      {/* Kişi Ekleme Modal */}
      <AddRequestModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onRequestAdded={handleRequestAdded}
        categories={categories}
      />

      {/* Kişi Görüntüleme Modal */}
      <ViewRequestModal
        show={showViewModal}
        onHide={closeAllModals}
        request={selectedRequest}
      />

      {/* Kişi Düzenleme Modal */}
      <EditRequestModal
        show={showEditModal}
        onHide={closeAllModals}
        request={selectedRequest}
        onRequestUpdated={handleRequestUpdated}
        categories={categories}
      />

      {/* Kişi Silme Modal */}
      <DeleteRequestModal
        show={showDeleteModal}
        onHide={closeAllModals}
        request={selectedRequest}
        onRequestDeleted={handleRequestDeleted}
      />

      {/* Talep Detayları Modal */}
      <RequestDetailsModal
        show={showDetailsModal}
        onHide={closeAllModals}
        request={selectedRequest}
      />

      {/* Toplu SMS Modal */}
      {showBulkSMSModal && (
        <BulkSMSModal
          show={showBulkSMSModal}
          onHide={closeAllModals}
          selectedCount={selectedRequests.length}
          onSend={handleBulkSMSSend}
          loading={bulkSMSLoading}
          showError={showError}
        />
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        show={showExcelImportModal}
        onHide={closeAllModals}
        onImportComplete={handleExcelImportComplete}
      />


    </div>
  );
};

// Toplu SMS Modal Bileşeni
const BulkSMSModal = ({ show, onHide, selectedCount, onSend, loading, showError }) => {
  const [message, setMessage] = useState('');
  const [listName, setListName] = useState('');
  const [sendingTitle, setSendingTitle] = useState('');

  const handleSend = () => {
    if (!message.trim()) {
      showError('Lütfen mesaj yazın.');
      return;
    }
    if (!listName.trim()) {
      showError('Lütfen liste adını girin.');
      return;
    }
    if (!sendingTitle.trim()) {
      showError('Lütfen gönderim başlığını girin.');
      return;
    }

    onSend({
      message: message.trim(),
      listName: listName.trim(),
      sendingTitle: sendingTitle.trim()
    });
  };

  const handleClose = () => {
    setMessage('');
    setListName('');
    setSendingTitle('');
    onHide();
  };

  // Modal açıldığında body scroll'unu engelle
  React.useEffect(() => {
    if (show) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [show]);

  if (!show) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="bulk-sms-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="me-2">
            <path
              d="M2 6L10 11L18 6M2 14L10 19L18 14M2 6L10 1L18 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Toplu SMS Gönder ({selectedCount} talep)
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label htmlFor="listName" className="form-label">Liste Adı</label>
          <input
            type="text"
            className="form-control"
            id="listName"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Örn: Müşteri Listesi"
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="sendingTitle" className="form-label">Gönderim Başlığı</label>
          <input
            type="text"
            className="form-control"
            id="sendingTitle"
            value={sendingTitle}
            onChange={(e) => setSendingTitle(e.target.value)}
            placeholder="Örn: Kampanya Duyurusu"
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="message" className="form-label">
            Mesaj İçeriği
            <span className="text-muted">({message.length}/160 karakter)</span>
          </label>
          <textarea
            className="form-control"
            id="message"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="SMS mesajınızı buraya yazın..."
            maxLength="160"
            disabled={loading}
          />
        </div>


      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClose}
          disabled={loading}
        >
          İptal
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={handleSend}
          disabled={loading || !message.trim() || !listName.trim() || !sendingTitle.trim()}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Gönderiliyor...
            </>
          ) : (
            `SMS Gönder (${selectedCount} talep)`
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default RequestsTable;

// Portal menu similar to UsersTable ActionMenu
const RequestActionMenu = ({ request, onView, onEdit, onDelete, onDetails }) => {
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

  const Item = ({ icon, color, label, onClick, hidden }) => {
    if (!onClick || hidden) return null;
    return (
      <div className="dropdown-item" onClick={() => { setOpen(false); onClick(); }} style={{ cursor: 'pointer', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:14, height:14, display:'inline-flex' }}>
          {icon === 'view' && <svg width="14" height="14" viewBox="0 0 24 24" fill={color}><path d="M12 6a9.77 9.77 0 0 0-9 6 9.77 9.77 0 0 0 18 0 9.77 9.77 0 0 0-9-6Zm0 10a4 4 0 1 1 4-4 4.005 4.005 0 0 1-4 4Z"/></svg>}
          {icon === 'info' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>}
          {icon === 'check' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>}
          {icon === 'message' && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.334 8L2.927 4.375c-.118-1.036.89-1.773 1.847-1.35l8.06 3.558c1.06.468 1.06 1.889 0 2.357l-8.06 3.558c-.957.423-1.965-.314-1.847-1.35L3.334 8zm0 0h4.833" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          {icon === 'edit' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M2 10.667V13.333H4.66667L11.7333 6.26667L9.06667 3.6L2 10.667ZM13.2667 4.73333C13.5333 4.46667 13.5333 4.06667 13.2667 3.8L11.8667 2.4C11.6 2.13333 11.2 2.13333 10.9333 2.4L9.8 3.53333L12.4667 6.2L13.2667 5.4V4.73333Z"/></svg>}
          {icon === 'refresh' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>}
          {icon === 'history' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1.001.025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-1.548 1.7c.27-.216.518-.447.747-.691l.789.616c-.297.379-.632.734-1.005 1.058l-.531-.983zm-2.137.796c.363-.121.704-.264 1.025-.424l.448.894c-.42.196-.861.353-1.315.463l-.158-.933zm-2.49.059c.339-.003.677-.015 1.014-.043l.075.997a8.46 8.46 0 0 1-1.114.043l.025-1.001zm-2.51-.212c.37.072.746.117 1.126.137l-.075.997c-.421-.023-.84-.071-1.254-.145l.203-.989zm-2.37-.71c.264.095.537.176.816.242l-.203.989c-.309-.073-.611-.158-.905-.259l.292-.972zm-1.834-1.79c.216.237.449.463.698.673l-.615.789a7.955 7.955 0 0 1-.845-.816l.762-.646zm-.744-1.352c.062.167.133.328.212.483l-.893.45c-.088-.182-.169-.372-.24-.569l.921-.364zm-.53-2.507c.017.349.048.696.095 1.038l-.985.17c-.05-.363-.081-.735-.095-1.114l.985-.094zm.131-1.538c-.033.17-.06.339-.081.51l-.993-.123a7.957 7.957 0 0 1 .23-1.155l.964.267c-.046.165-.086.332-.12.501zm.952-2.379c-.184.29-.346.594-.486.908l-.914-.405c.16-.36.345-.706.555-1.038l.845.535zm1.548-1.7c-.27.216-.518.447-.747.691l-.789-.616c.297-.379.632-.734 1.005-1.058l.531.983zm2.137-.796c-.363.121-.704.264-1.025.424l-.448-.894c.42-.196.861-.353 1.315-.463l.158.933zM8.5 4.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 7.5V4.5z"/></svg>}
          {icon === 'delete' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M6 2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V4H5.33333V3.33333C5.33333 2.96667 5.63333 2.66667 6 2.66667ZM4 4.66667V12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4Z"/></svg>}
        </span>
        {label}
      </div>
    );
  };

  const menu = (
    <div ref={menuRef} className="user-actions-menu" style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2147483647, minWidth:220, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
      <Item icon="view" color="#4E0DCC" label="Görüntüle" onClick={onView} />
      <Item icon="info" color="#17a2b8" label="Talep Bilgileri" onClick={onDetails} hidden={!onDetails} />
      <Item icon="edit" color="#3B82F6" label="Düzenle" onClick={onEdit} hidden={!onEdit} />
      <div style={{height:1, background:'#f1f3f5', margin:'6px 0'}} />
      <Item icon="delete" color="#dc3545" label="Sil" onClick={onDelete} hidden={!onDelete} />
    </div>
  );

  return (
    <>
      <button ref={btnRef} className="action-menu-btn btn btn-light" onClick={toggle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
      </button>
      {open && createPortal(menu, document.body)}
    </>
  );
};