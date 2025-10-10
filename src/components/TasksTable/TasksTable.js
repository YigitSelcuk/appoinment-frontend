import React, { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import {
  Table,
  Button,
  Form,
  Row,
  Col,
  Pagination,
  Modal,
} from "react-bootstrap";
import { getTasks, deleteTask, updateTaskApproval } from "../../services/tasksService";
import AddTaskModal from "../AddTaskModal/AddTaskModal";
import ViewTaskModal from "../ViewTaskModal/ViewTaskModal";
import EditTaskModal from "../EditTaskModal/EditTaskModal";
import DeleteTaskModal from "../DeleteTaskModal/DeleteTaskModal";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { useAuth } from "../../contexts/AuthContext";
import "./TasksTable.css";

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

const TasksTable = () => {
  // Toast hook'u
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  const { accessToken } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(14);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState("Hepsi");
  const [statusCounts, setStatusCounts] = useState({
    'Hepsi': 0,
    'Beklemede': 0,
    'Devam Ediyor': 0,
    'Tamamlandı': 0,
    'İptal Edildi': 0
  });

  // Modal state'leri
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalTask, setApprovalTask] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Backend'den görevleri getir
  const fetchTasksData = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await getTasks(accessToken, {
        page: currentPage,
        limit: tasksPerPage,
        search: debouncedSearchTerm,
        status: statusFilter === "Hepsi" ? "" : statusFilter,
      });

      if (response.success) {
        setTasks(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalRecords(response.pagination.totalRecords);
        if (response.statusCounts) {
          setStatusCounts(response.statusCounts);
        }
      }
    } catch (error) {
      console.error("Görevler yüklenirken hata:", error);
      showError('Görevler yüklenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Component mount edildiğinde ve sayfa değiştiğinde görevleri getir
  useEffect(() => {
    fetchTasksData();
  }, [currentPage, debouncedSearchTerm, statusFilter, accessToken]);

  // Arama terimi değiştiğinde sayfa numarasını sıfırla
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Durum filtresi değiştiğinde sayfa numarasını sıfırla
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
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
      setSelectedTasks(tasks.map((task) => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId) => {
    setSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  // SelectAll checkbox durumunu güncelle
  useEffect(() => {
    if (selectedTasks.length === 0) {
      setSelectAll(false);
    } else if (selectedTasks.length === tasks.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedTasks, tasks]);

  // İşlem fonksiyonları
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleTaskAdded = () => {
    fetchTasksData(); // Listeyi yenile
    setShowAddModal(false);
    showSuccess('Görev başarıyla eklendi!');
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedTask(null);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedTask(null);
  };

  const handleTaskUpdated = () => {
    fetchTasksData(); // Listeyi yenile
    setShowEditModal(false);
    setSelectedTask(null);
    showSuccess('Görev başarıyla güncellendi!');
  };

  const handleDeleteTask = (task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const handleApprovalToggle = (task) => {
    setApprovalTask(task);
    setShowApprovalModal(true);
  };

  const confirmApprovalToggle = async () => {
    if (!approvalTask) return;
    
    setApprovalLoading(true);
    const newApprovalStatus = approvalTask.approval === "ONAYLANDI" ? "REDDEDİLDİ" : "ONAYLANDI";
    
    try {
      const response = await updateTaskApproval(accessToken, approvalTask.id, newApprovalStatus);
      
      if (response.success) {
        fetchTasksData();
        setShowApprovalModal(false);
        setApprovalTask(null);
        const message = newApprovalStatus === "ONAYLANDI" ? 'Görev başarıyla onaylandı!' : 'Görev başarıyla reddedildi!';
        showSuccess(message);
      } else {
        console.error("Onay durumu güncellenirken hata oluştu");
        showError('Onay durumu güncellenirken hata oluştu!');
      }
    } catch (error) {
      console.error("Onay durumu güncelleme hatası:", error);
      showError('Onay durumu güncellenirken bir hata oluştu!');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleCloseApprovalModal = () => {
    setShowApprovalModal(false);
    setApprovalTask(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedTask(null);
  };

  const handleTaskDeleted = () => {
    fetchTasksData(); // Listeyi yenile
    setShowDeleteModal(false);
    setSelectedTask(null);
    showSuccess('Görev başarıyla silindi!');
  };

  const handleConfirmDelete = async () => {
    if (!selectedTask) return;
    
    try {
      const response = await deleteTask(accessToken, selectedTask.id);
      
      if (response.success) {
        handleTaskDeleted();
      } else {
        console.error("Görev silinirken hata oluştu");
        showError('Görev silinirken hata oluştu!');
      }
    } catch (error) {
      console.error("Görev silme hatası:", error);
      showError('Görev silinirken bir hata oluştu!');
    }
  };

  // Durum badge'i için renk belirleme
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Beklemede":
        return "beklemede";
      case "Devam Ediyor":
        return "devam-ediyor";
      case "Tamamlandı":
        return "tamamlandi";
      case "İptal Edildi":
        return "iptal-edildi";
      default:
        return "beklemede";
    }
  };

  // Onay badge'i için renk belirleme
  const getApprovalBadgeClass = (approval) => {
    switch (approval) {
      case "ONAYLANDI":
        return "onaylandi";
      case "ONAY BEKLİYOR":
        return "onay-bekliyor";
      case "REDDEDİLDİ":
        return "reddedildi";
      default:
        return "onay-bekliyor";
    }
  };

  return (
    <div className="tasks-table-container">
      {/* Header Bar */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
            <svg
              width="37"
              height="37"
              viewBox="0 0 37 37"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_180_10761)">
              <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.16602 6.16634C6.16602 5.34859 6.49087 4.56433 7.0691 3.9861C7.64734 3.40786 8.4316 3.08301 9.24935 3.08301H27.7493C28.5671 3.08301 29.3514 3.40786 29.9296 3.9861C30.5078 4.56433 30.8327 5.34859 30.8327 6.16634V15.4163H27.7493V6.16634H9.24935V30.833H16.9577V33.9163H9.24935C8.4316 33.9163 7.64734 33.5915 7.0691 33.0133C6.49087 32.435 6.16602 31.6508 6.16602 30.833V6.16634ZM12.3327 12.333C12.3327 11.9241 12.4951 11.532 12.7842 11.2429C13.0733 10.9538 13.4655 10.7913 13.8743 10.7913H23.1243C23.5332 10.7913 23.9254 10.9538 24.2145 11.2429C24.5036 11.532 24.666 11.9241 24.666 12.333C24.666 12.7419 24.5036 13.134 24.2145 13.4231C23.9254 13.7122 23.5332 13.8747 23.1243 13.8747H13.8743C13.4655 13.8747 13.0733 13.7122 12.7842 13.4231C12.4951 13.134 12.3327 12.7419 12.3327 12.333ZM12.3327 18.4997C12.3327 18.0908 12.4951 17.6987 12.7842 17.4096C13.0733 17.1204 13.4655 16.958 13.8743 16.958H15.416C15.8249 16.958 16.217 17.1204 16.5061 17.4096C16.7953 17.6987 16.9577 18.0908 16.9577 18.4997C16.9577 18.9086 16.7953 19.3007 16.5061 19.5898C16.217 19.8789 15.8249 20.0413 15.416 20.0413H13.8743C13.4655 20.0413 13.0733 19.8789 12.7842 19.5898C12.4951 19.3007 12.3327 18.9086 12.3327 18.4997ZM26.2077 21.583C24.9811 21.583 23.8047 22.0703 22.9373 22.9376C22.07 23.805 21.5827 24.9814 21.5827 26.208C21.5827 27.4346 22.07 28.611 22.9373 29.4784C23.8047 30.3457 24.9811 30.833 26.2077 30.833C27.4343 30.833 28.6107 30.3457 29.4781 29.4784C30.3454 28.611 30.8327 27.4346 30.8327 26.208C30.8327 24.9814 30.3454 23.805 29.4781 22.9376C28.6107 22.0703 27.4343 21.583 26.2077 21.583ZM18.4993 26.208C18.4993 24.1636 19.3115 22.203 20.7571 20.7574C22.2027 19.3118 24.1633 18.4997 26.2077 18.4997C28.2521 18.4997 30.2127 19.3118 31.6583 20.7574C33.1039 22.203 33.916 24.1636 33.916 26.208C33.916 28.2524 33.1039 30.213 31.6583 31.6586C30.2127 33.1042 28.2521 33.9163 26.2077 33.9163C24.1633 33.9163 22.2027 33.1042 20.7571 31.6586C19.3115 30.213 18.4993 28.2524 18.4993 26.208ZM26.2077 22.3538C26.6166 22.3538 27.0087 22.5163 27.2978 22.8054C27.5869 23.0945 27.7493 23.4866 27.7493 23.8955V24.6663C28.1582 24.6663 28.5504 24.8288 28.8395 25.1179C29.1286 25.407 29.291 25.7991 29.291 26.208C29.291 26.6169 29.1286 27.009 28.8395 27.2981C28.5504 27.5873 28.1582 27.7497 27.7493 27.7497H26.2077C25.7988 27.7497 25.4067 27.5873 25.1176 27.2981C24.8284 27.009 24.666 26.6169 24.666 26.208V23.8955C24.666 23.4866 24.8284 23.0945 25.1176 22.8054C25.4067 22.5163 25.7988 22.3538 26.2077 22.3538Z"
                  fill="#3C02AA"
                />
              </g>
              <defs>
                <clipPath id="clip0_180_10761">
                  <rect width="37" height="37" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <h2 className="header-title">GÖREVLER</h2>
        </div>
        <div className="header-center">
          <div className="search-input-container">
            <Form.Control
              type="text"
              placeholder="Görevlerde ara..."
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
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2Z"
                fill="#12B423"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11 5C11 4.73478 10.8946 4.48043 10.7071 4.29289C10.5196 4.10536 10.2652 4 10 4C9.73478 4 9.48043 4.10536 9.29289 4.29289C9.10536 4.48043 9 4.73478 9 5V9H5C4.73478 9 4.48043 9.10536 4.29289 9.29289C4.10536 9.48043 4 9.73478 4 10C4 10.2652 4.10536 10.5196 4.29289 10.7071C4.48043 10.8946 4.73478 11 5 11H9V15C9 15.2652 9.10536 15.5196 9.29289 15.7071C9.48043 15.8946 9.73478 16 10 16C10.2652 16 10.5196 15.8946 10.7071 15.7071C10.8946 15.5196 11 15.2652 11 15V11H15C15.2652 11 15.5196 10.8946 15.7071 10.7071C15.8946 10.5196 16 10.2652 16 10C16 9.73478 15.8946 9.48043 15.7071 9.29289C15.5196 9.10536 15.2652 9 15 9H11V5Z"
                fill="#12B423"
              />
            </svg>

            <span className="add-btn-text">Görev Ekle</span>
          </button>
        </div>
      </div>

      {/* Filtre Göstergeleri */}
      <div className="filter-bar">
        <div className="filter-indicators">
          <button 
            className={`filter-indicator ${statusFilter === "Hepsi" ? "active" : ""}`}
            onClick={() => handleStatusFilterChange("Hepsi")}
          >
            <span className="filter-label">Hepsi</span>
            <span className="filter-count">{statusCounts['Hepsi'] || 0}</span>
          </button>
          <button 
            className={`filter-indicator ${statusFilter === "Devam Ediyor" ? "active" : ""}`}
            onClick={() => handleStatusFilterChange("Devam Ediyor")}
          >
            <span className="filter-label">Devam Ediyor</span>
            <span className="filter-count">{statusCounts['Devam Ediyor'] || 0}</span>
          </button>
          <button 
            className={`filter-indicator ${statusFilter === "Beklemede" ? "active" : ""}`}
            onClick={() => handleStatusFilterChange("Beklemede")}
          >
            <span className="filter-label">Beklemede</span>
            <span className="filter-count">{statusCounts['Beklemede'] || 0}</span>
          </button>
          <button 
            className={`filter-indicator ${statusFilter === "Tamamlandı" ? "active" : ""}`}
            onClick={() => handleStatusFilterChange("Tamamlandı")}
          >
            <span className="filter-label">Tamamlandı</span>
            <span className="filter-count">{statusCounts['Tamamlandı'] || 0}</span>
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="table-wrapper">
        <Table className="tasks-table">
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
              <th>BAŞLANGIÇ</th>
              <th>BİTİŞ</th>
              <th>YAPILACAK GÖREV</th>
              <th>GÖREVLİ</th>
              <th>DURUM</th>
              <th>ONAY</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Görevler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir görev bulunamadı
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => (
                <tr key={task.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => handleSelectTask(task.id)}
                      className="task-checkbox"
                    />
                  </td>
                  <td>{(currentPage - 1) * tasksPerPage + index + 1}</td>
                  <td>{task.start_date_display || "-"}</td>
                  <td>{task.end_date_display || "-"}</td>
                  <td className="task-title">{task.title}</td>
                  <td className="task-assignee">{task.assignee_name || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <div className="approval-status" onClick={() => handleApprovalToggle(task)} style={{cursor: 'pointer'}}>
                      {task.approval === "ONAYLANDI" ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill="#10B981"/>
                          <path d="M6 10L8.5 12.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill="#EF4444"/>
                          <path d="M6 6L14 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 6L6 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </td>
                  <td>
                    <TaskActionMenu
                      onView={() => handleViewTask(task)}
                      onEdit={() => handleEditTask(task)}
                      onDelete={() => handleDeleteTask(task)}
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
          TOPLAM {totalRecords.toLocaleString("tr-TR")} GÖREV BULUNMAKTADIR
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

      {/* Add Task Modal */}
      <AddTaskModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onTaskAdded={handleTaskAdded}
      />

      {/* View Task Modal */}
      <ViewTaskModal
        show={showViewModal}
        onHide={handleCloseViewModal}
        task={selectedTask}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Approval Confirmation Modal */}
      <Modal show={showApprovalModal} onHide={handleCloseApprovalModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Onay Durumu Değişikliği</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {approvalTask && (
            <div className="approval-modal-content">
              <div className="approval-icon">
                {approvalTask.approval === "ONAYLANDI" ? (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#FEF2F2"/>
                    <circle cx="24" cy="24" r="16" fill="#EF4444"/>
                    <path d="M18 18L30 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M30 18L18 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#F0FDF4"/>
                    <circle cx="24" cy="24" r="16" fill="#10B981"/>
                    <path d="M16 24L20 28L32 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="approval-text">
                <h5>
                  {approvalTask.approval === "ONAYLANDI" 
                    ? "Görev Onayını Kaldır" 
                    : "Görevi Onayla"}
                </h5>
                <p>
                  <strong>{approvalTask.title}</strong> adlı görevin onay durumunu{" "}
                  {approvalTask.approval === "ONAYLANDI" 
                    ? "kaldırmak" 
                    : "onaylamak"} istediğinizden emin misiniz?
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseApprovalModal} disabled={approvalLoading}>
            İptal
          </Button>
          <Button 
            variant={approvalTask?.approval === "ONAYLANDI" ? "danger" : "success"} 
            onClick={confirmApprovalToggle}
            disabled={approvalLoading}
          >
            {approvalLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                İşleniyor...
              </>
            ) : (
              approvalTask?.approval === "ONAYLANDI" ? "Onayı Kaldır" : "Onayla"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Task Modal */}
      <DeleteTaskModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        task={selectedTask}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TasksTable;

// Portal tabanlı aksiyon menüsü
const TaskActionMenu = ({ onView, onEdit, onDelete }) => {
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
