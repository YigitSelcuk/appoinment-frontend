import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { getAppointments, getAppointmentsByDateRange } from '../../services/appointmentsService';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './Calendar.css';

const Calendar = memo(({ 
  selectedDate: externalSelectedDate, 
  currentMonth: externalCurrentMonth, 
  currentYear: externalCurrentYear,
  onDateChange 
}) => {
  const { accessToken } = useAuth();
  const { socket } = useSocket();
  const today = useMemo(() => new Date(), []);
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
  }, [externalSelectedDate, today]);

  useEffect(() => {
    if (externalCurrentMonth !== undefined) {
      setCurrentMonth(externalCurrentMonth);
    } else {
      // Eğer external prop yoksa bugünkü ayı seç
      setCurrentMonth(today.getMonth());
    }
  }, [externalCurrentMonth, today]);

  useEffect(() => {
    if (externalCurrentYear !== undefined) {
      setCurrentYear(externalCurrentYear);
    } else {
      // Eğer external prop yoksa bugünkü yılı seç
      setCurrentYear(today.getFullYear());
    }
  }, [externalCurrentYear, today]);

  // Randevuları yükle - tarih aralığı ile optimize edildi
  const loadAppointments = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      
      // Görünen ayın başlangıç ve bitiş tarihlerini hesapla
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      // Takvim grid'inde görünen önceki ve sonraki ayın günlerini de dahil et (Pazartesi başlangıçlı)
      const firstDayOfWeek = (startOfMonth.getDay() + 6) % 7; // Pazartesi=0, Salı=1, ..., Pazar=6
      const startDate = new Date(startOfMonth);
      startDate.setDate(startDate.getDate() - firstDayOfWeek);
      
      const lastDayOfWeek = (endOfMonth.getDay() + 6) % 7; // Pazartesi=0, Salı=1, ..., Pazar=6
      const endDate = new Date(endOfMonth);
      endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek));
      
      // Tarih formatını YYYY-MM-DD olarak hazırla
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Tarih aralığına göre randevuları getir
      const response = await getAppointmentsByDateRange(accessToken, startDateStr, endDateStr);
      if (response.success) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Randevular yüklenirken hata:', error);
      // Hata durumunda tüm randevuları yükle (fallback)
      try {
        const response = await getAppointments(accessToken);
        if (response.success) {
          setAppointments(response.data);
        }
      } catch (fallbackError) {
        console.error('Fallback randevu yükleme hatası:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentYear, currentMonth]);

  // Randevuları yükle
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Socket.IO real-time güncellemeler
  useEffect(() => {
    if (!socket) return;

    console.log('🔌 Calendar: Socket event listenerlari ekleniyor...');

    // Randevu ekleme event'i
    const handleAppointmentCreated = (data) => {
      console.log('📅 Calendar: Yeni randevu eklendi:', data);
      loadAppointments(); // Randevuları yeniden yükle
    };

    // Randevu güncelleme event'i
    const handleAppointmentUpdated = (data) => {
      console.log('📅 Calendar: Randevu güncellendi:', data);
      loadAppointments(); // Randevuları yeniden yükle
    };

    // Randevu silme event'i
    const handleAppointmentDeleted = (data) => {
      console.log('📅 Calendar: Randevu silindi:', data);
      loadAppointments(); // Randevuları yeniden yükle
    };

    // Event listener'ları ekle
    socket.on('appointment-created', handleAppointmentCreated);
    socket.on('appointment-updated', handleAppointmentUpdated);
    socket.on('appointment-deleted', handleAppointmentDeleted);

    // Cleanup function
    return () => {
      console.log('🔌 Calendar: Socket event listenerlari kaldiriliyor...');
      socket.off('appointment-created', handleAppointmentCreated);
      socket.off('appointment-updated', handleAppointmentUpdated);
      socket.off('appointment-deleted', handleAppointmentDeleted);
    };
  }, [socket, loadAppointments]);

  // Seçili günün randevularını getir - useMemo ile optimize edildi
  const getSelectedDayAppointments = useMemo(() => {
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
  }, [appointments, currentYear, currentMonth, selectedDate]);

  // Saat formatla - useCallback ile optimize edildi
  const formatTime = useCallback((timeString) => {
    return timeString.substring(0, 5);
  }, []);

  // Seçili günün tarih formatı - useMemo ile optimize edildi
  const selectedDateFormatted = useMemo(() => {
    const date = new Date(currentYear, currentMonth, selectedDate);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  }, [currentYear, currentMonth, selectedDate]);

  // Türkçe ay isimleri - useMemo ile optimize edildi
  const monthNames = useMemo(() => [
    'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
    'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
  ], []);

  // Türkçe gün isimleri - useMemo ile optimize edildi (Pazartesi başlangıçlı)
  const dayHeaders = useMemo(() => ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMTS', 'PAZ'], []);
  const [scrollContainer, setScrollContainer] = useState(null); // Scroll container referansı

  // Aylık randevu verileri için event oluştur - useMemo ile optimize edildi
  const eventData = useMemo(() => {
    const eventData = {};
    
    appointments.forEach(appointment => {
      // Backend'den gelen tarihi local timezone'a çevir (getSelectedDayAppointments ile aynı mantık)
      if (!appointment.date) return;
      
      const appointmentDate = new Date(appointment.date);
      const year = appointmentDate.getFullYear();
      const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      if (!eventData[localDateString]) {
        eventData[localDateString] = [];
      }
      eventData[localDateString].push({
        color: appointment.color || '#3B82F6'
      });
    });
    
    return eventData;
  }, [appointments]);

  const selectedDayAppointments = getSelectedDayAppointments;



  // Takvim günlerini oluştur - useCallback ile optimize edildi
  const generateCalendarDays = useCallback(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    // Pazartesi başlangıçlı hafta için: Pazar=6, Pazartesi=0, Salı=1, ...
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
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
  }, [currentMonth, currentYear, eventData]);

  // Virtualization için optimize edilmiş takvim günleri - useMemo ile cache'lendi
  const calendarDays = useMemo(() => generateCalendarDays(), [currentMonth, currentYear, eventData]);

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

        {/* Calendar Days - Virtualized for performance */}
        <div className="calendar-days">
          {calendarDays.map((dateObj, index) => {
            // Virtualization: Sadece gerekli hesaplamaları yap
            const isSelected = dateObj.day === selectedDate && dateObj.month === 'current';
            const isTodayDate = isToday(dateObj.day, dateObj.month);
            const hasEvents = dateObj.events.length > 0;
            const visibleEvents = hasEvents ? dateObj.events.slice(0, 3) : [];
            const extraEventsCount = dateObj.events.length > 3 ? dateObj.events.length - 3 : 0;
            
            return (
              <div
                key={`${dateObj.dateKey}-${index}`}
                className={`calendar-day ${dateObj.month} ${
                  isSelected ? 'selected' : ''
                } ${isTodayDate ? 'today' : ''}`}
                onClick={() => handleDateClick(dateObj.day, dateObj.month)}
              >
                <span className="day-number">{dateObj.day}</span>
                {hasEvents && (
                  <div className="event-dots">
                    {visibleEvents.map((event, eventIndex) => (
                      <div
                        key={`${event.id || eventIndex}-${dateObj.dateKey}`}
                        className="event-dot"
                        style={{ backgroundColor: event.color }}
                      />
                    ))}
                    {extraEventsCount > 0 && (
                      <div className="event-dot more-events" title={`+${extraEventsCount} daha fazla randevu`}>
                        +
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Section */}
      <div className="today-section">
        <div className="today-header">
          <span>SEÇİLİ GÜN</span>
          <span>{selectedDateFormatted}</span>
        </div>
        <div className="today-events">
          <div 
            className="today-events-scroll-container"
            ref={setScrollContainer}
          >
            {loading ? (
              <div className="loading-message">Randevular yükleniyor...</div>
            ) : selectedDayAppointments.length > 0 ? (
              selectedDayAppointments.map((appointment) => {
                // JSON verilerini parse et
                let invitees = [];
                let attendees = [];
                let visibleToUsers = [];
                
                try {
                  if (appointment.invitees && typeof appointment.invitees === 'string') {
                    invitees = JSON.parse(appointment.invitees);
                  } else if (Array.isArray(appointment.invitees)) {
                    invitees = appointment.invitees;
                  }
                } catch (e) {
                  console.warn('Invitees parse hatası:', e);
                }
                
                try {
                  if (appointment.attendees && typeof appointment.attendees === 'string') {
                    attendees = JSON.parse(appointment.attendees);
                  } else if (Array.isArray(appointment.attendees)) {
                    attendees = appointment.attendees;
                  }
                } catch (e) {
                  console.warn('Attendees parse hatası:', e);
                }
                
                try {
                  if (appointment.visible_to_users && typeof appointment.visible_to_users === 'string') {
                    visibleToUsers = JSON.parse(appointment.visible_to_users);
                  } else if (Array.isArray(appointment.visible_to_users)) {
                    visibleToUsers = appointment.visible_to_users;
                  }
                } catch (e) {
                  console.warn('Visible to users parse hatası:', e);
                }

                // Status çevirisi
                const getStatusText = (status) => {
                  switch (status) {
                    case 'SCHEDULED': return 'Planlandı';
                    case 'COMPLETED': return 'Tamamlandı';
                    case 'CANCELLED': return 'İptal Edildi';
                    case 'PENDING': return 'Beklemede';
                    default: return status;
                  }
                };

                const getStatusColor = (status) => {
                  switch (status) {
                    case 'SCHEDULED': return '#3B82F6';
                    case 'COMPLETED': return '#10B981';
                    case 'CANCELLED': return '#EF4444';
                    case 'PENDING': return '#F59E0B';
                    default: return '#6B7280';
                  }
                };

                return (
                  <div key={appointment.id} className="today-event">
                    <div className="event-meta">
                      <div 
                        className="event-indicator" 
                        style={{ backgroundColor: appointment.color || '#3B82F6' }}
                      />
                      <div className="event-time">
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </div>
                      <div className="event-status" style={{ color: getStatusColor(appointment.status) }}>
                        {getStatusText(appointment.status)}
                      </div>
                    </div>
                    <div className="event-details">
                      <div className="event-title">{appointment.title}</div>
                      {appointment.description && (
                        <div className="event-subtitle">{appointment.description}</div>
                      )}
                      {appointment.location && (
                        <div className="event-location">
                          <span>📍 Konum: </span>{appointment.location}
                        </div>
                      )}
                      {appointment.created_by_name && (
                        <div className="event-creator">
                          <span>👤 Oluşturan: </span>{appointment.created_by_name}
                          {appointment.created_by_email && (
                            <span> ({appointment.created_by_email})</span>
                          )}
                        </div>
                      )}
                      {appointment.attendee_name && (
                        <div className="event-attendee">
                          <span>🎯 Katılımcı: </span>{appointment.attendee_name}
                          {appointment.attendee_email && (
                            <span> ({appointment.attendee_email})</span>
                          )}
                          {appointment.attendee_phone && (
                            <span> - {appointment.attendee_phone}</span>
                          )}
                        </div>
                      )}
                      {invitees.length > 0 && (
                        <div className="event-invitees">
                          <span>📧 Davetliler: </span>
                          {invitees.map((invitee, index) => (
                            <span key={index}>
                              {invitee.name} ({invitee.email})
                              {index < invitees.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {attendees.length > 0 && (
                        <div className="event-attendees">
                          <span>👥 Katılanlar: </span>
                          {attendees.map((attendee, index) => (
                            <span key={index}>
                              {attendee.name || attendee.email}
                              {index < attendees.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {appointment.repeat_type && appointment.repeat_type !== 'TEKRARLANMAZ' && (
                        <div className="event-repeat">
                          <span>🔄 Tekrar: </span>{appointment.repeat_type}
                        </div>
                      )}
                      {appointment.source && (
                        <div className="event-source">
                          <span>📱 Kaynak: </span>{appointment.source}
                        </div>
                      )}
                      {(appointment.notification_email || appointment.notification_sms) && (
                        <div className="event-notifications">
                          <span>🔔 Bildirimler: </span>
                          {appointment.notification_email && <span>Email </span>}
                          {appointment.notification_sms && <span>SMS</span>}
                        </div>
                      )}
                      {appointment.reminder_value && appointment.reminder_unit && (
                        <div className="event-reminder">
                          <span>⏰ Hatırlatma: </span>
                          {appointment.reminder_value} {appointment.reminder_unit} önce
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
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
});

export default Calendar;