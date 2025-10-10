import React, { useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import ContactsTable from '../../components/ContactsTable/ContactsTable';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import './Contacts.css';

const Contacts = () => {
  useEffect(() => {
    // Contacts sayfasında body'ye class ekle
    document.body.classList.add('contacts-page');
    
    // Component unmount olduğunda class'ı kaldır
    return () => {
      document.body.classList.remove('contacts-page');
    };
  }, []);

  return (
    <div className="contacts-page">
      <div className="contacts-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - Rehber Tablosu ve SMS Sistemi */}
        <div className="contacts-content">
          <ContactsTable />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default Contacts;
