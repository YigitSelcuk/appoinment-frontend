import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pagination, Form } from 'react-bootstrap';
import '../TasksTable/TasksTable.css';
import './UsersTable.css';

const UsersTable = ({ 
  users = [], 
  onClickAdd, 
  onSearchChange, 
  onView, 
  onEdit, 
  onDelete,
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  usersPerPage = 14,
  onPageChange,
  searchTerm = ""
}) => {
  const handlePageChange = (page) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="contacts-table-container">
      {/* Başlık Barı */}
      <div className="header-bar">
        <div className="header-left">
          <div className="header-icon">
            <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#4E0DCC"/>
            </svg>
          </div>
          <h2 className="header-title">YÖNETİM</h2>
        </div>

        {/* Arama Kutusu - Ortada */}
        <div className="header-center">
          <div className="search-container">
            <Form.Control
              type="text"
              placeholder="Ad, soyad, email veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="header-right">
          <button
            className="header-btn"
            onClick={onClickAdd}
            title="Kullanıcı Ekle"
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
        </div>
      </div>

      {/* Tablo Wrapper */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="contacts-table">
            <thead>
              <tr>
                <th><input type="checkbox" disabled /></th>
                <th>SIRA</th>
                <th>KAYIT</th>
                <th>ADI</th>
                <th>SOYADI</th>
                <th>ÜNVANI</th>
                <th>TELEFON</th>
                <th>EMAİL</th>
                <th>YETKİ</th>
                <th>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const [firstName, ...rest] = (u.name || '').split(' ');
                const lastName = rest.join(' ');
                const roleChip = u.role === 'admin' ? 'ADMİN' : 'KULLANICI';
                return (
                  <tr key={u.id}>
                    <td><Form.Check type="checkbox" /></td>
                    <td>{(currentPage - 1) * usersPerPage + idx + 1}</td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : ''}</td>
                    <td className="text-primary">{firstName}</td>
                    <td className="text-muted">{lastName}</td>
                    <td className="text-link">{u.title || '-'}</td>
                    <td>{u.phone || '-'}</td>
                    <td className="email">{u.email}</td>
                    <td>
                      <div className={`chip ${u.role === 'admin' ? 'chip--purple' : 'chip--gray'}`}>{roleChip}</div>
                    </td>
                    <td>
                      <ActionMenu
                        onView={() => onView && onView(u)}
                        onEdit={() => onEdit && onEdit(u)}
                        onDelete={() => onDelete && onDelete(u)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alt Bilgi ve Sayfalama */}
      <div className="table-footer">
        <div className="total-records">
          TOPLAM {totalRecords.toLocaleString("tr-TR")} KULLANICI BULUNMAKTADIR
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

export default UsersTable;

// Lightweight custom dropdown rendered to body to avoid clipping
const ActionMenu = ({ onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  const toggle = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right - 180 });
    setOpen((p) => !p);
  };

  const menu = (
    <div
      ref={menuRef}
      className="user-actions-menu"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 2147483647, minWidth: 180, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
    >
      <div className="dropdown-item" onClick={() => { setOpen(false); onView && onView(); }} style={{ cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#4E0DCC" style={{ marginRight: 8 }}><path d="M12 6a9.77 9.77 0 0 0-9 6 9.77 9.77 0 0 0 18 0 9.77 9.77 0 0 0-9-6Zm0 10a4 4 0 1 1 4-4 4.005 4.005 0 0 1-4 4Z"/></svg>
        Görüntüle
      </div>
      <div className="dropdown-item" onClick={() => { setOpen(false); onEdit && onEdit(); }} style={{ cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#28a745" style={{ marginRight: 8 }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82Z"/></svg>
        Düzenle
      </div>
      <div className="dropdown-item text-danger" onClick={() => { setOpen(false); onDelete && onDelete(); }} style={{ cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#dc3545" style={{ marginRight: 8 }}><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6Zm12-13h-3.5l-1-1h-3l-1 1H6v2h12Z"/></svg>
        Sil
      </div>
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


