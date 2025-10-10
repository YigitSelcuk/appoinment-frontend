import React, { useState, useEffect } from 'react';
import { getAppointments } from '../../services/appointmentsService';
import { useAuth } from '../../contexts/AuthContext';
import './Calendar.css';

const Calendar = ({ 
  selectedDate: externalSelectedDate, 
  currentMonth: externalCurrentMonth, 
  currentYear: externalCurrentYear,
  onDateChange 
}) => {
  const { accessToken } = useAuth();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(externalSelectedDate || today.getDate());
  const [currentMonth, setCurrentMonth] = useState(externalCurrentMonth !== undefined ? externalCurrentMonth : today.getMonth());
  const [currentYear, setCurrentYear] = useState(externalCurrentYear || today.getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // External props değiştiğinde internal state'i güncelle
  useEffect(() => {
    if (externalSelectedDate !== undefined) {
      setSelectedDate(externalSelectedDate);
    } else {
      // Eğer external prop yoksa bugünü seç
      setSelectedDate(today.getDate());
    }
  }, [externalSelectedDate]);

  useEffect(() => {
    if (externalCurrentMonth !== undefined) {
      setCurrentMonth(externalCurrentMonth);
    } else {
      // Eğer external prop yoksa bugünkü ayı seç
      setCurrentMonth(today.getMonth());
    }
  }, [externalCurrentMonth]);

  useEffect(() => {
    if (externalCurrentYear !== undefined) {
      setCurrentYear(externalCurrentYear);
    } else {
      // Eğer external prop yoksa bugünkü yılı seç
      setCurrentYear(today.getFullYear());
    }
  }, [externalCurrentYear]);

  // Randevuları yükle
  useEffect(() => {
    loadAppointments();
  }, [accessToken]);

  const loadAppointments = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await getAppointments(accessToken);
      if (response.success) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Randevular yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Seçili günün randevularını getir
  const getSelectedDayAppointments = () => {
    const selectedDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    const filtered = appointments.filter(appointment => {
      // Backend'den gelen tarihi local timezone'a çevir
      if (!appointment.date) return false;
      
      const appointmentDate = new Date(appointment.date);
      const year = appointmentDate.getFullYear();
      const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      return localDateString === selectedDateString;
    }).sort((a, b) => {
      return a.start_time.localeCompare(b.start_time);
    });
    
    return filtered;
  };

  // Saat formatla
  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  // Seçili günün tarih formatı
  const getSelectedDateFormatted = () => {
    const date = new Date(currentYear, currentMonth, selectedDate);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  // Türkçe ay isimleri
  const monthNames = [
    'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
    'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
  ];

  // Türkçe gün isimleri - Figma tasarımına göre
  const dayHeaders = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMTS'];
  const [scrollContainer, setScrollContainer] = useState(null); // Scroll container referansı

  // Aylık randevu verileri için event oluştur
  const createEventData = () => {
    const eventData = {};
    
    appointments.forEach(appointment => {
      // Backend'den gelen tarihi normalize et (sadece tarih kısmını al)
      let appointmentDate = appointment.date;
      
      // Eğer ISO string formatında ise sadece tarih kısmını al
      if (appointmentDate.includes('T')) {
        appointmentDate = appointmentDate.split('T')[0];
      }
      
      if (!eventData[appointmentDate]) {
        eventData[appointmentDate] = [];
      }
      eventData[appointmentDate].push({
        color: appointment.color || '#3B82F6'
      });
    });
    
    return eventData;
  };

  const eventData = createEventData();
  const selectedDayAppointments = getSelectedDayAppointments();



  // Takvim günlerini oluştur
  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days = [];
    
    // Önceki ayın son günleri
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        month: 'prev',
        events: eventData[dateKey] || [],
        dateKey
      });
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        month: 'current',
        events: eventData[dateKey] || [],
        dateKey
      });
    }
    
    // Sonraki ayın ilk günleri
    const remainingDays = 42 - days.length; // 6 hafta x 7 gün
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let day = 1; day <= remainingDays; day++) {
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        month: 'next',
        events: eventData[dateKey] || [],
        dateKey
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleDateClick = (day, month) => {
    if (month === 'current') {
      setSelectedDate(day);
      if (onDateChange) {
        onDateChange(day, currentMonth, currentYear);
      }
    } else if (month === 'prev') {
      handlePrevMonth();
      setSelectedDate(day);
      if (onDateChange) {
        onDateChange(day, currentMonth === 0 ? 11 : currentMonth - 1, currentMonth === 0 ? currentYear - 1 : currentYear);
      }
    } else if (month === 'next') {
      handleNextMonth();
      setSelectedDate(day);
      if (onDateChange) {
        onDateChange(day, currentMonth === 11 ? 0 : currentMonth + 1, currentMonth === 11 ? currentYear + 1 : currentYear);
      }
    }
  };

  const handlePrevMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    
    if (onDateChange) {
      onDateChange(selectedDate, newMonth, newYear);
    }
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    
    if (onDateChange) {
      onDateChange(selectedDate, newMonth, newYear);
    }
  };

  // Bugüne git fonksiyonu
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.getDate());
    
    if (onDateChange) {
      onDateChange(today.getDate(), today.getMonth(), today.getFullYear());
    }
  };

  // Belirli bir tarihe git fonksiyonu
  const goToDate = (month, year) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    setShowDatePicker(false);
  };

  // Yıl seçimi için yıl listesi oluştur
  const generateYearOptions = () => {
    const currentYearNow = new Date().getFullYear();
    const years = [];
    for (let year = currentYearNow - 10; year <= currentYearNow + 10; year++) {
      years.push(year);
    }
    return years;
  };

  // Bugünün tarihini kontrol et
  const isToday = (day, month) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === 'current' &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // Bugünün tarih formatı
  const getTodayFormatted = () => {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  };

  // Custom scroll functions
  const scrollUp = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({
        top: -100,
        behavior: 'smooth'
      });
    }
  };

  const scrollDown = () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({
        top: 100,
        behavior: 'smooth'
      });
    }
  };

  // Check if scroll buttons should be visible (4+ appointments)
  const shouldShowScrollButtons = selectedDayAppointments.length >= 4;

  return (
    <div className="calendar-widget">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-title">
          <svg width="33" height="37" viewBox="0 0 33 37" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M29.3333 4.36634H27.5V2.59967C27.5 1.62801 26.675 0.833008 25.6667 0.833008C24.6583 0.833008 23.8333 1.62801 23.8333 2.59967V4.36634H9.16667V2.59967C9.16667 1.62801 8.34167 0.833008 7.33333 0.833008C6.325 0.833008 5.5 1.62801 5.5 2.59967V4.36634H3.66667C1.63167 4.36634 0.0183333 5.95634 0.0183333 7.89967L0 32.633C0 34.5763 1.63167 36.1663 3.66667 36.1663H29.3333C31.35 36.1663 33 34.5763 33 32.633V7.89967C33 5.95634 31.35 4.36634 29.3333 4.36634ZM29.3333 30.8663C29.3333 31.838 28.5083 32.633 27.5 32.633H5.5C4.49167 32.633 3.66667 31.838 3.66667 30.8663V13.1997H29.3333V30.8663ZM7.33333 16.733H11V20.2663H7.33333V16.733ZM14.6667 16.733H18.3333V20.2663H14.6667V16.733ZM22 16.733H25.6667V20.2663H22V16.733Z" fill="#8454DD"/>
          </svg>
          <span>TAKVİM</span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="month-navigation">
        <button className="nav-button" onClick={handlePrevMonth}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 1L1 5L5 9" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="month-year-container">
          <span 
            className="month-year clickable" 
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            {monthNames[currentMonth]} {currentYear}
          </span>
          
          {showDatePicker && (
            <div className="date-picker-dropdown">
              <div className="date-picker-header">
                <h4>Tarih Seç</h4>
                <button 
                  className="close-picker"
                  onClick={() => setShowDatePicker(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="date-picker-content">
                <div className="picker-section">
                  <label>Ay:</label>
                  <select 
                    value={currentMonth} 
                    onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="picker-section">
                  <label>Yıl:</label>
                  <select 
                    value={currentYear} 
                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  >
                    {generateYearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="picker-actions">
                  <button 
                    className="today-btn"
                    onClick={goToToday}
                  >
                    Bugüne Git
                  </button>
                  <button 
                    className="apply-btn"
                    onClick={() => setShowDatePicker(false)}
                  >
                    Uygula
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button className="nav-button" onClick={handleNextMonth}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L1 9" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day Headers */}
        <div className="day-headers">
          {dayHeaders.map((day, index) => (
            <div key={index} className="day-header">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="calendar-days">
          {calendarDays.map((dateObj, index) => (
            <div
              key={index}
              className={`calendar-day ${dateObj.month} ${
                dateObj.day === selectedDate && dateObj.month === 'current' ? 'selected' : ''
              } ${isToday(dateObj.day, dateObj.month) ? 'today' : ''}`}
              onClick={() => handleDateClick(dateObj.day, dateObj.month)}
            >
              <span className="day-number">{dateObj.day}</span>
              {dateObj.events.length > 0 && (
                <div className="event-dots">
                  {dateObj.events.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="event-dot"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                  {dateObj.events.length > 3 && (
                    <div className="event-dot more-events" title={`+${dateObj.events.length - 3} daha fazla randevu`}>
                      +
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Section */}
      <div className="today-section">
        <div className="today-header">
          <span>SEÇİLİ GÜN</span>
          <span>{getSelectedDateFormatted()}</span>
        </div>
        <div className="today-events">
          <div 
            className="today-events-scroll-container"
            ref={setScrollContainer}
          >
            {loading ? (
              <div className="loading-message">Randevular yükleniyor...</div>
            ) : selectedDayAppointments.length > 0 ? (
              selectedDayAppointments.map((appointment) => (
                <div key={appointment.id} className="today-event">
                <div className="event-meta">
                  <div 
                    className="event-indicator" 
                      style={{ backgroundColor: appointment.color || '#3B82F6' }}
                  />
                  <div className="event-time">
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </div>
                  </div>
                  <div className="event-details">
                    <div className="event-title">{appointment.title}</div>
                    {appointment.description && (
                      <div className="event-subtitle">{appointment.description}</div>
                    )}
                    {appointment.attendee_name && (
                      <div className="event-attendee">
                        <span>Katılımcı: </span>{appointment.attendee_name}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-events">
                <p>Bu günde randevu bulunmuyor.</p>
              </div>
            )}
          </div>
          
          {/* Custom scroll buttons - only show when 4+ appointments */}
          {shouldShowScrollButtons && (
            <div className="custom-scroll-buttons">
              <button 
                className="scroll-button" 
                onClick={scrollUp}
                title="Yukarı kaydır"
              >
                ▲
              </button>
              <button 
                className="scroll-button" 
                onClick={scrollDown}
                title="Aşağı kaydır"
              >
                ▼
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;