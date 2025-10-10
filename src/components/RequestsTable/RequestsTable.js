import React, { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import {
  Table,
  Button,
  Form,
  Pagination,
  Badge,
} from "react-bootstrap";
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import AddRequestModal from "../AddRequestModal/AddRequestModal";
import ViewRequestModal from "../ViewRequestModal/ViewRequestModal";
import EditRequestModal from "../EditRequestModal/EditRequestModal";
import DeleteRequestModal from "../DeleteRequestModal/DeleteRequestModal";
import UpdateRequestStatusModal from "../UpdateRequestStatusModal/UpdateRequestStatusModal";
import RequestHistoryModal from "../RequestHistoryModal/RequestHistoryModal";
import requestsService from "../../services/requestsService";
import "./RequestsTable.css";

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

const RequestsTable = () => {
  const { showSuccess, showError } = useSimpleToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [userInfo, setUserInfo] = useState({ role: '', department: '', isAdmin: false });

  // Modal state'leri
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);



  // Component mount edildiğinde ve arama terimi değiştiğinde verileri yükle
  useEffect(() => {
    fetchRequests();
  }, [currentPage, debouncedSearchTerm]);

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
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.pagination.totalRecords);
        
        // User info'yu da güncelle
        if (response.userInfo) {
          setUserInfo(response.userInfo);
        }
      }
    } catch (error) {
      console.error("Talepler yüklenirken hata:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Arama terimi değiştiğinde sayfa numarasını sıfırla
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
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
    } else if (
      selectedRequests.length === currentRequests.length &&
      currentRequests.length > 0
    ) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRequests, requests]);

  // Backend'den gelen veriler zaten sayfalanmış
  const currentRequests = requests;

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
      <Badge
        className={`custom-status-badge ${config.cssClass}`}
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
      </Badge>
    );
  };



  // Action handlers
  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleDeleteRequest = (request) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  const handleUpdateStatus = (request) => {
    setSelectedRequest(request);
    setShowUpdateStatusModal(true);
  };

  const handleViewHistory = (request) => {
    setSelectedRequest(request);
    setShowHistoryModal(true);
  };

  const handleStatusUpdated = () => {
    fetchRequests(); // Listeyi yenile
  };

  // Mevcut kullanıcının ID'sini al
  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const handleProcessRequest = (request) => {
    console.log("Talep işleme al:", request);
  };

  const handleCompleteRequest = async (request) => {
    try {
      // Talep durumunu "Tamamlandı" olarak güncelle
      const updatedData = {
        tcNo: request.tc_no,
        ad: request.ad,
        soyad: request.soyad,
        ilce: request.ilce,
        mahalle: request.mahalle,
        adres: request.adres,
        telefon: request.telefon,
        talepDurumu: "Tamamlandı",
        talepTuru: request.talep_turu,
        ilgiliMudurluk: request.ilgili_mudurluk,
        talepBasligi: request.talep_basligi,
        aciklama: request.aciklama,
        durum: "TAMAMLANDI"
      };

      const response = await requestsService.updateRequest(request.id, updatedData);

      if (response.success) {
        // Başarılı güncelleme mesajı
        showSuccess("Talep başarıyla tamamlandı olarak işaretlendi!");
        
        // Listeyi yenile
        fetchRequests();
      } else {
        throw new Error(response.message || "Talep güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Talep tamamlanırken hata:", error);
      showError("Talep tamamlanırken hata oluştu: " + error.message);
    }
  };

  // Modal işlemleri
  const handleShowAddRequestModal = () => {
    setShowAddRequestModal(true);
  };

  const handleCloseAddRequestModal = () => {
    setShowAddRequestModal(false);
  };

  const handleRequestAdded = () => {
    // Yeni talep eklendikten sonra listeyi yenile
    fetchRequests();
  };

  const handleRequestUpdated = () => {
    // Talep güncellendikten sonra listeyi yenile
    fetchRequests();
  };

  const handleRequestDeleted = () => {
    // Talep silindikten sonra listeyi yenile
    fetchRequests();
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedRequest(null);
  };

  return (
    <div className="requests-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
            <svg
              width="39"
              height="39"
              viewBox="0 0 39 39"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M28.4375 7.86825C25.961 7.04763 22.9872 6.5 19.5 6.5C16.0144 6.5 13.039 7.04763 10.5625 7.86825M28.4375 7.86825C33.3466 9.49325 36.2944 12.1907 37.375 13.8125L33.3125 17.875L28.4375 14.625V7.86825ZM10.5625 7.86825C5.65338 9.49325 2.70563 12.1907 1.625 13.8125L5.6875 17.875L10.5625 14.625V7.86825ZM16.25 11.375V16.25M16.25 16.25L7.45225 25.0477C6.84271 25.6571 6.50018 26.4836 6.5 27.3455V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H29.25C30.112 32.5 30.9386 32.1576 31.5481 31.5481C32.1576 30.9386 32.5 30.112 32.5 29.25V27.3455C32.4998 26.4836 32.1573 25.6571 31.5477 25.0477L22.75 16.25M16.25 16.25H22.75M22.75 16.25V11.375"
                stroke="#4E0DCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.5 27.625C21.2949 27.625 22.75 26.1699 22.75 24.375C22.75 22.5801 21.2949 21.125 19.5 21.125C17.7051 21.125 16.25 22.5801 16.25 24.375C16.25 26.1699 17.7051 27.625 19.5 27.625Z"
                stroke="#4E0DCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="header-title">
            {(userInfo.isAdmin || userInfo.isBaskan || userInfo.isBaskanDepartment) ? 'TALEPLER' : `${userInfo.department} - TALEPLER`}
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
            onClick={handleShowAddRequestModal}
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
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12ZM12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4Z"
                fill="#12B423"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M13 7C13 6.73478 12.8946 6.48043 12.7071 6.29289C12.5196 6.10536 12.2652 6 12 6C11.7348 6 11.4804 6.10536 11.2929 6.29289C11.1054 6.48043 11 6.73478 11 7V11H7C6.73478 11 6.48043 11.1054 6.29289 11.2929C6.10536 11.4804 6 11.7348 6 12C6 12.2652 6.10536 12.5196 6.29289 12.7071C6.48043 12.8946 6.73478 13 7 13H11V17C11 17.2652 11.1054 17.5196 11.2929 17.7071C11.4804 17.8946 11.7348 18 12 18C12.2652 18 12.5196 17.8946 12.7071 17.7071C12.8946 17.5196 13 17.2652 13 17V13H17C17.2652 13 17.5196 12.8946 17.7071 12.7071C17.8946 12.5196 18 12.2652 18 12C18 11.7348 17.8946 11.4804 17.7071 11.2929C17.5196 11.1054 17.2652 11 17 11H13V7Z"
                fill="#12B423"
              />
            </svg>

            <span>TALEP EKLE</span>
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="table-wrapper">
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
              <th>TALEP BAŞLIĞI</th>
              <th>AÇIKLAMA</th>
              <th>TALEP EDEN</th>
              <th>TELEFON</th>
              <th>İLGİLİ MÜDÜRLÜK</th>
              <th>DURUM</th>
              <th>TALEP SÜRESİ</th>
              <th>İŞLEM</th>
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
                    <span className="ms-2">Talepler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : currentRequests.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4">
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
                  <td className="request-title">{request.aciklama?.substring(0, 50) + '...' || 'Açıklama Yok'}</td>
                  <td className="requester-name">{`${request.ad} ${request.soyad}`}</td>
                  <td className="contact-info">{request.telefon || 'N/A'}</td>
                  <td className="related-unit">{request.ilgili_mudurluk || 'N/A'}</td>
                  <td>{getStatusBadge(request.talep_durumu, request.durum)}</td>
                  <td className="request-duration">{calculateRequestDuration(request.created_at_display || request.created_at)}</td>
                  <td>
                    <RequestActionMenu
                      request={request}
                      onView={() => handleViewRequest(request)}
                      onComplete={request.talep_durumu !== "Tamamlandı" && request.durum !== "Tamamlandı" ? () => handleCompleteRequest(request) : null}
                      onMessage={() => handleProcessRequest(request)}
                      onEdit={getCurrentUserId() === request.user_id ? () => handleEditRequest(request) : null}
                      onUpdateStatus={(userInfo.isAdmin || userInfo.isBaskan || userInfo.isBaskanDepartment || request.ilgili_mudurluk === userInfo.department) ? () => handleUpdateStatus(request) : null}
                      onHistory={() => handleViewHistory(request)}
                      onDelete={getCurrentUserId() === request.user_id ? () => handleDeleteRequest(request) : null}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Alt Bilgi ve Sayfalama */}
      <div className="table-footer">
        <div className="total-records">
          {(userInfo.isAdmin || userInfo.isBaskan || userInfo.isBaskanDepartment) 
            ? `TOPLAM ${totalRecords.toLocaleString("tr-TR")} TALEP BULUNMAKTADIR` 
            : `${userInfo.department} MÜDÜRLÜĞÜNDE ${totalRecords.toLocaleString("tr-TR")} TALEP BULUNMAKTADIR`
          }
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

      {/* Talep Ekleme Modal */}
      <AddRequestModal
        show={showAddRequestModal}
        onHide={handleCloseAddRequestModal}
        onRequestAdded={handleRequestAdded}
      />

      {/* Talep Görüntüleme Modal */}
      <ViewRequestModal
        show={showViewModal}
        onHide={closeAllModals}
        request={selectedRequest}
      />

      {/* Talep Düzenleme Modal */}
      <EditRequestModal
        show={showEditModal}
        onHide={closeAllModals}
        request={selectedRequest}
        onRequestUpdated={handleRequestUpdated}
      />

      {/* Talep Silme Modal */}
      <DeleteRequestModal
        show={showDeleteModal}
        onHide={closeAllModals}
        request={selectedRequest}
        onRequestDeleted={handleRequestDeleted}
      />

      {/* Talep Durum Güncelleme Modal */}
      <UpdateRequestStatusModal
        show={showUpdateStatusModal}
        onHide={() => setShowUpdateStatusModal(false)}
        request={selectedRequest}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Talep Geçmişi Modal */}
      <RequestHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        request={selectedRequest}
      />
    </div>
  );
};

