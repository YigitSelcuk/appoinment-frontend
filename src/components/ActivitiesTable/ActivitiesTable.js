import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Pagination,
  Badge,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import activitiesService from "../../services/activitiesService";
import { useAuth } from "../../contexts/AuthContext";
import "./ActivitiesTable.css";

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

const ActivitiesTable = () => {
  const { accessToken, user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activitiesPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [tableNameFilter, setTableNameFilter] = useState("");

  // Component mount edildiğinde ve filtreler değiştiğinde verileri yükle
  useEffect(() => {
    if (accessToken) {
      fetchActivities();
    }
  }, [accessToken, currentPage, debouncedSearchTerm, actionTypeFilter, tableNameFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!accessToken) {
        console.error('Access token bulunamadı');
        setActivities([]);
        setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      const params = {
        page: currentPage,
        limit: activitiesPerPage,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(actionTypeFilter && { actionType: actionTypeFilter }),
        ...(tableNameFilter && { tableName: tableNameFilter }),
      };

      const response = await activitiesService.getActivities(accessToken, params);

      if (response.success) {
        setActivities(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.pagination.totalRecords);
        setError(null);
      }
    } catch (error) {
      console.error("Aktiviteler yüklenirken hata:", error);
      setActivities([]);
      setError(error.message || 'Aktiviteler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Arama terimi değiştiğinde sayfa numarasını sıfırla
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Filtre değiştiğinde sayfa numarasını sıfırla
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'actionType') {
      setActionTypeFilter(value);
    } else if (filterType === 'tableName') {
      setTableNameFilter(value);
    }
    setCurrentPage(1);
  };

  // Sayfa değiştirme
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // İşlem türü badge'i
  const getActionTypeBadge = (actionType) => {
    const actionConfig = {
      CREATE: { variant: "success", text: "OLUŞTUR", icon: "plus" },
      UPDATE: { variant: "warning", text: "GÜNCELLE", icon: "edit" },
      DELETE: { variant: "danger", text: "SİL", icon: "trash" },
      READ: { variant: "info", text: "GÖRÜNTÜLE", icon: "eye" },
      LOGIN: { variant: "primary", text: "GİRİŞ", icon: "sign-in-alt" },
      LOGOUT: { variant: "secondary", text: "ÇIKIŞ", icon: "sign-out-alt" },
    };

    const config = actionConfig[actionType] || { variant: "secondary", text: actionType, icon: "question" };

    return (
      <Badge bg={config.variant} className="action-badge">
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.text}
      </Badge>
    );
  };

  // Tablo adı formatlaması
  const formatTableName = (tableName) => {
    const tableNames = {
      requests: "TALEPLER",
      contacts: "KİŞİLER",
      messages: "MESAJLAR",
      categories: "KATEGORİLER",
      users: "KULLANICILAR",
    };

    return tableNames[tableName] || tableName.toUpperCase();
  };

  // Admin kontrolü
  const isAdmin = user && (user.role === 'admin' || user.role === 'başkan' || user.department === 'BAŞKAN');

  if (!isAdmin) {
    return (
      <div className="activities-table-container">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Yetkisiz Erişim</Alert.Heading>
          <p>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="activities-table-container">
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
                d="M19.5 3.25C10.3975 3.25 3.25 10.3975 3.25 19.5C3.25 28.6025 10.3975 35.75 19.5 35.75C28.6025 35.75 35.75 28.6025 35.75 19.5C35.75 10.3975 28.6025 3.25 19.5 3.25ZM19.5 6.5C26.7825 6.5 32.5 12.2175 32.5 19.5C32.5 26.7825 26.7825 32.5 19.5 32.5C12.2175 32.5 6.5 26.7825 6.5 19.5C6.5 12.2175 12.2175 6.5 19.5 6.5Z"
                fill="#4E0DCC"
              />
              <path
                d="M19.5 9.75C18.8025 9.75 18.125 10.1725 17.875 10.8375L17.225 12.675C16.975 13.34 17.3975 14.0175 18.125 14.0175H20.875C21.6025 14.0175 22.025 13.34 21.775 12.675L21.125 10.8375C20.875 10.1725 20.1975 9.75 19.5 9.75ZM19.5 17.875C18.6825 17.875 18.125 18.4325 18.125 19.25V26C18.125 26.8175 18.6825 27.375 19.5 27.375C20.3175 27.375 20.875 26.8175 20.875 26V19.25C20.875 18.4325 20.3175 17.875 19.5 17.875Z"
                fill="#4E0DCC"
              />
            </svg>
          </div>
          <h2 className="header-title">SİSTEM AKTİVİTELERİ</h2>
        </div>
        
        {/* Arama ve Filtreler */}
        <div className="header-center">
          <Row className="g-3 align-items-center">
            <Col md={6}>
              <div className="search-container">
                <Form.Control
                  type="text"
                  placeholder="Kullanıcı, açıklama veya tablo adı ile ara..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="search-input"
                />
                <div className="search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                      stroke="#999"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <Form.Select
                value={actionTypeFilter}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="filter-select"
              >
                <option value="">Tüm İşlemler</option>
                <option value="CREATE">Oluşturma</option>
                <option value="UPDATE">Güncelleme</option>
                <option value="DELETE">Silme</option>
                <option value="READ">Görüntüleme</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={tableNameFilter}
                onChange={(e) => handleFilterChange('tableName', e.target.value)}
                className="filter-select"
              >
                <option value="">Tüm Tablolar</option>
              </Form.Select>
            </Col>
          </Row>
        </div>
        
        <div className="header-right">
          <Button
            variant="outline-primary"
            onClick={() => window.location.reload()}
            title="Yenile"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 4V10H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 20V14H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          <Alert.Heading>Hata!</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {/* Tablo */}
      <div className="table-wrapper">
        <Table className="activities-table">
          <thead>
            <tr>
              <th>SIRA</th>
              <th>TARİH</th>
              <th>KULLANICI</th>
              <th>İŞLEM</th>
              <th>TABLO</th>
              <th>AÇIKLAMA</th>
              <th>IP ADRESİ</th>
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
                    <span className="ms-2">Aktiviteler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir aktivite bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              activities.map((activity, index) => (
                <tr key={activity.id}>
                  <td>{(currentPage - 1) * activitiesPerPage + index + 1}</td>
                  <td className="date-cell">
                    {activity.created_at_display || 'N/A'}
                  </td>
                  <td className="user-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {activity.user_name?.charAt(0) || 'U'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{activity.user_name}</div>
                        <div className="user-email">{activity.user_email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{getActionTypeBadge(activity.action_type)}</td>
                  <td className="table-name">
                    <Badge bg="light" text="dark">
                      {formatTableName(activity.table_name)}
                    </Badge>
                  </td>
                  <td className="description-cell">
                    <div className="description-text">
                      {activity.description}
                    </div>
                  </td>
                  <td className="ip-cell">
                    {activity.ip_address || '-'}
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
          TOPLAM {totalRecords.toLocaleString("tr-TR")} AKTİVİTE KAYDI BULUNMAKTADIR
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
    </div>
  );
};

export default ActivitiesTable;