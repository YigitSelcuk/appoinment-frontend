import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Button, Form, Row, Col, Pagination, Modal } from "react-bootstrap";
import { createPortal } from 'react-dom';
import { useNavigate } from "react-router-dom";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import requestsService from "../../services/requestsService";
import { fetchAllCategoriesForDropdown } from "../../services/categoriesService";
import { smsService } from "../../services/smsService";
import { ilceler, getMahalleler } from "../../data/istanbulData";
import AddRequestModal from "../AddRequestModal/AddRequestModal";
import ViewRequestModal from "../ViewRequestModal/ViewRequestModal";
import EditRequestModal from "../EditRequestModal/EditRequestModal";
import DeleteRequestModal from "../DeleteRequestModal/DeleteRequestModal";
import MessagingModal from "../MessagingModal/MessagingModal";
import WhatsAppSelectModal from "../WhatsAppSelectModal/WhatsAppSelectModal";
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
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [bulkSMSLoading, setBulkSMSLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: requestsPerPage,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      };

      const response = await requestsService.getRequests(params);

      if (response.success) {
        setRequests(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.total || 0);
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
      const response = await requestsService.getCategories();
      if (response.success) {
        setCategories(["TÜMÜ", ...response.data]);
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

  const handleSendMessage = (request) => {
    setSelectedRequest(request);
    setShowMessagingModal(true);
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
      });

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

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowMessagingModal(false);
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
           <img style={{width: '35px', height: '35px'}} src="/assets/images/phone.png" alt="request" />
          </div>
          <h2 className="header-title">TELEFON REHBERİ</h2>
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
            title="Kişi Ekle"
          >
            <svg
              width="21"
              height="22"
              viewBox="0 0 21 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.9105 13.8016C14.4068 13.5223 14.9749 13.3633 15.5798 13.3633H15.5819C15.6434 13.3633 15.6721 13.2859 15.627 13.243C14.9979 12.6515 14.2792 12.1737 13.5003 11.8293C13.4921 11.825 13.4839 11.8229 13.4757 11.8186C14.7493 10.8496 15.5778 9.2748 15.5778 7.49805C15.5778 4.55469 13.3055 2.16992 10.5021 2.16992C7.69868 2.16992 5.42847 4.55469 5.42847 7.49805C5.42847 9.2748 6.25698 10.8496 7.53257 11.8186C7.52437 11.8229 7.51616 11.825 7.50796 11.8293C6.59126 12.2354 5.7689 12.8176 5.06138 13.5609C4.35795 14.2965 3.79792 15.1685 3.41255 16.1283C3.03339 17.0682 2.82876 18.0752 2.80962 19.0953C2.80907 19.1182 2.81291 19.1411 2.82091 19.1624C2.82891 19.1838 2.84091 19.2032 2.8562 19.2196C2.87149 19.2361 2.88976 19.2491 2.90994 19.258C2.93012 19.2669 2.95179 19.2715 2.97368 19.2715H4.2021C4.29029 19.2715 4.36411 19.1963 4.36616 19.1039C4.40718 17.4453 5.04087 15.892 6.16265 14.7146C7.32134 13.4965 8.86353 12.8262 10.5042 12.8262C11.6669 12.8262 12.7826 13.1635 13.7444 13.7951C13.7691 13.8114 13.7975 13.8205 13.8266 13.8217C13.8558 13.8228 13.8847 13.8159 13.9105 13.8016ZM10.5042 11.1934C9.5649 11.1934 8.68101 10.8088 8.0145 10.1105C7.68657 9.76789 7.4266 9.36065 7.24956 8.91227C7.07252 8.4639 6.98192 7.98326 6.98296 7.49805C6.98296 6.51191 7.35005 5.58379 8.0145 4.88555C8.67896 4.1873 9.56284 3.80273 10.5042 3.80273C11.4455 3.80273 12.3273 4.1873 12.9938 4.88555C13.3217 5.2282 13.5817 5.63545 13.7587 6.08382C13.9358 6.53219 14.0264 7.01283 14.0253 7.49805C14.0253 8.48418 13.6583 9.4123 12.9938 10.1105C12.3273 10.8088 11.4434 11.1934 10.5042 11.1934ZM18.0469 16.3066H16.3243V14.502C16.3243 14.4074 16.2504 14.3301 16.1602 14.3301H15.0118C14.9215 14.3301 14.8477 14.4074 14.8477 14.502V16.3066H13.1251C13.0348 16.3066 12.961 16.384 12.961 16.4785V17.6816C12.961 17.7762 13.0348 17.8535 13.1251 17.8535H14.8477V19.6582C14.8477 19.7527 14.9215 19.8301 15.0118 19.8301H16.1602C16.2504 19.8301 16.3243 19.7527 16.3243 19.6582V17.8535H18.0469C18.1372 17.8535 18.211 17.7762 18.211 17.6816V16.4785C18.211 16.384 18.1372 16.3066 18.0469 16.3066Z"
                fill="#F66700"
              />
            </svg>
          </button>

          {selectedRequests.length > 0 && (
            <button
              className="header-btn bulk-sms-btn"
              onClick={handleShowBulkSMSModal}
              title={`${selectedRequests.length} talebe SMS gönder`}
              disabled={bulkSMSLoading}
              style={{
                backgroundColor: bulkSMSLoading ? '#ccc' : '#28a745',
                color: 'white',
                marginLeft: '10px'
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 6L8.5 9.5L15.5 6M1.5 12L8.5 15.5L15.5 12M1.5 6L8.5 2.5L15.5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {bulkSMSLoading ? 'Gönderiliyor...' : `SMS (${selectedRequests.length})`}
            </button>
          )}
          <button className="header-btn" onClick={handleExportToExcel} title="Excel'e Aktar">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.61935 7.51463C6.57273 7.45587 6.51483 7.40703 6.44906 7.37099C6.38329 7.33494 6.31097 7.31241 6.23636 7.30472C6.16175 7.29703 6.08635 7.30435 6.01461 7.32623C5.94287 7.34811 5.87623 7.38412 5.81861 7.43213C5.76099 7.48015 5.71355 7.53921 5.67909 7.60583C5.64463 7.67245 5.62384 7.74528 5.61795 7.82006C5.61206 7.89483 5.62118 7.97003 5.64477 8.04122C5.66837 8.11242 5.70597 8.17818 5.75535 8.23463L8.26748 11.2496L5.75535 14.2646C5.66408 14.3797 5.62141 14.5258 5.63646 14.6719C5.65151 14.818 5.72308 14.9524 5.83589 15.0464C5.9487 15.1404 6.0938 15.1866 6.2402 15.175C6.38659 15.1635 6.52266 15.0952 6.61935 14.9846L8.99985 12.1283L11.3804 14.9858C11.476 15.1003 11.6132 15.1722 11.7618 15.1856C11.8354 15.1923 11.9096 15.1843 11.9802 15.1623C12.0507 15.1403 12.1162 15.1045 12.1729 15.0572C12.2296 15.0098 12.2765 14.9518 12.3108 14.8863C12.3451 14.8209 12.3661 14.7493 12.3728 14.6757C12.3794 14.6021 12.3715 14.5279 12.3495 14.4574C12.3274 14.3869 12.2917 14.3214 12.2444 14.2646L9.73223 11.2496L12.2444 8.23463C12.3356 8.11959 12.3783 7.97343 12.3632 7.82735C12.3482 7.68128 12.2766 7.54688 12.1638 7.45288C12.051 7.35887 11.9059 7.3127 11.7595 7.32424C11.6131 7.33578 11.477 7.40411 11.3804 7.51463L8.99985 10.371L6.61935 7.51463Z"
                fill="#E84E0F"
              />
              <path
                d="M15.75 15.75V5.0625L10.6875 0H4.5C3.90326 0 3.33097 0.237053 2.90901 0.65901C2.48705 1.08097 2.25 1.65326 2.25 2.25V15.75C2.25 16.3467 2.48705 16.919 2.90901 17.341C3.33097 17.7629 3.90326 18 4.5 18H13.5C14.0967 18 14.669 17.7629 15.091 17.341C15.5129 16.919 15.75 16.3467 15.75 15.75ZM10.6875 3.375C10.6875 3.82255 10.8653 4.25178 11.1818 4.56824C11.4982 4.88471 11.9274 5.0625 12.375 5.0625H14.625V15.75C14.625 16.0484 14.5065 16.3345 14.2955 16.5455C14.0845 16.7565 13.7984 16.875 13.5 16.875H4.5C4.20163 16.875 3.91548 16.7565 3.7045 16.5455C3.49353 16.3345 3.375 16.0484 3.375 15.75V2.25C3.375 1.95163 3.49353 1.66548 3.7045 1.4545C3.91548 1.24353 4.20163 1.125 4.5 1.125H10.6875V3.375Z"
                fill="#09C71D"
              />
            </svg>
          </button>
          <button className="header-btn" onClick={handleShowExcelImportModal} title="Excel'den İçe Aktar">
            <svg
              width="18"
              height="19"
              viewBox="0 0 18 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_156_391)">
                <path
                  d="M12.75 7.12598C14.3812 7.13548 15.2647 7.21227 15.8407 7.82027C16.5 8.51614 16.5 9.63556 16.5 11.8744V12.6661C16.5 14.9057 16.5 16.0251 15.8407 16.721C15.1822 17.4161 14.121 17.4161 12 17.4161H6C3.879 17.4161 2.81775 17.4161 2.15925 16.721C1.5 16.0243 1.5 14.9057 1.5 12.6661V11.8744C1.5 9.63556 1.5 8.51614 2.15925 7.82027C2.73525 7.21227 3.61875 7.13548 5.25 7.12598"
                  stroke="#FF005C"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M9 1.58301V11.8747M9 11.8747L6.75 9.10384M9 11.8747L11.25 9.10384"
                  stroke="#FF005C"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_156_391">
                  <rect width="18" height="19" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
          <button className="header-btn" onClick={() => navigate("/categories")}>
            <svg
              width="20"
              height="21"
              viewBox="0 0 20 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_156_404)">
                <path
                  d="M4.99982 2.625C4.40943 2.62408 3.83777 2.84258 3.3861 3.24181C2.93443 3.64104 2.6319 4.19523 2.53208 4.80622C2.43227 5.41722 2.54162 6.04559 2.84077 6.58004C3.13991 7.11449 3.60955 7.52054 4.16649 7.72625V14.875C4.16649 15.5712 4.42988 16.2389 4.89872 16.7312C5.36756 17.2234 6.00345 17.5 6.66649 17.5H12.6415C12.8381 18.0841 13.225 18.5763 13.7338 18.8898C14.2427 19.2033 14.8407 19.3178 15.4221 19.2131C16.0036 19.1084 16.5311 18.7912 16.9114 18.3176C17.2917 17.844 17.5002 17.2445 17.5002 16.625C17.5002 16.0055 17.2917 15.406 16.9114 14.9324C16.5311 14.4588 16.0036 14.1416 15.4221 14.0369C14.8407 13.9322 14.2427 14.0467 13.7338 14.3602C13.225 14.6737 12.8381 15.1659 12.6415 15.75H6.66649C6.44548 15.75 6.23352 15.6578 6.07723 15.4937C5.92095 15.3296 5.83316 15.1071 5.83316 14.875V11.375H12.6415C12.8381 11.9591 13.225 12.4513 13.7338 12.7648C14.2427 13.0783 14.8407 13.1928 15.4221 13.0881C16.0036 12.9834 16.5311 12.6662 16.9114 12.1926C17.2917 11.719 17.5002 11.1195 17.5002 10.5C17.5002 9.88054 17.2917 9.28103 16.9114 8.80743C16.5311 8.33383 16.0036 8.01663 15.4221 7.91192C14.8407 7.8072 14.2427 7.92171 13.7338 8.23519C13.225 8.54867 12.8381 9.04095 12.6415 9.625H5.83316V7.72625C6.38911 7.51962 6.85763 7.11333 7.15596 6.57916C7.45428 6.04498 7.56321 5.41729 7.46351 4.80695C7.36381 4.19662 7.06189 3.64292 6.61108 3.24367C6.16027 2.84441 5.58958 2.62529 4.99982 2.625Z"
                  fill="#E84E0F"
                />
              </g>
              <defs>
                <clipPath id="clip0_156_404">
                  <rect width="20" height="21" fill="white" />
                </clipPath>
              </defs>
            </svg>
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
              <th>ADI</th>
              <th>SOYADI</th>
              <th>KATEGORİ</th>
              <th>TELEFON 1</th>
              <th>TELEFON 2</th>
              <th>ÜNVAN</th>
              <th>MAHALLE</th>
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
                    <span className="ms-2">Veriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : currentRequests.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir kayıt bulunamadı
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
                  <td>{request.name}</td>
                  <td>{request.surname}</td>
                  <td>{request.category}</td>
                  <td>{request.phone1}</td>
                  <td>{request.phone2 || "-"}</td>
                  <td>{request.title || "-"}</td>
                  <td>{request.district || "-"}</td>
                  <td>
                    <RequestActionMenu
                      onView={() => handleViewRequest(request)}
                      onSendMessage={() => handleSendMessage(request)}
                      onWhatsApp={() => handleWhatsAppMessage(request)}
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

      {/* Mesaj Gönderme Modal */}
      <MessagingModal
        show={showMessagingModal}
        handleClose={closeAllModals}
        request={selectedRequest}
        categories={allCategories}
      />

      {/* WhatsApp Numara Seçim Modal */}
      <WhatsAppSelectModal
        show={showWhatsAppModal}
        onHide={closeAllModals}
        request={selectedRequest}
        onSelectPhone={handlePhoneSelect}
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

// Portal tabanlı aksiyon menüsü (Users/Requests ile aynı yaklaşım)
const RequestActionMenu = ({ onView, onSendMessage, onWhatsApp, onEdit, onDelete }) => {
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
        {icon === 'message' && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.334 8L2.927 4.375c-.118-1.036.89-1.773 1.847-1.35l8.06 3.558c1.06.468 1.06 1.889 0 2.357l-8.06 3.558c-.957.423-1.965-.314-1.847-1.35L3.334 8zm0 0h4.833" stroke="#F66700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        {icon === 'whatsapp' && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.648 9.588c-.198-.1-1.172-.578-1.353-.645-.182-.066-.314-.099-.447.1-.131.198-.511.644-.627.776-.115.133-.231.149-.429.05-.198-.1-.837-.309-1.593-.983-.589-.525-.987-1.174-1.102-1.373-.115-.198-.012-.305.087-.404.089-.089.198-.231.297-.347.1-.116.132-.198.198-.331.066-.132.033-.248-.017-.347-.05-.1-.446-1.075-.611-1.472-.161-.386-.325-.333-.446-.34-.115-.005-.247-.007-.38-.007-.132 0-.347.05-.528.248-.181.198-.693.677-.693 1.653 0 .975.71 1.917.809 2.049.099.132 1.397 2.133 3.385 2.992.472.204.841.326 1.129.417.475.151.907.13 1.248.079.381-.057 1.172-.479 1.337-.942.165-.463.165-.859.115-.942-.049-.083-.181-.132-.38-.231m-3.614 4.935h-.003a6.58 6.58 0 01-3.354-.919l-.241-.143-2.494.664.665-2.432-.157-.249a6.573 6.573 0 01-1.007-3.507c.001-3.633 2.958-6.589 6.592-6.589 1.76 0 3.415.687 4.659 1.932a6.55 6.55 0 011.929 4.663c-.002 3.633-2.958 6.589-6.589 6.589m5.609-12.198A7.877 7.877 0 008.033 0C3.663 0 .107 3.557.105 7.928c0 1.397.365 2.761 1.059 3.963L.038 16l4.204-1.103a7.921 7.921 0 003.789.965h.003c4.369 0 7.926-3.557 7.929-7.929A7.881 7.881 0 0013.643 2.325" fill="#25D366"/></svg>}
        {icon === 'edit' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M2 10.667V13.333H4.66667L11.7333 6.26667L9.06667 3.6L2 10.667ZM13.2667 4.73333C13.5333 4.46667 13.5333 4.06667 13.2667 3.8L11.8667 2.4C11.6 2.13333 11.2 2.13333 10.9333 2.4L9.8 3.53333L12.4667 6.2L13.2667 5.4V4.73333Z"/></svg>}
        {icon === 'delete' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M6 2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V4H5.33333V3.33333C5.33333 2.96667 5.63333 2.66667 6 2.66667ZM4 4.66667V12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4Z"/></svg>}
      </span>
      {label}
    </div>
  );

  const menu = (
    <div ref={menuRef} className="user-actions-menu" style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2147483647, minWidth:220, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
      <Item icon="view" color="#4E0DCC" label="Görüntüle" onClick={onView} />
      <Item icon="message" color="#F66700" label="İleti Gönder" onClick={onSendMessage} />
      <Item icon="whatsapp" color="#25D366" label="WhatsApp" onClick={onWhatsApp} />
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