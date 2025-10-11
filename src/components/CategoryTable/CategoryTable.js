import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Table, Button, Form, Row, Col, Pagination, Modal } from "react-bootstrap";
import * as XLSX from "xlsx";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { fetchCategoriesWithStats } from "../../services/categoriesService";
import AddCategoryModal from "../AddCategoryModal/AddCategoryModal";
import EditCategoryModal from "../EditCategoryModal/EditCategoryModal";
import ViewCategoryModal from "../ViewCategoryModal/ViewCategoryModal";
import DeleteCategoryModal from "../DeleteCategoryModal/DeleteCategoryModal";
import "./CategoryTable.css";

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

const CategoryTable = ({ onShowMessagingModal }) => {
  const { showSuccess, showError, showWarning } = useSimpleToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Modal state'leri
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [targetCategory, setTargetCategory] = useState('');

  // Backend'den kategorileri getir
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetchCategoriesWithStats(currentPage, categoriesPerPage, debouncedSearchTerm);
      
      if (response.success) {
        console.log('Frontend - Gelen kategoriler:', response.data);
        console.log('İlk kategori detayı:', JSON.stringify(response.data[0], null, 2));
        console.log('Alt kategori değeri:', response.data[0]?.alt_kategori);
        setCategories(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.data.reduce((total, cat) => total + cat.kisiSayisi, 0));
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      showError('Kategoriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Component mount edildiğinde ve sayfa değiştiğinde kategorileri getir
  useEffect(() => {
    fetchCategories();
  }, [currentPage, debouncedSearchTerm]);

  // Arama terimi değiştiğinde sayfa numarasını sıfırla
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Arama değiştiğinde hemen ilk sayfaya dön
  };

  // Sayfa değiştirme
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // SelectAll checkbox durumunu güncelle
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setSelectAll(false);
    } else if (selectedCategories.length === categories.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedCategories, categories]);

  // Modal işlemleri
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCategoryAdded = () => {
    // Kategori eklendikten sonra listeyi yenile
    fetchCategories();
  };

  // İşlem fonksiyonları
  const handleMessageSend = (category) => {
    setSelectedCategory(category);
    setShowMessageModal(true);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setShowViewModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleMoveContacts = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(false);
    setShowMoveModal(true);
  };

  // Excel export fonksiyonu
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      
      // Tüm kategorileri al (sayfalama olmadan)
      const response = await fetchCategoriesWithStats(1, 10000, debouncedSearchTerm);

      if (!response.success || !response.data) {
        showError('Veriler alınırken bir hata oluştu.');
        return;
      }

      // Excel için veri formatını hazırla
      const excelData = response.data.map((category, index) => ({
        'SIRA': index + 1,
        'ADI': category.name || '',
        'AÇIKLAMA': category.description || '',
        'DURUM': category.status || '',
        'RENK': category.color || '',
        'OLUŞTURMA TARİHİ': category.created_at ? new Date(category.created_at).toLocaleDateString('tr-TR') : ''
      }));

      // Excel workbook oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kategoriler');

      // Sütun genişliklerini ayarla
      const columnWidths = [
        { wch: 8 },  // SIRA
        { wch: 20 }, // ADI
        { wch: 30 }, // AÇIKLAMA
        { wch: 15 }, // DURUM
        { wch: 15 }, // RENK
        { wch: 18 }  // OLUŞTURMA TARİHİ
      ];
      worksheet['!cols'] = columnWidths;

      // Dosya adını oluştur
      const fileName = `Kategoriler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`;
      
      // Excel dosyasını indir
      XLSX.writeFile(workbook, fileName);
      
      showSuccess(`${response.data.length} kategori başarıyla Excel dosyasına aktarıldı.`);
      
    } catch (error) {
      showError('Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Dropdown state kaldırıldı (portal menü kullanılıyor)



  const handleCategoryUpdated = () => {
    // Kategori güncellendikten sonra listeyi yenile
    fetchCategories();
  };

  const handleCategoryDeleted = () => {
    // Kategori silindikten sonra listeyi yenile
    fetchCategories();
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowMessageModal(false);
    setShowMoveModal(false);
    setSelectedCategory(null);
  };

  // Checkbox işlemleri
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    if (isChecked) {
      setSelectedCategories(categories.map((category) => category.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  return (
    <div className="categories-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
           <img style={{width: '35px', height: '35px'}} src="/assets/images/category.png" alt="category" />
          </div>
          <h2 className="header-title">KATEGORİLER</h2>
        </div>

        {/* Arama Kutusu - Ortada */}
        <div className="header-center">
          <div className="search-container">
            <Form.Control
              type="text"
              placeholder="Kategori adı ile ara..."
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
            title="Kategori Ekle"
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
     
        </div>
      </div>



      {/* Tablo */}
      <div className="table-wrapper">
        <Table className="categories-table">
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
              <th>KATEGORİ ADI</th>
              <th>ALT KATEGORİ</th>
              <th>AÇIKLAMA</th>
              <th>KİŞİ SAYISI</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Veriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir kayıt bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((category, index) => (
                <tr key={category.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleSelectCategory(category.id)}
                      className="category-checkbox"
                    />
                  </td>
                  <td>{(currentPage - 1) * categoriesPerPage + index + 1}</td>
                  <td>{category.name}</td>
                  <td>{category.alt_kategori || '-'}</td>
                  <td>{category.description || '-'}</td>
                  <td>{category.contact_count || 0}</td>
                  <td>
                    <CategoryActionMenu
                      onView={() => handleViewCategory(category)}
                      onEdit={() => handleEditCategory(category)}
                      onDelete={() => handleDeleteCategory(category)}
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
          TOPLAM {totalRecords.toLocaleString("tr-TR")} KATEGORİ BULUNMAKTADIR
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

      {/* Kategori Ekleme Modal */}
      <AddCategoryModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onCategoryAdded={handleCategoryAdded}
      />

      {/* Kategori Düzenleme Modal */}
      <EditCategoryModal
        show={showEditModal}
        onHide={closeAllModals}
        category={selectedCategory}
        onCategoryUpdated={handleCategoryUpdated}
      />

      {/* Kategori Görüntüleme Modal */}
      <ViewCategoryModal
        show={showViewModal}
        onHide={closeAllModals}
        category={selectedCategory}
      />

      {/* Kategori Silme Modal */}
      <DeleteCategoryModal
        show={showDeleteModal}
        onHide={closeAllModals}
        category={selectedCategory}
        onCategoryDeleted={handleCategoryDeleted}
      />
    </div>
  );
};

export default CategoryTable;

// Portal tabanlı aksiyon menüsü (Users/Requests ile aynı yaklaşım)
const CategoryActionMenu = ({ onView, onEdit, onDelete }) => {
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