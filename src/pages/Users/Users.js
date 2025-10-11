import React, { useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import UsersTable from '../../components/UsersTable/UsersTable';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import './Users.css';

const Users = () => {
  useEffect(() => {
    // Users sayfasında body'ye class ekle
    document.body.classList.add('users-page');
    
    // Component unmount olduğunda class'ı kaldır
    return () => {
      document.body.classList.remove('users-page');
    };
  }, []);

  return (
    <div className="users-page">
      <div className="users-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - Kullanıcılar Tablosu */}
        <div className="users-content">
          <UsersTable />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default Users;
