import React, { useState, useEffect } from "react";
import { 
  Table, 
  Form, 
  Dropdown, 
  Pagination, 
  Spinner, 
  Button,
  Badge 
} from "react-bootstrap";
import requestsService from "../../services/requestsService";
import UpdateRequestStatusModal from "../UpdateRequestStatusModal/UpdateRequestStatusModal";
import RequestHistoryModal from "../RequestHistoryModal/RequestHistoryModal";
import ViewRequestModal from "../ViewRequestModal/ViewRequestModal";
import { useAuth } from "../../contexts/AuthContext";
import "./DepartmentRequestsTable.css";

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

const DepartmentRequestsTable = () => {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [department, setDepartment] = useState("");

  // Modal state'leri
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchDepartmentRequests();
  }, [currentPage, debouncedSearchTerm, accessToken]);

  const fetchDepartmentRequests = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: requestsPerPage,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      };

      const response = await requestsService.getDepartmentRequests(params, accessToken);

      if (response.success) {
        setRequests(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.pagination.totalRecords);
        setDepartment(response.department);
      }
    } catch (error) {
      console.error("Müdürlük talepleri yüklenirken hata:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
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
    fetchDepartmentRequests();
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "DÜŞÜK": return "success";
      case "NORMAL": return "info";
      case "ACİL": return "warning";
      case "ÇOK ACİL": return "danger";
      case "KRİTİK": return "danger";
      case "İNCELENİYOR": return "secondary";
      case "ÇÖZÜM AŞAMASINDA": return "primary";
      case "TEST AŞAMASINDA": return "info";
      case "TAMAMLANDI": return "success";
      case "İPTAL EDİLDİ": return "secondary";
      case "REDDEDİLDİ": return "danger";
      case "BEKLEMEDE": return "warning";
      case "ATANDI": return "info";
      default: return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "DÜŞÜK": return "success";
      case "NORMAL": return "info";
      case "KRİTİK": return "danger";
      default: return "secondary";
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    return items;
  };

  return (
    <div className="department-requests-table">
      <div className="table-header">
        <div className="header-left">
          <h4 className="table-title">
            {department} - Müdürlük Talepleri
          </h4>
          <span className="request-count">
            {totalRecords} talep bulunmaktadır
          </span>
        </div>
        
        <div className="header-right">
          <div className="search-box">
            <Form.Control
              type="text"
              placeholder="Ad, soyad, TC, telefon, başlık ile ara..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <Table responsive hover className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Talep Eden</th>
              <th>Telefon</th>
              <th>Talep Başlığı</th>
              <th>Talep Türü</th>
              <th>Öncelik</th>
              <th>Durum</th>
              <th>Oluşturulma</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 mb-0">Talepler yükleniyor...</p>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <p className="mb-0">
                    {searchTerm ? "Arama kriterlerine uygun talep bulunamadı." : "Henüz talep bulunmamaktadır."}
                  </p>
                </td>
              </tr>
            ) : (
              requests.map((request, index) => (
                <tr key={request.id}>
                  <td className="row-number">
                    {(currentPage - 1) * requestsPerPage + index + 1}
                  </td>
                  <td>
                    <div className="requester-info">
                      <div className="name">{request.ad} {request.soyad}</div>
                      <small className="text-muted">{request.tc_no}</small>
                    </div>
                  </td>
                  <td>{request.telefon}</td>
                  <td>
                    <div className="request-title">
                      {request.talep_basligi}
                    </div>
                  </td>
                  <td>
                    <small className="request-type">
                      {request.talep_turu}
                    </small>
                  </td>
                  <td>
                    <Badge bg={getPriorityBadgeVariant(request.talep_durumu)}>
                      {request.talep_durumu}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(request.durum)}>
                      {request.durum}
                    </Badge>
                  </td>
                  <td>
                    <small className="date-text">
                      {request.created_at_display}
                    </small>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle
                        as="button"
                        className="action-button"
                        id={`dropdown-${request.id}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 9.33C8.73 9.33 9.33 8.73 9.33 8C9.33 7.27 8.73 6.67 8 6.67C7.27 6.67 6.67 7.27 6.67 8C6.67 8.73 7.27 9.33 8 9.33ZM8 4C8.73 4 9.33 3.4 9.33 2.67C9.33 1.94 8.73 1.34 8 1.34C7.27 1.34 6.67 1.94 6.67 2.67C6.67 3.4 7.27 4 8 4ZM8 12C8.73 12 9.33 12.6 9.33 13.33C9.33 14.06 8.73 14.66 8 14.66C7.27 14.66 6.67 14.06 6.67 13.33C6.67 12.6 7.27 12 8 12Z"
                            fill="#6c757d"
                          />
                        </svg>
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleViewRequest(request)}>
                          👁️ Görüntüle
                        </Dropdown.Item>
                        
                        <Dropdown.Item onClick={() => handleUpdateStatus(request)}>
                          🔄 Durum Güncelle
                        </Dropdown.Item>
                        
                        <Dropdown.Item onClick={() => handleViewHistory(request)}>
                          📋 Geçmişi Görüntüle
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="table-footer">
          <div className="total-records">
            TOPLAM {totalRecords.toLocaleString("tr-TR")} KAYIT BULUNMAKTADIR
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
              
              {renderPaginationItems()}
              
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
      )}

      {/* Modaller */}
      <UpdateRequestStatusModal
        show={showUpdateStatusModal}
        onHide={() => setShowUpdateStatusModal(false)}
        request={selectedRequest}
        onStatusUpdated={handleStatusUpdated}
      />

      <RequestHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        request={selectedRequest}
      />

      <ViewRequestModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        request={selectedRequest}
      />
    </div>
  );
};

export default DepartmentRequestsTable;