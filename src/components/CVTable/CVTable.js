import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from 'react-dom';
import { Table, Button, Form, Row, Col, Pagination, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { cvsService } from "../../services/cvsService";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import AddCVModal from "../AddCVModal/AddCVModal";
import ViewCVModal from "../ViewCVModal/ViewCVModal";
import EditCVModal from "../EditCVModal/EditCVModal";
import ShowCVModal from "../ShowCVModal/ShowCVModal";
import DeleteCVModal from "../DeleteCVModal/DeleteCVModal";
import "./CVTable.css";

// Debounce hookasa
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

const CVTable = ({ filters, onFilterChange, onRefresh }) => {
  const navigate = useNavigate();
  const { showError } = useSimpleToast();
  const [cvs, setCvs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cvsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCvs, setSelectedCvs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState(null);
  // API'den CV'leri getir
  const fetchCVs = async () => {
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
      console.error("CV'ler yüklenirken hata:", error);
      setCvs([]);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa veya debounced arama terimi değiştiğinde CV'leri yükle
  useEffect(() => {
    fetchCVs();
  }, [currentPage, debouncedSearchTerm, onRefresh]);

  // Arama terimi değiştiğinde sayfa numarasını sıfırla
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Modal işlemleri
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCVAdded = async (formData) => {
    try {
      setLoading(true);
      const response = await cvsService.createCV(formData);
      if (response.success) {
        // Modal'ı kapat
        setShowAddModal(false);
        // Listeyi yenile
        fetchCVs();
        // Başarı mesajı göster (eğer toast context varsa)
        console.log('CV başarıyla eklendi');
      }
    } catch (error) {
      console.error('CV eklenirken hata:', error);
      showError('CV eklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
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
      setSelectedCvs(cvs.map((cv) => cv.id));
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
    } else if (selectedCvs.length === cvs.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedCvs, cvs]);

  // Durum badge renkleri
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'İŞ ARIYOR':
        return 'status-is-ariyor';
      case 'İŞ BULUNDU':
        return 'status-is-bulundu';
      case 'BEKLEMEDE':
        return 'status-beklemede';
      case 'YETİŞTİRİLDİ':
        return 'status-yetistirildi';
      case 'İŞLENMEDE':
        return 'status-islenmede';
      case 'GÖLDAĞ':
        return 'status-goldag';
      case 'DEĞERLENDİRİLİYOR':
        return 'status-degerlendiriliyor';
      case 'YETİŞTİRİLECEK':
        return 'status-yetistirilecek';
      default:
        return 'status-default';
    }
  };

  // Referans badge renkleri
  const getReferansBadgeClass = (referans) => {
    switch (referans) {
      case 'AHMET YILMAZ':
        return 'referans-ahmet';
      case 'MEHMET CAN':
        return 'referans-mehmet';
      case 'AYHAN YİĞİT':
        return 'referans-ayhan';
      case 'MURAT YILDIRIM':
        return 'referans-murat';
      case 'YAŞAR KARA':
        return 'referans-yasar';
      case 'ENGİN ÖZDEMİR':
        return 'referans-engin';
      case 'ZEYNEP GÜLER':
        return 'referans-zeynep';
      case 'ELİF KARAHAN':
        return 'referans-elif';
      case 'BERKAY YILDIZ':
        return 'referans-berkay';
      case 'İREM KOCAMAN':
        return 'referans-irem';
      case 'ONUR ŞAHİN':
        return 'referans-onur';
      case 'CEREN AYDIN':
        return 'referans-ceren';
      default:
        return 'referans-default';
    }
  };

  // Durum değiştirme fonksiyonu
  const handleStatusChange = async (cvId, newStatus) => {
    try {
      const response = await cvsService.updateCV(cvId, { durum: newStatus });
      if (response.success) {
        // CV listesini güncelle
        setCvs(prevCvs => 
          prevCvs.map(cv => 
            cv.id === cvId ? { ...cv, durum: newStatus } : cv
          )
        );
      }
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  // CV görüntüleme fonksiyonu
  const handleViewCV = (cvId) => {
    setSelectedCvId(cvId);
    setShowViewModal(true);
  };

  // CV düzenleme fonksiyonu
  const handleEditCV = (cvId) => {
    setSelectedCvId(cvId);
    setShowEditModal(true);
  };

  // CV göster fonksiyonu
  const handleShowCV = (cvId) => {
    setSelectedCvId(cvId);
    setShowCVModal(true);
  };

  // CV silme fonksiyonu
  const handleDeleteCV = (cvId) => {
    setSelectedCvId(cvId);
    setShowDeleteModal(true);
  };

  // Modal kapatma fonksiyonları
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedCvId(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCvId(null);
  };

  const handleCloseCVModal = () => {
    setShowCVModal(false);
    setSelectedCvId(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedCvId(null);
  };

  // CV güncelleme callback
  const handleCVUpdated = () => {
    fetchCVs();
  };

  // CV silme callback
  const handleCVDeleted = () => {
    fetchCVs();
    // Seçili CV'lerden de kaldır
    setSelectedCvs(prev => prev.filter(id => id !== selectedCvId));
  };

  // Durum seçenekleri
  const statusOptions = [
    'İŞ ARIYOR',
    'İŞ BULUNDU',
    'BEKLEMEDE',
    'YETİŞTİRİLDİ',
    'İŞLENMEDE',
    'GÖLDAĞ',
    'DEĞERLENDİRİLİYOR',
    'YETİŞTİRİLECEK'
  ];

  return (
    <div className="cvs-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
           <svg width="28" height="31" viewBox="0 0 28 31" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fillRule="evenodd" clipRule="evenodd" d="M0.166016 3.16634C0.166016 2.34859 0.490866 1.56433 1.0691 0.986095C1.64734 0.407858 2.4316 0.0830078 3.24935 0.0830078H21.7493C22.5671 0.0830078 23.3514 0.407858 23.9296 0.986095C24.5078 1.56433 24.8327 2.34859 24.8327 3.16634V12.4163H21.7493V3.16634H3.24935V27.833H10.9577V30.9163H3.24935C2.4316 30.9163 1.64734 30.5915 1.0691 30.0133C0.490866 29.435 0.166016 28.6508 0.166016 27.833V3.16634ZM6.33268 9.33301C6.33268 8.92413 6.49511 8.532 6.78423 8.24289C7.07334 7.95377 7.46547 7.79134 7.87435 7.79134H17.1243C17.5332 7.79134 17.9254 7.95377 18.2145 8.24289C18.5036 8.532 18.666 8.92413 18.666 9.33301C18.666 9.74188 18.5036 10.134 18.2145 10.4231C17.9254 10.7122 17.5332 10.8747 17.1243 10.8747H7.87435C7.46547 10.8747 7.07334 10.7122 6.78423 10.4231C6.49511 10.134 6.33268 9.74188 6.33268 9.33301ZM6.33268 15.4997C6.33268 15.0908 6.49511 14.6987 6.78423 14.4096C7.07334 14.1204 7.46547 13.958 7.87435 13.958H9.41602C9.82489 13.958 10.217 14.1204 10.5061 14.4096C10.7953 14.6987 10.9577 15.0908 10.9577 15.4997C10.9577 15.9086 10.7953 16.3007 10.5061 16.5898C10.217 16.8789 9.82489 17.0413 9.41602 17.0413H7.87435C7.46547 17.0413 7.07334 16.8789 6.78423 16.5898C6.49511 16.3007 6.33268 15.9086 6.33268 15.4997ZM20.2077 18.583C18.9811 18.583 17.8047 19.0703 16.9373 19.9376C16.07 20.805 15.5827 21.9814 15.5827 23.208C15.5827 24.4346 16.07 25.611 16.9373 26.4784C17.8047 27.3457 18.9811 27.833 20.2077 27.833C21.4343 27.833 22.6107 27.3457 23.4781 26.4784C24.3454 25.611 24.8327 24.4346 24.8327 23.208C24.8327 21.9814 24.3454 20.805 23.4781 19.9376C22.6107 19.0703 21.4343 18.583 20.2077 18.583ZM12.4993 23.208C12.4993 21.1636 13.3115 19.203 14.7571 17.7574C16.2027 16.3118 18.1633 15.4997 20.2077 15.4997C22.2521 15.4997 24.2127 16.3118 25.6583 17.7574C27.1039 19.203 27.916 21.1636 27.916 23.208C27.916 25.2524 27.1039 27.213 25.6583 28.6586C24.2127 30.1042 22.2521 30.9163 20.2077 30.9163C18.1633 30.9163 16.2027 30.1042 14.7571 28.6586C13.3115 27.213 12.4993 25.2524 12.4993 23.208ZM20.2077 19.3538C20.6166 19.3538 21.0087 19.5163 21.2978 19.8054C21.5869 20.0945 21.7493 20.4866 21.7493 20.8955V21.6663C22.1582 21.6663 22.5504 21.8288 22.8395 22.1179C23.1286 22.407 23.291 22.7991 23.291 23.208C23.291 23.6169 23.1286 24.009 22.8395 24.2981C22.5504 24.5873 22.1582 24.7497 21.7493 24.7497H20.2077C19.7988 24.7497 19.4067 24.5873 19.1176 24.2981C18.8284 24.009 18.666 23.6169 18.666 23.208V20.8955C18.666 20.4866 18.8284 20.0945 19.1176 19.8054C19.4067 19.5163 19.7988 19.3538 20.2077 19.3538Z" fill="#3C02AA"/>
</svg>

          </div>
          <h2 className="header-title">CV BANK</h2>
        </div>
        
        {/* Arama Kutusu - Ortada */}
        <div className="header-center">
          <div className="search-container">
            <Form.Control
              type="text"
              placeholder="Ad, soyad, meslek veya email ile ara..."
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
            title="CV Ekle"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fillRule="evenodd" clipRule="evenodd" d="M0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2Z" fill="#12B423"/>
<path fillRule="evenodd" clipRule="evenodd" d="M11 5C11 4.73478 10.8946 4.48043 10.7071 4.29289C10.5196 4.10536 10.2652 4 10 4C9.73478 4 9.48043 4.10536 9.29289 4.29289C9.10536 4.48043 9 4.73478 9 5V9H5C4.73478 9 4.48043 9.10536 4.29289 9.29289C4.10536 9.48043 4 9.73478 4 10C4 10.2652 4.10536 10.5196 4.29289 10.7071C4.48043 10.8946 4.73478 11 5 11H9V15C9 15.2652 9.10536 15.5196 9.29289 15.7071C9.48043 15.8946 9.73478 16 10 16C10.2652 16 10.5196 15.8946 10.7071 15.7071C10.8946 15.5196 11 15.2652 11 15V11H15C15.2652 11 15.5196 10.8946 15.7071 10.7071C15.8946 10.5196 16 10.2652 16 10C16 9.73478 15.8946 9.48043 15.7071 9.29289C15.5196 9.10536 15.2652 9 15 9H11V5Z" fill="#12B423"/>
</svg>

          </button>

    
        </div>
      </div>

      {/* Tablo */}
      <div className="table-wrapper">
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
              <th>KAYIT</th>
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
                <td colSpan="11" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Veriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : cvs.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir kayıt bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              cvs.map((cv, index) => (
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
                  <td>
                    {(() => {
                      if (!cv.kayit_tarihi) return '-';
                      const date = new Date(cv.kayit_tarihi);
                      return !isNaN(date.getTime()) ? date.toLocaleDateString('tr-TR') : '-';
                    })()}
                  </td>
                  <td>{cv.adi}</td>
                  <td>{cv.soyadi}</td>
                  <td>{cv.meslek}</td>
                  <td>
                    {(() => {
                      // Önce referans JSON verisini kontrol et
                      if (cv.referans) {
                        try {
                          let referansListesi;
                          
                          // Eğer zaten bir object ise (MySQL JSON tipinden geliyorsa)
                          if (typeof cv.referans === 'object') {
                            referansListesi = cv.referans;
                          } 
                          // Eğer string ise parse et
                          else if (typeof cv.referans === 'string') {
                            referansListesi = JSON.parse(cv.referans);
                          }
                          
                          if (Array.isArray(referansListesi) && referansListesi.length > 0) {
                            return referansListesi.map(ref => ref.isim).join(', ');
                          }
                        } catch (e) {
                          console.log('Referans JSON parse hatası:', e, 'Veri:', cv.referans);
                        }
                      }
                      
                      // JSON verisi yoksa eski referans_kisi alanını göster
                      return cv.referans_kisi || '-';
                    })()} 
                  </td>
                  <td>{cv.email}</td>
               
                  <td>
                    <Form.Select
                      size="sm"
                      value={cv.durum}
                      onChange={(e) => handleStatusChange(cv.id, e.target.value)}
                      className={`status-select ${getStatusBadgeClass(cv.durum)}`}
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '4px 8px'
                      }}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <CVActionMenu
                      onView={() => handleViewCV(cv.id)}
                      onEdit={() => handleEditCV(cv.id)}
                      onShowCV={() => handleShowCV(cv.id)}
                      onDelete={() => handleDeleteCV(cv.id)}
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
          TOPLAM {(totalRecords || 0).toLocaleString("tr-TR")} CV BULUNMAKTADIR
        </div>
        <div className="pagination-wrapper">
          <Pagination className="custom-pagination">
            <Pagination.First 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
            />
            <Pagination.Prev 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            />
            
            {/* Sayfa numaraları */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <Pagination.Item
                  key={pageNumber}
                  active={pageNumber === currentPage}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </Pagination.Item>
              );
            })}
            
            <Pagination.Next 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            />
            <Pagination.Last 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
            />
          </Pagination>
        </div>
      </div>

      {/* Add CV Modal */}
      {showAddModal && (
        <AddCVModal
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          onSubmit={handleCVAdded}
        />
      )}

      {/* View CV Modal */}
      {showViewModal && (
        <ViewCVModal
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          cvId={selectedCvId}
        />
      )}

      {/* Edit CV Modal */}
      {showEditModal && (
        <EditCVModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          cvId={selectedCvId}
          onCVUpdated={handleCVUpdated}
        />
      )}

      {/* Show CV Modal */}
      {showCVModal && (
        <ShowCVModal
          isOpen={showCVModal}
          onClose={handleCloseCVModal}
          cvId={selectedCvId}
        />
      )}

      {/* Delete CV Modal */}
      {showDeleteModal && (
        <DeleteCVModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          cvId={selectedCvId}
          onCVDeleted={handleCVDeleted}
        />
      )}
    </div>
  );
};

export default CVTable;

// Portal tabanlı aksiyon menüsü (Users/Requests ile aynı yaklaşım)
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
        {icon === 'edit' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M2 10.667V13.333H4.66667L11.7333 6.26667L9.06667 3.6L2 10.667ZM13.2667 4.73333C13.5333 4.46667 13.5333 4.06667 13.2667 3.8L11.8667 2.4C11.6 2.13333 11.2 2.13333 10.9333 2.4L9.8 3.53333L12.4667 6.2L13.2667 5.4V4.73333Z"/></svg>}
        {icon === 'show' && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 6h6M5 8h6M5 10h4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        {icon === 'delete' && <svg width="14" height="14" viewBox="0 0 16 16" fill={color}><path d="M6 2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V4H5.33333V3.33333C5.33333 2.96667 5.63333 2.66667 6 2.66667ZM4 4.66667V12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4Z"/></svg>}
      </span>
      {label}
    </div>
  );

  const menu = (
    <div ref={menuRef} className="user-actions-menu" style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2147483647, minWidth:220, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
      <Item icon="view" color="#4E0DCC" label="Görüntüle" onClick={onView} />
      <Item icon="edit" color="#3B82F6" label="Düzenle" onClick={onEdit} />
      <Item icon="show" color="#10B981" label="CV Göster" onClick={onShowCV} />
      <div style={{height:1, background:'#f1f3f5', margin:'6px 0'}} />
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