import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import Calendar from '../../components/Calendar/Calendar';
import CVTable from '../../components/CVTable/CVTable';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import './CV.css';

const CV = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useSimpleToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    position: ''
  });

  useEffect(() => {
    // CV sayfasında body'ye class ekle
    document.body.classList.add('cv-page');
    
    // Component unmount olduğunda class'ı kaldır
    return () => {
      document.body.classList.remove('cv-page');
    };
  }, []);

  // Mock CV data - resimdeki tabloya uygun data
  // Filter change handler
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Refresh handler
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="cv-page">
      <div className="cv-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - CV Tablosu */}
        <div className="cv-content">
          <CVTable 
            filters={filters}
            onFilterChange={handleFilterChange}
            onRefresh={refreshTrigger}
          />
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