import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAppointments } from '../../../services/appointmentsService';
import { useAuth } from '../../../contexts/AuthContext';
import './CalendarWidget.css';

const CalendarWidget = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Randevuları yükle
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const data = await getAppointments(accessToken);
        console.log('API\'den gelen randevu verisi:', data);
        console.log('Veri tipi:', typeof data);
        console.log('Array mi?', Array.isArray(data));
        
        // Eğer data bir object ise ve appointments property'si varsa onu kullan
        let appointmentsArray = data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (data.appointments && Array.isArray(data.appointments)) {
            appointmentsArray = data.appointments;
          } else if (data.data && Array.isArray(data.data)) {
            appointmentsArray = data.data;
          } else {
            appointmentsArray = [];
          }
        }
        
        setAppointments(appointmentsArray || []);
      } catch (error) {
        console.error('Randevular yüklenirken hata:', error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    if (user && accessToken) {
      loadAppointments();
    }
  }, [user, accessToken]);

  // Takvim yardımcı fonksiyonları
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Pazartesi = 0
  };

  const getAppointmentsForDate = (date) => {
    if (!date || !Array.isArray(appointments) || !appointments.length) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
      return appointmentDate === dateStr;
    });
  };

  const formatAppointmentForDisplay = (appointment) => {
    const date = new Date(appointment.date);
    const time = date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return {
      time,
      title: appointment.title || 'Randevu',
      subtitle: appointment.description || appointment.location
    };
  };

  // Takvim navigasyonu
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Takvim günlerini oluştur
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Önceki ayın son günleri
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`prev-${i}`} className="calendar-widget-day empty">
          <span></span>
        </div>
      );
    }

    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      const dayAppointments = getAppointmentsForDate(date);
      const hasAppointments = dayAppointments.length > 0;

      days.push(
        <div 
          key={day} 
          className={`calendar-widget-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasAppointments ? 'has-appointments' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="calendar-widget-day-number">{day}</span>
          {hasAppointments && (
            <div className="calendar-widget-appointment-dots">
              {dayAppointments.slice(0, 3).map((appointment, index) => (
                <div 
                  key={index}
                  className="calendar-widget-appointment-dot"
                  style={{ backgroundColor: appointment.color || '#3b82f6' }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // Randevu listesini render et
  const renderAppointmentsList = () => {
    if (loading) {
      return (
        <div className="calendar-widget-appointments-loading">
          <p>Randevular yükleniyor...</p>
        </div>
      );
    }

    if (selectedDate) {
      // Seçili tarih için randevuları göster
      const dayAppointments = getAppointmentsForDate(selectedDate);
      
      return (
        <div className="calendar-widget-selected-date-appointments">
          <div className="calendar-widget-selected-date-header">
            <div className="calendar-widget-date-circle">
              <span className="date-number">{selectedDate.getDate()}</span>
            </div>
            <div className="calendar-widget-date-info">
              <div className="calendar-widget-date-text">
                {selectedDate.toLocaleDateString('tr-TR', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
          
          <div className="calendar-widget-appointments-list">
            {dayAppointments.length > 0 ? (
              dayAppointments.map((appointment) => {
                const formatted = formatAppointmentForDisplay(appointment);
                return (
                  <div key={appointment.id} className="calendar-widget-appointment-item">
                    <div className="calendar-widget-appointment-time">
                      <div 
                        className="calendar-widget-time-dot"
                        style={{ backgroundColor: appointment.color || '#3b82f6' }}
                      />
                      <span className="calendar-widget-time-text">{formatted.time}</span>
                    </div>
                    <div className="calendar-widget-appointment-content">
                      <div className="calendar-widget-appointment-title">{formatted.title}</div>
                      {formatted.subtitle && (
                        <div className="calendar-widget-appointment-subtitle">{formatted.subtitle}</div>
                      )}
                    </div>
                    {appointment.status === 'COMPLETED' && (
                      <div className="calendar-widget-completed-check">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="calendar-widget-no-appointments">
                <p>Bu tarihte randevu bulunmuyor</p>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Tüm randevuları gruplu göster
      if (!Array.isArray(appointments) || appointments.length === 0) {
        return (
          <div className="calendar-widget-no-appointments">
            <p>Henüz randevu bulunmuyor</p>
          </div>
        );
      }

      // Randevuları tarihe göre grupla
      const groupedAppointments = appointments.reduce((groups, appointment) => {
        const date = new Date(appointment.date);
        const dateKey = date.toISOString().split('T')[0];
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(appointment);
        return groups;
      }, {});

      const sortedGroups = Object.entries(groupedAppointments)
        .sort(([a], [b]) => new Date(a) - new Date(b)); // Tüm randevuları göster

      return (
        <div className="calendar-widget-all-appointments">
          <div className="calendar-widget-appointments-list">
            {sortedGroups.map(([dateKey, dayAppointments]) => {
              const date = new Date(dateKey);
              const dayNumber = date.getDate();
              const dayName = date.toLocaleDateString('tr-TR', { 
                weekday: 'short',
                month: 'short'
              });

              return (
                <div key={dateKey} className="calendar-widget-day-group">
                  <div className="calendar-widget-day-header">
                    <div className="calendar-widget-day-circle">
                      <span className="calendar-widget-day-number">{dayNumber}</span>
                    </div>
                    <div className="calendar-widget-day-info">
                      <span className="calendar-widget-day-name">{dayName.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="calendar-widget-day-appointments">
                    {dayAppointments.map((appointment) => {
                      const formatted = formatAppointmentForDisplay(appointment);
                      return (
                        <div key={appointment.id} className="calendar-widget-appointment-row">
                          <div className="calendar-widget-appointment-time">
                            <div 
                              className="calendar-widget-time-dot"
                              style={{ backgroundColor: appointment.color || '#3b82f6' }}
                            />
                            <span className="calendar-widget-time-text">{formatted.time}</span>
                          </div>
                          <div className="calendar-widget-appointment-details">
                            <div className="calendar-widget-appointment-title">{formatted.title}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="calendar-widget-show-all-container">
            <button 
              className="calendar-widget-show-all-button"
              onClick={() => navigate('/appointments')}
            >
              TÜMÜNÜ GÖSTER
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <Card className="calendar-widget">
      <Card.Body className="calendar-widget-body">
        {/* Header */}
        <div className="calendar-widget-header">
          <div className="calendar-widget-header-left">
            <h5 className="calendar-widget-title">Randevularımız</h5>
            <p className="calendar-widget-subtitle">
              {currentDate.toLocaleDateString('tr-TR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="calendar-widget-header-right">
            <button className="calendar-widget-today-button" onClick={goToToday}>
              Bugün
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="calendar-widget-content">
          {/* Sol Taraf - Takvim */}
          <div className="calendar-widget-calendar-section">
            <div className="calendar-widget-navigation">
              <button className="calendar-widget-nav-button" onClick={goToPreviousMonth}>
                ‹
              </button>
              <h6 className="calendar-widget-current-month">
                {currentDate.toLocaleDateString('tr-TR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h6>
              <button className="calendar-widget-nav-button" onClick={goToNextMonth}>
                ›
              </button>
            </div>

            <div className="calendar-widget-grid">
              <div className="calendar-widget-weekdays">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <div key={day} className="calendar-widget-weekday">{day}</div>
                ))}
              </div>
              <div className="calendar-widget-days">
                {renderCalendarDays()}
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Randevu Listesi */}
          <div className="calendar-widget-appointments-section">
            <div className="calendar-widget-appointments-header">
              <h6 className="calendar-widget-appointments-title">
                {selectedDate ? 'Seçili Tarih' : 'Randevular'}
              </h6>
              {selectedDate && (
                <button 
                  className="calendar-widget-clear-selection"
                  onClick={() => setSelectedDate(null)}
                >
                  Temizle
                </button>
              )}
            </div>
            
            <div className="calendar-widget-appointments-content">
              {renderAppointmentsList()}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CalendarWidget;