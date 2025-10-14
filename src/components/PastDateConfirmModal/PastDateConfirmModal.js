import React from 'react';
import './PastDateConfirmModal.css';

const PastDateConfirmModal = ({ isOpen, onClose, onConfirm, selectedDate }) => {
  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Geçersiz tarih';
    
    try {
      let date;
      
      if (dateStr instanceof Date) {
        date = dateStr;
      } else if (typeof dateStr === 'string') {
        // yyyy-MM-dd formatını parse et
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Diğer string formatları için
          date = new Date(dateStr);
        }
      } else {
        return 'Geçersiz tarih';
      }
      
      // Geçerli tarih kontrolü
      if (isNaN(date.getTime())) {
        return 'Geçersiz tarih';
      }
      
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Tarih formatı hatası:', error);
      return 'Geçersiz tarih';
    }
  };

  return (
    <div className="past-date-modal-overlay" onClick={onClose}>
      <div className="past-date-modal" onClick={(e) => e.stopPropagation()}>
        <div className="past-date-modal-header">
          <div className="past-date-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13L14.5 15.5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="past-date-title">Geçmiş Tarih Uyarısı</h3>
        </div>
        
        <div className="past-date-modal-body">
          <p className="past-date-message">
            Seçilen tarih <strong>{formatDate(selectedDate)}</strong> bugünden önceki bir tarih.
          </p>
          <p className="past-date-question">
            Yine de bu tarih için randevu oluşturmak istiyor musunuz?
          </p>
        </div>
        
        <div className="past-date-modal-footer">
          <button 
            className="past-date-btn past-date-btn-cancel" 
            onClick={onClose}
          >
            İptal
          </button>
          <button 
            className="past-date-btn past-date-btn-confirm" 
            onClick={onConfirm}
          >
            Evet, Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};

export default PastDateConfirmModal;