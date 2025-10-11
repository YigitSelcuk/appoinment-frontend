import React, { useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import CategoryTable from '../../components/CategoryTable/CategoryTable';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import './Categories.css';

const Categories = () => {
  useEffect(() => {
    // Categories sayfasında body'ye class ekle
    document.body.classList.add('categories-page');
    
    // Component unmount olduğunda class'ı kaldır
    return () => {
      document.body.classList.remove('categories-page');
    };
  }, []);

  return (
    <div className="categories-page">
      <div className="categories-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - Kategori Tablosu */}
        <div className="categories-content">
          <CategoryTable />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default Categories;
