import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './CategoryMessagingModal.css';

// Türkçe locale'i kaydet
registerLocale('tr', tr);

const CategoryMessagingModal = ({ show, handleClose, category, categories = [], onSend, loading = false }) => {
  const { showError } = useSimpleToast();
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
    }
  }, [show]);

  // Modal açıldığında seçilen kategoriyi otomatik ekle
  useEffect(() => {
    if (show && category && category.alt_kategori) {
      setSelectedCategories([category.alt_kategori]);
    }
  }, [show, category]);

  // Category yoksa modal'ı gösterme
  if (!category) {
    return null;
  }

  const handleSend = () => {
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

    if (selectedCategories.length === 0) {
      showError('Lütfen en az bir kategori seçin.');
      return;
    }

    if (sendTime === 'scheduled') {
      if (!scheduledDate) {
        showError('Lütfen gönderim tarihini seçin.');
        return;
      }
      if (!scheduledTime) {
        showError('Lütfen gönderim saatini girin.');
        return;
      }
      
      // Seçilen tarih ve saat geçmiş bir zaman olmamalı
      const selectedDateTime = new Date(scheduledDate);
      selectedDateTime.setHours(parseInt(scheduledTime.split(':')[0]));
      selectedDateTime.setMinutes(parseInt(scheduledTime.split(':')[1]));
      const now = new Date();
      
      if (selectedDateTime <= now) {
        showError('Gönderim zamanı gelecekte bir tarih ve saat olmalıdır.');
        return;
      }
    }

    const messageData = {
      type: messageType,
      message: message.trim(),
      listName: listName.trim(),
      sendingTitle: sendingTitle.trim(),
      categories: selectedCategories,
      recipient: category.name, // Kategori için
      sendTime,
      scheduledDate: sendTime === 'scheduled' ? scheduledDate?.toISOString().split('T')[0] : null,
      scheduledTime: sendTime === 'scheduled' ? scheduledTime : null,
    };

    onSend(messageData);
    handleClose();
  };

  const handleCategoryAdd = (categoryName) => {
    if (!selectedCategories.includes(categoryName)) {
      setSelectedCategories(prev => [...prev, categoryName]);
    }
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const removeCategoryFilter = (categoryName) => {
    setSelectedCategories(prev => prev.filter(cat => cat !== categoryName));
  };

  const handleSelectAllCategories = (e) => {
    if (e.target.checked) {
      // Tüm kategorileri seç
      setSelectedCategories([...categories]);
    } else {
      // Tüm seçimleri kaldır
      setSelectedCategories([]);
    }
  };

  const handleCategorySearchChange = (e) => {
    setCategorySearch(e.target.value);
    setShowCategoryDropdown(true);
  };

  const getFilteredCategories = () => {
    if (!categorySearch) return categories;
    return categories.filter(cat => 
      cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
      !selectedCategories.includes(cat)
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
      className="category-messaging-modal"
    >
      <div className="modal-content-custom">
        {/* Header */}
        <div className="modal-header-custom">
          <h4>SMS GÖNDER</h4>
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

          {/* Grup Seçimi */}
          <div className="group-selection">
            <div className="group-label">GRUP (KATEGORİLER)</div>
            
            {/* Tümünü Seç Checkbox */}
            <div className="select-all-container" style={{ marginBottom: '15px' }}>
              <Form.Check
                type="checkbox"
                id="select-all-categories"
                label="Tüm kategorileri seç"
                checked={selectedCategories.length === categories.length && categories.length > 0}
                onChange={handleSelectAllCategories}
                className="select-all-checkbox"
              />
            </div>
            
            {/* Kategori Arama */}
            <div className="category-search-container">
              <Form.Control
                type="text"
                value={categorySearch}
                onChange={handleCategorySearchChange}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                placeholder="Kategori ara ve ekle..."
                className="category-search-input"
              />
              
              {/* Dropdown */}
              {showCategoryDropdown && categorySearch && (
                <div className="category-dropdown">
                  {getFilteredCategories().length > 0 ? (
                    getFilteredCategories().map(categoryName => (
                      <div
                        key={categoryName}
                        className="category-dropdown-item"
                        onClick={() => handleCategoryAdd(categoryName)}
                      >
                        {categoryName}
                      </div>
                    ))
                  ) : (
                    <div className="category-dropdown-item no-results">
                      Sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Seçilen Kategoriler */}
            {selectedCategories.length > 0 && (
              <div className="selected-categories">
                <div className="selected-label">SEÇİLEN KATEGORİLER:</div>
                <div className="group-filters">
                  {selectedCategories.map(categoryName => (
                    <span key={categoryName} className="filter-tag" onClick={() => removeCategoryFilter(categoryName)}>
                      {categoryName} ×
                    </span>
                  ))}
                </div>
              </div>
            )}
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
          >
            İPTAL ET
          </Button>
          <Button 
            variant="success" 
            onClick={handleSend}
            className="send-btn"
            disabled={loading}
          >
            {loading ? 'GÖNDERİLİYOR...' : 'GÖNDER'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryMessagingModal;