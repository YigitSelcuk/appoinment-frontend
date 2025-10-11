import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Button, Form, Row, Col, Pagination, Modal } from "react-bootstrap";
import { createPortal } from 'react-dom';
import { useNavigate } from "react-router-dom";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { getUsers, createUser, updateUser, deleteUser } from "../../services/usersService";
import { fetchAllCategoriesForDropdown } from "../../services/categoriesService";
import { smsService } from "../../services/smsService";

import AddUserModal from "../AddUserModal/AddUserModal";
import ViewUserModal from "../ViewUserModal/ViewUserModal";
import EditUserModal from "../EditUserModal/EditUserModal";
import DeleteUserModal from "../DeleteUserModal/DeleteUserModal";

import ExcelImportModal from "../ExcelImportModal/ExcelImportModal";
import * as XLSX from 'xlsx';
import "./UsersTable.css";

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

const UsersTable = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useSimpleToast();
  
  const tableWrapperRef = useRef(null);
  
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(14);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [categories, setCategories] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const [scrollbarLeft, setScrollbarLeft] = useState(0);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [bulkSMSLoading, setBulkSMSLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await getUsers(token);

      if (response.success) {
        let filteredUsers = response.data || [];
        
        // Arama filtresi uygula
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          filteredUsers = filteredUsers.filter(user => 
            user.name?.toLowerCase().includes(searchLower) ||
            user.surname?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower)
          );
        }

        // Sayfalama hesapla
        const totalRecords = filteredUsers.length;
        const totalPages = Math.ceil(totalRecords / usersPerPage);
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        setUsers(paginatedUsers);
        setTotalPages(totalPages);
        setTotalRecords(totalRecords);
      }
    } catch (error) {
      showError("Kullanıcılar yüklenirken hata oluştu");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchAllCategoriesForDropdown();
      if (response.success) {
        setCategories(["TÜMÜ", ...response.data]);
      }
    } catch (error) {
      showError("Kategoriler yüklenirken hata oluştu");
      setCategories(["TÜMÜ"]);
    }
  };



  useEffect(() => {
    fetchCategories();
  }, []);

  // Sayfa veya debounced arama terimi değiştiğinde kullanıcıları yükle
  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearchTerm]);

  // Özel scrollbar logic'i
  useEffect(() => {
    const updateScrollbar = () => {
      if (!tableWrapperRef.current) return;

      const wrapper = tableWrapperRef.current;
      const table = wrapper.querySelector('.users-table');
      
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
  }, [users]);

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
    const table = wrapper.querySelector('.users-table');
    
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
        const table = wrapper.querySelector('.users-table');
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
    const table = wrapper.querySelector('.users-table');
    
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

  // Mevcut sayfa kullanıcıları (API'den gelen veriler zaten sayfalanmış)
  const currentUsers = users;

  // Modal işlemleri
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleUserAdded = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await createUser(userData, token);
      
      if (response.success) {
        showSuccess('Kullanıcı başarıyla eklendi.');
        fetchUsers(); // Yeni kullanıcı eklendikten sonra listeyi yenile
      } else {
        showError(response.message || 'Kullanıcı eklenirken bir hata oluştu.');
      }
    } catch (error) {
      showError('Kullanıcı eklenirken bir hata oluştu.');
    }
  };

  // Modal işlem fonksiyonları
  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowViewModal(true);
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setShowEditModal(true);
  };

  const handleDeleteContact = (contact) => {
    setSelectedContact(contact);
    setShowDeleteModal(true);
  };



  // Excel export fonksiyonu
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      
      // Tüm kullanıcıları al (sayfalama olmadan)
      const token = localStorage.getItem('token');
      const response = await getUsers(token);

      if (!response.success || !response.data) {
        showError('Veriler alınırken bir hata oluştu.');
        return;
      }

      // Excel için veri formatını hazırla
      const excelData = users.map((user, index) => ({
        'SIRA': index + 1,
        'KAYIT TARİHİ': user.created_at || '',
        'ADI': user.name || '',
        'ÜNVANI': user.role || '',
        'TELEFON': user.phone || '',
        'EMAIL': user.email || '',
        'ROLÜ': user.department || ''
      }));

      // Excel workbook oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kişiler');

      // Sütun genişliklerini ayarla
      const columnWidths = [
        { wch: 8 },  // SIRA
        { wch: 18 }, // KAYIT TARİHİ
        { wch: 15 }, // ADI
        { wch: 20 }, // ÜNVANI
        { wch: 15 }, // TELEFON
        { wch: 25 }, // EMAIL
        { wch: 20 }  // ROLÜ
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



  const handleUserUpdated = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await updateUser(userData.id, userData, token);
      
      if (response.success) {
        showSuccess('Kullanıcı başarıyla güncellendi.');
        fetchUsers(); // Kullanıcı güncellendikten sonra listeyi yenile
      } else {
        showError(response.message || 'Kullanıcı güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      showError('Kullanıcı güncellenirken bir hata oluştu.');
    }
  };

  const handleUserDeleted = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await deleteUser(userId, token);
      
      if (response.success) {
        showSuccess('Kullanıcı başarıyla silindi.');
        fetchUsers(); // Kullanıcı silindikten sonra listeyi yenile
      } else {
        showError(response.message || 'Kullanıcı silinirken bir hata oluştu.');
      }
    } catch (error) {
      showError('Kullanıcı silinirken bir hata oluştu.');
    }
  };

  // User action handlers
  const handleViewUser = (user) => {
    setSelectedContact(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedContact(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedContact(user);
    setShowDeleteModal(true);
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);

    setShowBulkSMSModal(false);
    setShowExcelImportModal(false);
    setSelectedContact(null);
  };

  // Excel import modal fonksiyonları
  const handleShowExcelImportModal = () => {
    setShowExcelImportModal(true);
  };

  const handleExcelImportComplete = () => {
    fetchUsers(); // Yeni veriler eklendikten sonra listeyi yenile
  };

  // Toplu SMS gönderim modalını aç
  const handleShowBulkSMSModal = () => {
    if (selectedUsers.length === 0) {
      showWarning('Lütfen SMS göndermek için en az bir kişi seçin.');
      return;
    }
    setShowBulkSMSModal(true);
  };

  // Toplu SMS gönder
  const handleBulkSMSSend = async (smsData) => {
    setBulkSMSLoading(true);
    try {
      // Seçili kişilerin telefon numaralarını topla
      const phoneNumbers = [];
      selectedUsers.forEach(userId => {
        const user = users.find(c => c.id === userId);
        if (user) {
          if (user.phone1) phoneNumbers.push(user.phone1);
          if (user.phone2) phoneNumbers.push(user.phone2);
        }
      });

      if (phoneNumbers.length === 0) {
        showWarning('Seçili kişilerde geçerli telefon numarası bulunamadı.');
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
        setSelectedUsers([]); // Seçimleri temizle
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
      setSelectedUsers(currentUsers.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // SelectAll checkbox durumunu güncelle
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setSelectAll(false);
    } else if (selectedUsers.length === currentUsers.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedUsers, currentUsers]);



  return (
    <div className="users-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
           <img style={{width: '35px', height: '35px'}} src="/assets/images/phone.png" alt="contact" />
          </div>
          <h2 className="header-title">YÖNETİM</h2>
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

          {selectedUsers.length > 0 && (
            <button
              className="header-btn bulk-sms-btn"
              onClick={handleShowBulkSMSModal}
              title={`${selectedUsers.length} kişiye SMS gönder`}
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
              {bulkSMSLoading ? 'Gönderiliyor...' : `SMS (${selectedUsers.length})`}
            </button>
          )}
        </div>
      </div>



      {/* Tablo */}
      <div className="table-wrapper" ref={tableWrapperRef}>
        <Table className="users-table">
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
              <th>KAYIT TARİHİ</th>
              <th>ADI</th>
              <th>ÜNVANI</th>
              <th>TELEFON</th>
              <th>EMAIL</th>
              <th>ROLÜ</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Veriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : currentUsers.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir kayıt bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              currentUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="user-checkbox"
                    />
                  </td>
                  <td>{(currentPage - 1) * usersPerPage + index + 1}</td>
                  <td>{user.created_at || "-"}</td>
                  <td>{user.name || "-"}</td>
                  <td>{user.role || "-"}</td>
                  <td>{user.phone || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.department || "-"}</td>
                  <td>
                    <UserActionMenu
                      onView={() => handleViewUser(user)}
                      onEdit={() => handleEditUser(user)}
                      onDelete={() => handleDeleteUser(user)}
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
          TOPLAM {totalRecords.toLocaleString("tr-TR")} KİŞİ BULUNMAKTADIR
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

      {/* Kullanıcı Ekleme Modal */}
      <AddUserModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onSave={handleUserAdded}
      />

      {/* Kullanıcı Görüntüleme Modal */}
      <ViewUserModal
        show={showViewModal}
        onHide={closeAllModals}
        user={selectedContact}
      />

      {/* Kullanıcı Düzenleme Modal */}
      <EditUserModal
        show={showEditModal}
        onHide={closeAllModals}
        user={selectedContact}
        onSave={handleUserUpdated}
      />

      {/* Kullanıcı Silme Modal */}
      <DeleteUserModal
        show={showDeleteModal}
        onHide={closeAllModals}
        user={selectedContact}
        onDelete={handleUserDeleted}
      />



      {/* Toplu SMS Modal */}
      {showBulkSMSModal && (
        <BulkSMSModal
          show={showBulkSMSModal}
          onHide={closeAllModals}
          selectedCount={selectedUsers.length}
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
          Toplu SMS Gönder ({selectedCount} kişi)
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
            `SMS Gönder (${selectedCount} kişi)`
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default UsersTable;

// Portal tabanlı aksiyon menüsü (Users/Requests ile aynı yaklaşım)
const UserActionMenu = ({ onView, onEdit, onDelete }) => {
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

        {icon === 'edit' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M2 10.667V13.333H4.66667L11.7333 6.26667L9.06667 3.6L2 10.667ZM13.2667 4.73333C13.5333 4.46667 13.5333 4.06667 13.2667 3.8L11.8667 2.4C11.6 2.13333 11.2 2.13333 10.9333 2.4L9.8 3.53333L12.4667 6.2L13.2667 5.4V4.73333Z"/></svg>}
        {icon === 'delete' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M6 2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V4H5.33333V3.33333C5.33333 2.96667 5.63333 2.66667 6 2.66667ZM4 4.66667V12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4Z"/></svg>}
      </span>
      {label}
    </div>
  );

  const menu = (
    <div ref={menuRef} className="user-actions-menu" style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2147483647, minWidth:220, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
      <Item icon="view" color="#4E0DCC" label="Görüntüle" onClick={onView} />
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