export default RequestsTable;

// Portal menu similar to UsersTable ActionMenu
const RequestActionMenu = ({ request, onView, onComplete, onMessage, onEdit, onUpdateStatus, onHistory, onDelete }) => {
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
          {icon === 'check' && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 8L7.33 9.33L10 6.67M14 8C14 11.31 11.31 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          {icon === 'message' && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.33 8L2.93 4.38C2.8 3.34 4.04 2.58 4.83 3.02L12.79 6.79C13.71 7.28 13.71 8.72 12.79 9.21L4.83 12.98C4.04 13.42 2.8 12.66 2.93 11.62L3.33 8ZM3.33 8H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          {icon === 'edit' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M2 10.667V13.333H4.66667L11.7333 6.26667L9.06667 3.6L2 10.667ZM13.2667 4.73333C13.5333 4.46667 13.5333 4.06667 13.2667 3.8L11.8667 2.4C11.6 2.13333 11.2 2.13333 10.9333 2.4L9.8 3.53333L12.4667 6.2L13.2667 5.4V4.73333Z"/></svg>}
          {icon === 'refresh' && <span>🔄</span>}
          {icon === 'history' && <span>📋</span>}
          {icon === 'delete' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M6 2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V4H5.33333V3.33333C5.33333 2.96667 5.63333 2.66667 6 2.66667ZM4 4.66667V12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4Z"/></svg>}
        </span>
        {label}
      </div>
    );
  };

  const menu = (
    <div ref={menuRef} className="user-actions-menu" style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2147483647, minWidth:220, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
      <Item icon="view" color="#4E0DCC" label="Görüntüle" onClick={onView} />
      <Item icon="check" color="#10B981" label="Tamamlandı" onClick={onComplete} hidden={!onComplete} />
      <Item icon="message" color="#F66700" label="İleti" onClick={onMessage} />
      <Item icon="edit" color="#3B82F6" label="Düzenle" onClick={onEdit} hidden={!onEdit} />
      <Item icon="refresh" color="#6B7280" label="Durum Güncelle" onClick={onUpdateStatus} hidden={!onUpdateStatus} />
      <Item icon="history" color="#6B7280" label="Geçmiş" onClick={onHistory} />
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
