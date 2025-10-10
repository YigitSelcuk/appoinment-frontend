import React, { useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import RequestsTable from '../../components/RequestsTable/RequestsTable';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import './Requests.css';

const Requests = () => {
  useEffect(() => {
    // Requests sayfasında body'ye class ekle
    document.body.classList.add('requests-page');
    
    // Component unmount olduğunda class'ı kaldır
    return () => {
      document.body.classList.remove('requests-page');
    };
  }, []);

  return (
    <div className="requests-page">
      <div className="requests-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - Talepler Tablosu */}
        <div className="requests-content">
          <RequestsTable />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default Requests;
