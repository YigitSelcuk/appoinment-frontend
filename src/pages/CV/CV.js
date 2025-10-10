import React, { useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import CVTable from '../../components/CVTable/CVTable';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import './CV.css';

const CV = () => {
  useEffect(() => {
    // CV sayfasında body'ye class ekle
    document.body.classList.add('cv-page');
    
    // Component unmount olduğunda class'ı kaldır
    return () => {
      document.body.classList.remove('cv-page');
    };
  }, []);

  return (
    <div className="cv-page">
      <div className="cv-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - CV Tablosu */}
        <div className="cv-content">
          <CVTable />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default CV;