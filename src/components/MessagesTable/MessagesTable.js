import React, { useState, useEffect } from "react";
import { Table, Form, Pagination, Button, Badge } from "react-bootstrap";
import { smsService } from "../../services/smsService";
import "./MessagesTable.css";

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

const MessagesTable = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(15);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce

  // API'den SMS loglarını getir
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: messagesPerPage,
        ...(debouncedSearchTerm && { phone: debouncedSearchTerm }),
        ...(statusFilter && { status: statusFilter })
      };

      const response = await smsService.getSMSHistory(params);

      if (response.success) {
        setMessages(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.pagination.total);
      } else {
        console.error("SMS geçmişi yüklenirken hata:", response.message);
        setMessages([]);
      }
    } catch (error) {
      console.error("SMS geçmişi yüklenirken hata:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Component mount edildiğinde ve sayfa/arama değiştiğinde mesajları yükle
  useEffect(() => {
    fetchMessages();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  // Arama terimi değiştiğinde sayfa numarasını sıfırla
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Durum filtresi değiştiğinde
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Sayfa değiştirme
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Tümünü seç/seçme
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(msg => msg.id));
    }
    setSelectAll(!selectAll);
  };

  // Tekil mesaj seçme
  const handleSelectMessage = (messageId) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(selectedMessages.filter(id => id !== messageId));
    } else {
      setSelectedMessages([...selectedMessages, messageId]);
    }
  };

  // Seçili mesajları sil
  const handleDeleteSelected = () => {
    if (selectedMessages.length === 0) {
      alert("Lütfen silmek için en az bir mesaj seçin.");
      return;
    }
    
    if (window.confirm(`${selectedMessages.length} mesajı silmek istediğinizden emin misiniz?`)) {
      // SMS log silme işlemi buraya eklenecek
      console.log("Silinecek mesajlar:", selectedMessages);
      alert("Silme işlemi henüz implementasyonda değil.");
    }
  };

  // Durum badge rengi
  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <Badge bg="success">Gönderildi</Badge>;
      case 'failed':
        return <Badge bg="danger">Başarısız</Badge>;
      case 'pending':
        return <Badge bg="warning">Beklemede</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Tarihi formatla
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="messages-table-container">
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
          <h2 className="header-title">SMS GÖNDERİM GEÇMİŞİ</h2>
        </div>
        <div className="header-center">
          <div className="search-input-container">
            <Form.Control
              type="text"
              placeholder="Telefon numarasında ara..."
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
          <div className="status-filter-container me-3">
            <Form.Select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="status-filter-select"
              style={{ width: '150px' }}
            >
              <option value="">Tüm Durumlar</option>
              <option value="sent">Gönderildi</option>
              <option value="failed">Başarısız</option>
              <option value="pending">Beklemede</option>
            </Form.Select>
          </div>
          
          {selectedMessages.length > 0 && (
            <button
              className="header-btn delete-selected-btn me-2"
              onClick={handleDeleteSelected}
              title={`${selectedMessages.length} mesajı sil`}
              style={{ backgroundColor: '#dc3545', color: 'white' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 6V12M10 6V12M2 4H14M12 4V14C12 14.5523 11.5523 15 11 15H5C4.44772 15 4 14.5523 4 14V4M7 4V2C7 1.44772 7.44772 1 8 1H8C8.55228 1 9 1.44772 9 2V4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sil ({selectedMessages.length})
            </button>
          )}
          <button className="header-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.61935 7.51463C6.57273 7.45587 6.51483 7.40703 6.44906 7.37099C6.38329 7.33494 6.31097 7.31241 6.23636 7.30472C6.16175 7.29703 6.08635 7.30435 6.01461 7.32623C5.94287 7.34811 5.87623 7.38412 5.81861 7.43213C5.76099 7.48015 5.71355 7.53921 5.67909 7.60583C5.64463 7.67245 5.62384 7.74528 5.61795 7.82006C5.61206 7.89483 5.62118 7.97003 5.64477 8.04122C5.66837 8.11242 5.70597 8.17818 5.75535 8.23463L8.26748 11.2496L5.75535 14.2646C5.66408 14.3797 5.62141 14.5258 5.63646 14.6719C5.65151 14.818 5.72308 14.9524 5.83589 15.0464C5.9487 15.1404 6.0938 15.1866 6.2402 15.175C6.38659 15.1635 6.52266 15.0952 6.61935 14.9846L8.99985 12.1283L11.3804 14.9858C11.476 15.1003 11.6132 15.1722 11.7618 15.1856C11.8354 15.1923 11.9096 15.1843 11.9802 15.1623C12.0507 15.1403 12.1162 15.1045 12.1729 15.0572C12.2296 15.0098 12.2765 14.9518 12.3108 14.8863C12.3451 14.8209 12.3661 14.7493 12.3728 14.6757C12.3794 14.6021 12.3715 14.5279 12.3495 14.4574C12.3274 14.3869 12.2917 14.3214 12.2444 14.2646L9.73223 11.2496L12.2444 8.23463C12.3356 8.11959 12.3783 7.97343 12.3632 7.82735C12.3482 7.68128 12.2766 7.54688 12.1638 7.45288C12.051 7.35887 11.9059 7.3127 11.7595 7.32424C11.6131 7.33578 11.477 7.40411 11.3804 7.51463L8.99985 10.371L6.61935 7.51463Z"
                fill="#09C71D"
              />
              <path
                d="M15.75 15.75V5.0625L10.6875 0H4.5C3.90326 0 3.33097 0.237053 2.90901 0.65901C2.48705 1.08097 2.25 1.65326 2.25 2.25V15.75C2.25 16.3467 2.48705 16.919 2.90901 17.341C3.33097 17.7629 3.90326 18 4.5 18H13.5C14.0967 18 14.669 17.7629 15.091 17.341C15.5129 16.919 15.75 16.3467 15.75 15.75ZM10.6875 3.375C10.6875 3.82255 10.8653 4.25178 11.1818 4.56824C11.4982 4.88471 11.9274 5.0625 12.375 5.0625H14.625V15.75C14.625 16.0484 14.5065 16.3345 14.2955 16.5455C14.0845 16.7565 13.7984 16.875 13.5 16.875H4.5C4.20163 16.875 3.91548 16.7565 3.7045 16.5455C3.49353 16.3345 3.375 16.0484 3.375 15.75V2.25C3.375 1.95163 3.49353 1.66548 3.7045 1.4545C3.91548 1.24353 4.20163 1.125 4.5 1.125H10.6875V3.375Z"
                fill="#09C71D"
              />
            </svg>
          </button>
          <button className="header-btn">
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
          <button className="header-btn">
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
          <button className="header-btn">
            <svg
              width="3"
              height="15"
              viewBox="0 0 3 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="1.5" cy="1.5" r="1.5" fill="#A4B8BD" />
              <circle cx="1.5" cy="7.5" r="1.5" fill="#A4B8BD" />
              <circle cx="1.5" cy="13.5" r="1.5" fill="#A4B8BD" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="table-wrapper">
        <Table className="messages-table">
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
              <th>TELEFON NUMARASI</th>
              <th>MESAJ</th>
              <th>LİSTE ADI</th>
              <th>GÖNDERİM BAŞLIĞI</th>
              <th>DURUM</th>
              <th>GÖNDERİM ZAMANI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="no-data">
                    <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">SMS geçmişi bulunamadı</h5>
                  </div>
                </td>
              </tr>
            ) : (
              messages.map((message, index) => (
              <tr key={message.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedMessages.includes(message.id)}
                    onChange={() => handleSelectMessage(message.id)}
                    className="message-checkbox"
                  />
                </td>
                <td>{(currentPage - 1) * messagesPerPage + index + 1}</td>
                <td className="phone-number">{message.phone_number}</td>
                <td className="message-text" title={message.message}>
                  {message.message.length > 50 ? 
                    `${message.message.substring(0, 50)}...` : 
                    message.message
                  }
                </td>
                <td className="list-name">{message.list_name}</td>
                <td className="sending-title">{message.sending_title}</td>
                <td className="status">{getStatusBadge(message.status)}</td>
                <td className="sent-date">{formatDate(message.sent_at)}</td>
              </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Alt Bilgi ve Sayfalama */}
      <div className="table-footer">
        <div className="total-records">
          TOPLAM {totalRecords.toLocaleString("tr-TR")} SMS KAYDI BULUNMAKTADIR
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

export default MessagesTable; 