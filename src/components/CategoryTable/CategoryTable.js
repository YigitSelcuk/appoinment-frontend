import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Table, Button, Form, Row, Col, Pagination, Modal } from "react-bootstrap";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { fetchCategoriesWithStats } from "../../services/categoriesService";
import AddCategoryModal from "../AddCategoryModal/AddCategoryModal";
import EditCategoryModal from "../EditCategoryModal/EditCategoryModal";
import "./CategoryTable.css";

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

  // Modal fonksiyonları
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
    if (onShowMessagingModal) {
      onShowMessagingModal(category);
    } else {
      setSelectedCategory(category);
      setShowMessageModal(true);
    }
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

  // Kişileri taşı ve kategoriyi sil
  const confirmMoveAndDelete = async () => {
    if (!targetCategory) {
      showWarning('Lütfen hedef kategori seçin!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Önce kişileri taşı
      const moveResponse = await fetch(`${process.env.REACT_APP_API_URL}/contacts/move-category`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromCategory: selectedCategory.alt_kategori,
          toCategory: targetCategory
        })
      });

      const moveData = await moveResponse.json();

      if (moveData.success) {
        // Sonra kategoriyi sil
        const deleteResponse = await fetch(`${process.env.REACT_APP_API_URL}/contacts/categories/${selectedCategory.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const deleteData = await deleteResponse.json();

        if (deleteData.success) {
          fetchCategories(); // Listeyi yenile
          closeAllModals();
          setTargetCategory('');
          console.log('✅ Kişiler taşındı ve kategori silindi');
        } else {
          console.error('❌ Kategori silinirken hata:', deleteData.message);
          showError(`Kategori silinirken hata: ${deleteData.message}`);
        }
      } else {
        console.error('❌ Kişiler taşınırken hata:', moveData.message);
        showError(`Kişiler taşınırken hata: ${moveData.message}`);
      }
    } catch (error) {
      console.error('❌ Bağlantı hatası:', error);
      showError('Bağlantı hatası oluştu.');
    }
  };

  // Modal kapatma fonksiyonları
  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowMessageModal(false);
    setShowMoveModal(false);
    setSelectedCategory(null);
    setTargetCategory('');
  };

  // Silme işlemini gerçekleştir
  const confirmDeleteCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contacts/categories/${selectedCategory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchCategories(); // Listeyi yenile
        closeAllModals();
        console.log('✅ Başarı:', data.message);
      } else {
        console.error('❌ Hata:', data.message);
        showError(`Hata: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Bağlantı hatası:', error);
      showError('Bağlantı hatası oluştu.');
    }
  };

  return (
    <div className="category-table-container">
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
          <h2 className="header-title">KATEGORİ</h2>
        </div>
        <div className="header-center">
          <div className="search-input-container">
            <Form.Control
              type="text"
              placeholder="Kategorilerde ara..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="header-search-input"
            />
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
          <button className="header-btn add-btn" onClick={handleShowAddModal}>
            <svg
              width="17"
              height="18"
              viewBox="0 0 17 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.9105 11.8016C12.4068 11.5223 12.9749 11.3633 13.5798 11.3633H13.5819C13.6434 11.3633 13.6721 11.2859 13.627 11.243C12.9979 10.6515 12.2792 10.1737 11.5003 9.8293C11.4921 9.825 11.4839 9.82285 11.4757 9.81855C12.7493 8.84961 13.5778 7.2748 13.5778 5.49805C13.5778 2.55469 11.3055 0.169922 8.5021 0.169922C5.69868 0.169922 3.42847 2.55469 3.42847 5.49805C3.42847 7.2748 4.25698 8.84961 5.53257 9.81855C5.52437 9.82285 5.51616 9.825 5.50796 9.8293C4.59126 10.2354 3.7689 10.8176 3.06138 11.5609C2.35795 12.2965 1.79792 13.1685 1.41255 14.1283C1.03339 15.0682 0.828758 16.0752 0.809622 17.0953C0.809074 17.1182 0.812913 17.1411 0.820913 17.1624C0.828912 17.1838 0.84091 17.2032 0.8562 17.2196C0.871489 17.2361 0.889761 17.2491 0.909938 17.258C0.930115 17.2669 0.95179 17.2715 0.973684 17.2715H2.2021C2.29029 17.2715 2.36411 17.1963 2.36616 17.1039C2.40718 15.4453 3.04087 13.892 4.16265 12.7146C5.32134 11.4965 6.86353 10.8262 8.50415 10.8262C9.66695 10.8262 10.7826 11.1635 11.7444 11.7951C11.7691 11.8114 11.7975 11.8205 11.8266 11.8217C11.8558 11.8228 11.8847 11.8159 11.9105 11.8016ZM8.50415 9.19336C7.5649 9.19336 6.68101 8.80879 6.0145 8.11055C5.68657 7.76789 5.4266 7.36065 5.24956 6.91227C5.07252 6.4639 4.98192 5.98326 4.98296 5.49805C4.98296 4.51191 5.35005 3.58379 6.0145 2.88555C6.67896 2.1873 7.56284 1.80273 8.50415 1.80273C9.44546 1.80273 10.3273 2.1873 10.9938 2.88555C11.3217 3.2282 11.5817 3.63545 11.7587 4.08382C11.9358 4.53219 12.0264 5.01283 12.0253 5.49805C12.0253 6.48418 11.6583 7.4123 10.9938 8.11055C10.3273 8.80879 9.44341 9.19336 8.50415 9.19336ZM16.0469 14.3066H14.3243V12.502C14.3243 12.4074 14.2504 12.3301 14.1602 12.3301H13.0118C12.9215 12.3301 12.8477 12.4074 12.8477 12.502V14.3066H11.1251C11.0348 14.3066 10.961 14.384 10.961 14.4785V15.6816C10.961 15.7762 11.0348 15.8535 11.1251 15.8535H12.8477V17.6582C12.8477 17.7527 12.9215 17.8301 13.0118 17.8301H14.1602C14.2504 17.8301 14.3243 17.7527 14.3243 17.6582V15.8535H16.0469C16.1372 15.8535 16.211 15.7762 16.211 15.6816V14.4785C16.211 14.384 16.1372 14.3066 16.0469 14.3066Z"
                fill="currentColor"
              />
            </svg>
            <span className="add-text">Yeni Kategori Ekle</span>
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="table-wrapper">
        <Table className="category-table">
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
              <th>ALT KATEGORİ</th>
              <th>ANA KATEGORİ</th>
              <th>KİŞİ SAYISI</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Kategoriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir kategori bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleSelectCategory(category.id)}
                    className="category-checkbox"
                  />
                </td>
                <td>{category.sira}</td>
                <td className="sub-category">{category.alt_kategori || "-"}</td>
                <td className="category-name">{category.name}</td>
                <td className="person-count">
                  {category.kisiSayisi.toLocaleString("tr-TR")}
                </td>
                <td>
                  <div className="action-buttons">
                    <CategoryActionMenu
                      onView={() => handleViewCategory(category)}
                      onSendMessage={() => handleMessageSend(category)}
                      onEdit={() => handleEditCategory(category)}
                      onDelete={() => handleDeleteCategory(category)}
                    />
                  </div>
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

      {/* Kategori Ekleme Modalı */}
      <AddCategoryModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onCategoryAdded={handleCategoryAdded}
      />

      {/* Kategori Düzenleme Modalı */}
      <EditCategoryModal
        show={showEditModal}
        onHide={closeAllModals}
        category={selectedCategory}
        onCategoryUpdated={fetchCategories}
      />

      {/* Kategori Görüntüleme Modalı */}
      <Modal show={showViewModal} onHide={closeAllModals} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-eye me-2 text-info"></i>
            Kategori Detayları
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCategory && (
            <div className="category-details">
              <Row>
                <Col md={6}>
                  <div className="detail-item mb-3">
                    <label className="detail-label">Ana Kategori:</label>
                    <div className="detail-value">{selectedCategory.name}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item mb-3">
                    <label className="detail-label">Alt Kategori:</label>
                    <div className="detail-value">{selectedCategory.alt_kategori}</div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="detail-item mb-3">
                    <label className="detail-label">Kişi Sayısı:</label>
                    <div className="detail-value text-success fw-bold">
                      {selectedCategory.kisiSayisi.toLocaleString("tr-TR")} kişi
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item mb-3">
                    <label className="detail-label">Sıra No:</label>
                    <div className="detail-value">{selectedCategory.sira}</div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <div className="detail-item mb-3">
                    <label className="detail-label">Açıklama:</label>
                    <div className="detail-value">
                      {selectedCategory.description || "Açıklama bulunmamaktadır."}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAllModals}>
            <i className="fas fa-times me-2"></i>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>



      {/* Mesaj Gönderme Modalı */}
      <Modal show={showMessageModal} onHide={closeAllModals} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-envelope me-2 text-primary"></i>
            Mesaj Gönder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCategory && (
            <div className="message-send">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>{selectedCategory.name} - {selectedCategory.alt_kategori}</strong> kategorisindeki 
                <strong> {selectedCategory.kisiSayisi} kişiye</strong> mesaj gönderilecek.
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Konu:</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Mesaj konusu..."
                  className="category-input"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mesaj İçeriği:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Mesajınızı buraya yazın..."
                  className="category-input"
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAllModals}>
            <i className="fas fa-times me-2"></i>
            İptal
          </Button>
          <Button variant="primary">
            <i className="fas fa-paper-plane me-2"></i>
            Mesaj Gönder
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Silme Onay Modalı */}
      <Modal show={showDeleteModal} onHide={closeAllModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
            Kategori Sil
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCategory && (
            <div className="delete-confirmation">
              <div className="category-details mb-4">
                <h6 className="mb-2">Silinecek Kategori:</h6>
                <div className="category-item">
                  <span className="category-main">{selectedCategory.name}</span>
                  <span className="category-separator">•</span>
                  <span className="category-sub">{selectedCategory.alt_kategori}</span>
                </div>
                <div className="person-count mt-2">
                  <i className="fas fa-users me-2 text-primary"></i>
                  <span>{selectedCategory.kisiSayisi} kişi</span>
                </div>
              </div>
              
              <div className="confirmation-question mb-3">
                <p className="text-center mb-0">Bu kategoriyi silmek istediğinizden emin misiniz?</p>
              </div>
              
                             <div className="alert alert-warning">
                 <i className="fas fa-exclamation-triangle me-2"></i>
                 <strong>Uyarı:</strong> Bu kategorideki kişiler "Kategori Yok" kategorisine taşınacaktır.
               </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button variant="secondary" onClick={closeAllModals}>
            <i className="fas fa-times me-2"></i>
            İptal
          </Button>
          <div className="action-buttons-group">
            <Button 
              variant="info" 
              onClick={() => handleMoveContacts(selectedCategory)}
              className="me-2"
            >
              <i className="fas fa-exchange-alt me-2"></i>
              Kişileri Taşı
            </Button>
            <Button variant="danger" onClick={confirmDeleteCategory}>
              <i className="fas fa-trash me-2"></i>
              Evet, Sil
            </Button>
          </div>
        </Modal.Footer>
              </Modal>

      {/* Kişi Taşıma Modalı */}
      <Modal show={showMoveModal} onHide={closeAllModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-exchange-alt me-2 text-info"></i>
            Kişileri Taşı
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCategory && (
            <div className="move-contacts">
              <div className="source-category mb-4">
                <h6 className="mb-2">Kaynak Kategori:</h6>
                <div className="category-item">
                  <span className="category-main">{selectedCategory.name}</span>
                  <span className="category-separator">•</span>
                  <span className="category-sub">{selectedCategory.alt_kategori}</span>
                </div>
                <div className="person-count mt-2">
                  <i className="fas fa-users me-2 text-primary"></i>
                  <span>{selectedCategory.kisiSayisi} kişi taşınacak</span>
                </div>
              </div>
              
                             <div className="target-category mb-4">
                 <Form.Group>
                   <Form.Label>Hedef Kategori Seçin:</Form.Label>
                   <Form.Select 
                     className="category-input"
                     value={targetCategory}
                     onChange={(e) => setTargetCategory(e.target.value)}
                   >
                     <option value="">Kategori seçin...</option>
                     {categories
                       .filter(cat => cat.id !== selectedCategory.id)
                       .map(category => (
                         <option key={category.id} value={category.alt_kategori}>
                           {category.name} - {category.alt_kategori}
                         </option>
                       ))
                     }
                     <option value="Kategori Yok">Kategori Yok</option>
                   </Form.Select>
                 </Form.Group>
               </div>
              
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Kişiler seçilen kategoriye taşındıktan sonra kaynak kategori silinecektir.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAllModals}>
            <i className="fas fa-times me-2"></i>
            İptal
          </Button>
                     <Button 
             variant="success" 
             onClick={confirmMoveAndDelete}
             disabled={!targetCategory}
           >
             <i className="fas fa-check me-2"></i>
             Taşı ve Sil
           </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Category actions dropdown component (portal-based)
const CategoryActionMenu = ({ onView, onSendMessage, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - 232, r.right - 220));
    const top = Math.min(window.innerHeight - 240, r.bottom + 6);
    setPos({ top, left });
    setOpen((p) => !p);
  };

  const Item = ({ icon, color, label, onClick }) => (
    <div
      className="dropdown-item"
      onClick={() => {
        setOpen(false);
        onClick && onClick();
      }}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
    >
      <span style={{ width: 14, height: 14, display: "inline-flex" }}>
        {icon === "view" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
            <path d="M12 6a9.77 9.77 0 0 0-9 6 9.77 9.77 0 0 0 18 0 9.77 9.77 0 0 0-9-6Zm0 10a4 4 0 1 1 4-4 4.005 4.005 0 0 1-4 4Z" />
          </svg>
        )}
        {icon === "message" && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.334 8L2.927 4.375c-.118-1.036.89-1.773 1.847-1.35l8.06 3.558c1.06.468 1.06 1.889 0 2.357l-8.06 3.558c-.957.423-1.965-.314-1.847-1.35L3.334 8zm0 0h4.833"
              stroke="#F66700"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {icon === "edit" && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill={color}>
            <path d="M2 10.667V13.333H4.66667L11.7333 6.26667L9.06667 3.6L2 10.667ZM13.2667 4.73333C13.5333 4.46667 13.5333 4.06667 13.2667 3.8L11.8667 2.4C11.6 2.13333 11.2 2.13333 10.9333 2.4L9.8 3.53333L12.4667 6.2L13.2667 5.4V4.73333Z" />
          </svg>
        )}
        {icon === "delete" && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill={color}>
            <path d="M6 2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V4H5.33333V3.33333C5.33333 2.96667 5.63333 2.66667 6 2.66667ZM4 4.66667V12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4Z" />
          </svg>
        )}
      </span>
      {label}
    </div>
  );

  const menu = (
    <div
      ref={menuRef}
      className="user-actions-menu"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 2147483647,
        minWidth: 220,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        padding: 6,
      }}
    >
      <Item icon="view" color="#4E0DCC" label="Görüntüle" onClick={onView} />
      <Item icon="message" color="#F66700" label="İleti Gönder" onClick={onSendMessage} />
      <div style={{ height: 1, background: "#f1f3f5", margin: "6px 0" }} />
      <Item icon="edit" color="#3B82F6" label="Düzenle" onClick={onEdit} />
      <Item icon="delete" color="#dc3545" label="Sil" onClick={onDelete} />
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="action-menu-btn btn btn-outline-secondary btn-sm"
        title="İşlemler"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && createPortal(menu, document.body)}
    </>
  );
};

export default CategoryTable;
 