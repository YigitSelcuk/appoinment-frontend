import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Table, Form, Pagination } from "react-bootstrap";
import { FaCheck, FaTimes } from "react-icons/fa";
import { getTasks, deleteTask, updateTaskApproval, deleteMultipleTasks } from "../../services/tasksService";
import AddTaskModal from "../AddTaskModal/AddTaskModal";
import ViewTaskModal from "../ViewTaskModal/ViewTaskModal";
import EditTaskModal from "../EditTaskModal/EditTaskModal";
import DeleteTaskModal from "../DeleteTaskModal/DeleteTaskModal";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import { useAuth } from "../../contexts/AuthContext";
import "./TasksTable.css";

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
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Modal state'leri
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);


  
  // Ref'ler
  const tableWrapperRef = useRef(null);

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

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedTask(null);
  };

  const handleTaskDeleted = () => {
    fetchTasksData(); // Listeyi yenile
    setShowDeleteModal(false);
    setSelectedTask(null);
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) {
      showError('Lütfen silmek istediğiniz görevleri seçin');
      return;
    }

    const confirmMessage = `${selectedTasks.length} görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteMultipleTasks(accessToken, selectedTasks);
      showSuccess(`${selectedTasks.length} görev başarıyla silindi`);
      setSelectedTasks([]);
      setSelectAll(false);
      fetchTasksData(); // Listeyi yenile
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen bir hata oluştu';
      showError('Görevler silinirken hata oluştu: ' + errorMessage);
    }
  };

  // Sayfa değiştirme
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Onay durumu değiştirme
  const handleApprovalToggle = async (task) => {
    try {
      const isCurrentlyApproved = task.approval === 'ONAYLANDI';
      const newApprovalStatus = isCurrentlyApproved ? 'ONAY BEKLİYOR' : 'ONAYLANDI';
      await updateTaskApproval(accessToken, task.id, newApprovalStatus);
      fetchTasksData(); // Listeyi yenile
      showSuccess(`Görev ${isCurrentlyApproved ? 'onayı kaldırıldı' : 'onaylandı'}!`);
    } catch (error) {
      console.error('Onay durumu güncellenirken hata:', error);
      showError('Onay durumu güncellenirken bir hata oluştu!');
    }
  };



  return (
    <div className="tasks-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
           <img style={{width: '35px', height: '35px'}} src="/assets/images/task.png" alt="task" />
          </div>
          <h2 className="header-title">GÖREV</h2>
        </div>

        <div className="header-center">
          {/* Status Filter - Ortada */}
          <div className="status-buttons">
            {Object.keys(statusCounts).map((status, index) => (
              <div
                key={status}
                className={`status-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange(status)}
              >
                <div className="status-number">{statusCounts[status]}</div>
                <div className="status-name">{status}</div>
                <div className={`status-line status-line-${index + 1}`}></div>
              </div>
            ))}
          </div>
        </div>

        <div className="header-right">
          {selectedTasks.length > 0 && (
            <button
              className="header-btn bulk-delete-btn"
              onClick={handleBulkDelete}
              title={`${selectedTasks.length} görevi sil`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>SİL ({selectedTasks.length})</span>
            </button>
          )}
          
          <button
            className="add-task-btn"
            onClick={handleShowAddModal}
            title="Görev Ekle"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12ZM12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4Z"
                fill="#12B423"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13 7C13 6.73478 12.8946 6.48043 12.7071 6.29289C12.5196 6.10536 12.2652 6 12 6C11.7348 6 11.4804 6.10536 11.2929 6.29289C11.1054 6.48043 11 6.73478 11 7V11H7C6.73478 11 6.48043 11.1054 6.29289 11.2929C6.10536 11.4804 6 11.7348 6 12C6 12.2652 6.10536 12.5196 6.29289 12.7071C6.48043 12.8946 6.73478 13 7 13H11V17C11 17.2652 11.1054 17.5196 11.2929 17.7071C11.4804 17.8946 11.7348 18 12 18C12.2652 18 12.5196 17.8946 12.7071 17.7071C12.8946 17.5196 13 17.2652 13 17V13H17C17.2652 13 17.5196 12.8946 17.7071 12.7071C17.8946 12.5196 18 12.2652 18 12C18 11.7348 17.8946 11.4804 17.7071 11.2929C17.5196 11.1054 17.2652 11 17 11H13V7Z"
                fill="#12B423"
              />
            </svg>
            <span>GÖREV EKLE</span>
          </button>

          {/* Header Actions Menu (1500px ve altı için gösterilecek) */}
          <div className="dropdown header-actions-dropdown">
            <button
              className="header-btn dropdown-toggle action-menu-btn"
              type="button"
              aria-expanded={headerMenuOpen}
              onClick={() => setHeaderMenuOpen(prev => !prev)}
              title="Menü"
            >
              {/* Üç nokta ikon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="5" cy="12" r="2" fill="#6c757d" />
                <circle cx="12" cy="12" r="2" fill="#6c757d" />
                <circle cx="19" cy="12" r="2" fill="#6c757d" />
              </svg>
            </button>
            <div className={`dropdown-menu ${headerMenuOpen ? 'show' : ''}`}>
              <button className="dropdown-item" onClick={() => { setHeaderMenuOpen(false); handleShowAddModal(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5v14M5 12h14" stroke="#12B423" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Görev Ekle
              </button>
              {selectedTasks.length > 0 && (
                <button className="dropdown-item text-danger" onClick={() => { setHeaderMenuOpen(false); handleBulkDelete(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Toplu Sil ({selectedTasks.length})
                </button>
              )}
            </div>
          </div>

        </div>
      </div>



      {/* Tablo */}
      <div className="table-wrapper" ref={tableWrapperRef}>
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
              <th>BAŞLANGIÇ - BİTİŞ</th>
              <th>AÇIKLAMA</th>
              <th>ATANAN KİŞİ</th>
              <th>DURUM</th>
              <th>ONAY</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <span className="ms-2">Veriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-search me-2"></i>
                    Herhangi bir kayıt bulunamadı
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
                      className="contact-checkbox"
                    />
                  </td>
                  <td>{(currentPage - 1) * tasksPerPage + index + 1}</td>
                  <td>
                    <div className="date-range">
                      <span className="start-date">
                        {task.start_date ? new Date(task.start_date).toLocaleDateString('tr-TR') : '-'}
                      </span>
                      <span className="date-separator"> - </span>
                      <span className="end-date">
                        {task.end_date ? new Date(task.end_date).toLocaleDateString('tr-TR') : '-'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="task-description">
                      <div className="task-title">{task.title}</div>
                      <div className="task-desc">{task.description}</div>
                    </div>
                  </td>
                  <td>{task.assignee_full_name || task.assignee_name || '-'}</td>
                  <td>
                    <span className={`status-badge status-${task.status.toLowerCase()}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <div 
                      className={`approval-icon ${task.approval === 'ONAYLANDI' ? 'approved' : 'not-approved'}`}
                      onClick={() => handleApprovalToggle(task)}
                      title={task.approval === 'ONAYLANDI' ? 'Onayı Kaldır' : 'Onayla'}
                    >
                      {task.approval === 'ONAYLANDI' ? (
                        <FaCheck className="check-icon" />
                      ) : (
                        <FaTimes className="times-icon" />
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

      {/* Görev Ekleme Modal */}
      <AddTaskModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onTaskAdded={handleTaskAdded}
      />

      {/* Görev Görüntüleme Modal */}
      <ViewTaskModal
        show={showViewModal}
        onHide={handleCloseViewModal}
        task={selectedTask}
      />

      {/* Görev Düzenleme Modal */}
      <EditTaskModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Görev Silme Modal */}
      <DeleteTaskModal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        task={selectedTask}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
};

// Portal tabanlı aksiyon menüsü (ContactsTable ile aynı yaklaşım)
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
    <div ref={menuRef} className="task-actions-menu" style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:2147483647, minWidth:180, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
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

export default TasksTable;