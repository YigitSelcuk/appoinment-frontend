import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { smsService } from '../../services/smsService';
import './MessagingModal.css';

// Türkçe locale'i kaydet
registerLocale('tr', tr);

const MessagingModal = ({ show, handleClose, contact, categories = [] }) => {
  const { showSuccess, showError } = useSimpleToast();
  const [messageType, setMessageType] = useState('sms');
  const [message, setMessage] = useState('');
  const [sendTime, setSendTime] = useState('now');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [listName, setListName] = useState('');
  const [sendingTitle, setSendingTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal kapandığında formu temizle
  useEffect(() => {
    if (!show) {
      setMessage('');
      setMessageType('sms');
      setSendTime('now');
      setScheduledDate(null);
      setScheduledTime('');
      setListName('');
      setSendingTitle('');
      setSelectedCategories([]);
      setCategorySearch('');
      setShowCategoryDropdown(false);
      setSelectedPhone('');
      setIsLoading(false);
    }
  }, [show]);

  // Modal açıldığında varsayılan telefon numarasını seç
  useEffect(() => {
    if (show && contact) {
      // SMS için varsayılan olarak phone1'i seç
      if (messageType === 'sms' && contact.phone1) {
        setSelectedPhone(contact.phone1);
      }
    }
  }, [show, contact, messageType]);

  // Contact yoksa modal'ı gösterme
  if (!contact) {
    return null;
  }

  const handleSend = async () => {
    if (!message.trim()) {
      showError('Lütfen bir mesaj yazın.');
      return;
    }

    if (!listName.trim()) {
      showError('Lütfen liste adını girin.');
      return;
    }

    if (!sendingTitle.trim()) {
      showError('Lütfen gönderim başlığını girin.');
      return;
    }

    if (messageType === 'sms' && !selectedPhone) {
      showError('Lütfen bir telefon numarası seçin.');
      return;
    }

    if (sendTime === 'scheduled' && !scheduledDate) {
      showError('Lütfen gönderim tarihi seçin.');
      return;
    }

    if (sendTime === 'scheduled' && !scheduledTime) {
      showError('Lütfen gönderim saati seçin.');
      return;
    }

    setIsLoading(true);

    try {
      if (messageType === 'sms') {
        // SMS gönderimi
        const smsData = {
          phoneNumber: selectedPhone,
      message: message.trim(),
      listName: listName.trim(),
      sendingTitle: sendingTitle.trim(),
      contactName: `${contact.name} ${contact.surname}`,
          contactCategory: contact.category || ''
    };

        const result = await smsService.sendSMS(smsData);
        
        if (result.success) {
          showSuccess('SMS başarıyla gönderildi!');
    handleClose();
        } else {
          showError('SMS gönderilemedi: ' + (result.error || result.message));
        }
      } else {
        // E-posta gönderimi (henüz implementasyon yok)
        showError('E-posta gönderimi henüz desteklenmiyor.');
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      showError('Mesaj gönderilirken bir hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryAdd = (category) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories(prev => [...prev, category]);
    }
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const removeCategoryFilter = (category) => {
    setSelectedCategories(prev => prev.filter(cat => cat !== category));
  };

  const handleCategorySearchChange = (e) => {
    setCategorySearch(e.target.value);
    setShowCategoryDropdown(true);
  };

  const getFilteredCategories = () => {
    if (!categorySearch) return categories;
    return categories.filter(category => 
      category.toLowerCase().includes(categorySearch.toLowerCase()) &&
      !selectedCategories.includes(category)
    );
  };

  const getCharacterLimit = () => {
    return messageType === 'sms' ? 160 : 500;
  };

  const getRemainingChars = () => {
    return getCharacterLimit() - message.length;
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      className="messaging-modal"
    >
      <div className="modal-content-custom">
        {/* Header */}
        <div className="modal-header-custom">
          <div className="header-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2" fill="none"/>
            </svg>
            <h4>SMS GÖNDER</h4>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-custom">
          {/* Liste Adı */}
          <div className="form-group">
            <div className="contact-label">LİSTE ADI</div>
            <Form.Control
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Liste adını girin"
              className="form-input"
            />
          </div>

          {/* Gönderim Başlığı */}
          <div className="form-group">
            <div className="contact-label">GÖNDERİM BAŞLIĞI</div>
            <Form.Control
              type="text"
              value={sendingTitle}
              onChange={(e) => setSendingTitle(e.target.value)}
              placeholder="Gönderim başlığını girin"
              className="form-input"
            />
          </div>

          {/* Kişi Bilgileri */}
          <div className="contact-info-section">
            <div className="contact-info-label">KİŞİ BİLGİLERİ</div>
            <div className="contact-details">
              <div className="contact-detail-row">
                <div className="contact-detail-item">
                  <span className="detail-label">AD SOYAD:</span>
                  <span className="detail-value">{contact.name} {contact.surname}</span>
                </div>
                <div className="contact-detail-item">
                  <span className="detail-label">KATEGORİ:</span>
                  <span className="detail-value">{contact.category}</span>
                </div>
              </div>
              
              {/* Telefon Seçimi - SMS için */}
              {messageType === 'sms' && (
                <div className="contact-detail-row">
                  <div className="contact-detail-item full-width">
                    <span className="detail-label">TELEFON SEÇİMİ:</span>
                    <div className="phone-selection">
                      {contact.phone1 && (
                        <label className="phone-option">
                          <input
                            type="radio"
                            name="phoneSelection"
                            value={contact.phone1}
                            checked={selectedPhone === contact.phone1}
                            onChange={(e) => setSelectedPhone(e.target.value)}
                          />
                          <span className="phone-label">Telefon 1:</span>
                          <span className="phone-number">{contact.phone1}</span>
                        </label>
                      )}
                      {contact.phone2 && (
                        <label className="phone-option">
                          <input
                            type="radio"
                            name="phoneSelection"
                            value={contact.phone2}
                            checked={selectedPhone === contact.phone2}
                            onChange={(e) => setSelectedPhone(e.target.value)}
                          />
                          <span className="phone-label">Telefon 2:</span>
                          <span className="phone-number">{contact.phone2}</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* E-posta için sadece gösterim */}
              {messageType === 'email' && contact.email && (
                <div className="contact-detail-row">
                  <div className="contact-detail-item">
                    <span className="detail-label">E-POSTA:</span>
                    <span className="detail-value">{contact.email}</span>
                  </div>
                </div>
              )}

              {/* Diğer bilgiler */}
              {(contact.title || contact.district) && (
                <div className="contact-detail-row">
                  {contact.title && (
                    <div className="contact-detail-item">
                      <span className="detail-label">ÜNVAN:</span>
                      <span className="detail-value">{contact.title}</span>
                    </div>
                  )}
                  {contact.district && (
                    <div className="contact-detail-item">
                      <span className="detail-label">İLÇE:</span>
                      <span className="detail-value">{contact.district}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Gönderim Zamanı */}
          <div className="send-time-section">
            <div className="time-label">GÖNDERİM ZAMANI</div>
            <div className="time-toggle">
              <button 
                className={`toggle-btn ${sendTime === 'now' ? 'active' : ''}`}
                onClick={() => setSendTime('now')}
              >
                HEMEN
              </button>
              <button 
                className={`toggle-btn ${sendTime === 'scheduled' ? 'active' : ''}`}
                onClick={() => setSendTime('scheduled')}
              >
                SONRA
              </button>
            </div>
            {sendTime === 'scheduled' && (
              <div className="scheduled-inputs">
                <div className="date-time-row">
                  <div className="date-picker-container">
                    <DatePicker
                      selected={scheduledDate}
                      onChange={(date) => setScheduledDate(date)}
                      minDate={new Date()}
                      dateFormat="dd MMMM yyyy"
                      placeholderText="Tarih seçin"
                      className="date-picker-input"
                      calendarClassName="custom-calendar"
                      showPopperArrow={false}
                      locale="tr"
                      popperPlacement="bottom-start"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="scroll"
                      yearDropdownItemNumber={20}
                      popperModifiers={{
                        preventOverflow: {
                          enabled: true,
                          escapeWithReference: false,
                          boundariesElement: 'viewport'
                        }
                      }}
                    />
                  </div>
                  <Form.Control
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="time-input"
                    placeholder="Saat seçin"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mesaj Alanı */}
          <div className="message-section">
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesaj içeriği yazın..."
                maxLength={getCharacterLimit()}
                className="message-textarea"
              />
              <div className="character-count">
                {message.length} / {getCharacterLimit()}
              </div>
            </Form.Group>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer-custom">
          <Button 
            variant="secondary" 
            onClick={handleClose}
            className="cancel-btn"
            disabled={isLoading}
          >
            İPTAL ET
          </Button>
          <Button 
            variant="success" 
            onClick={handleSend}
            className="send-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Gönderiliyor...</span>
                </div>
                GÖNDERİLİYOR...
              </>
            ) : (
              'GÖNDER'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MessagingModal;