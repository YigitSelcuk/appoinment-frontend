import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAppointments } from '../../../services/appointmentsService';
import { useAuth } from '../../../contexts/AuthContext';
import './CalendarWidget.css';

const CalendarWidget = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    fetchAppointments();
  }, [accessToken]);

  const fetchAppointments = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Önceki ayın son günleri
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }

    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    // Sonraki ayın ilk günleri
    const remainingDays = 42 - days.length; // 6 hafta x 7 gün
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  const formatMonth = (date) => {
    const months = [
      'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
      'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (dateObj) => {
    if (dateObj.isCurrentMonth) {
      setSelectedDate(dateObj.date);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMTS'];

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  // Backend'den gelen randevu verilerini formatla
  const formatAppointmentTime = (appointment) => {
    // Backend'den start_time geliyorsa onu kullan, yoksa time a#3C02AA#3C02AAlanını kullan
    return appointment.start_time || appointment.time || '00:00';
  };

  const formatAppointmentForDisplay = (appointment) => {
    return {
      id: appointment.id,
      date: appointment.date,
      time: formatAppointmentTime(appointment),
      title: appointment.title || 'Başlıksız Randevu',
      subtitle: appointment.description || appointment.subtitle || ''
    };
  };

  const getTimeColor = (time) => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
    const hour = parseInt(time.split(':')[0]);
    return colors[hour % colors.length];
  };

  return (
    <Card className="dashboard-calendar-widget shadow-sm border-0">
      {/* Tab Navigation */}
      <div className="calendar-tabs">
        <div className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <span className="tab-icon">📅</span>
            RANDEVULAR
          </button>
        </div>
      </div>
      
      <Card.Body className="p-0">
        <div className="calendar-container">
          {/* Calendar Section */}
          <div className="calendar-section">
            {/* Calendar Navigation */}
            <div className="calendar-nav-header">
              <button 
                className="nav-btn" 
                onClick={() => navigateMonth(-1)}
                disabled={loading}
              >
                ‹
              </button>
              <span className="month-year">{formatMonth(currentDate)}</span>
              <button 
                className="nav-btn" 
                onClick={() => navigateMonth(1)}
                disabled={loading}
              >
                ›
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
              </div>
            ) : (
              <div className="calendar-grid">
                {/* Hafta günleri */}
                <div className="weekdays">
                  {weekDays.map(day => (
                    <div key={day} className="weekday">{day}</div>
                  ))}
                </div>
                
                {/* Takvim günleri */}
                <div className="calendar-days">
                  {days.map((dateObj, index) => {
                    const dayAppointments = getAppointmentsForDate(dateObj.date);
                    const hasAppointments = dayAppointments.length > 0;
                    const isSelected = selectedDate && 
                      dateObj.date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`calendar-day ${
                          !dateObj.isCurrentMonth ? 'other-month' : ''
                        } ${
                          isToday(dateObj.date) ? 'today' : ''
                        } ${
                          isSelected ? 'selected' : ''
                        } ${
                          hasAppointments ? 'has-appointments' : ''
                        }`}
                        onClick={() => handleDateClick(dateObj)}
                      >
                        <span className="day-number">{dateObj.day}</span>
                        {hasAppointments && (
                          <div className="appointment-dots">
                            {dayAppointments.slice(0, 3).map((appointment, i) => (
                              <div 
                                key={i} 
                                className="appointment-dot"
                                style={{ backgroundColor: appointment.color || '#3b82f6' }}
                              ></div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Appointments List Section */}
          <div className="appointments-section">
            <div className="selected-date-appointments">
              {selectedDate ? (
                <div className="appointment-date-header">
                  <div className="date-circle">
                    <span className="date-number">{selectedDate.getDate()}</span>
                  </div>
                  <div className="date-info">
                    <span className="date-day">
                      {selectedDate.toLocaleDateString('tr-TR', { weekday: 'short' }).toUpperCase()}, 
                      {selectedDate.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : null}
              
              <div className="appointment-list">
                {selectedDate ? (
                  getAppointmentsForDate(selectedDate).length > 0 ? (
                    getAppointmentsForDate(selectedDate).map((appointment, index) => {
                      const formattedAppointment = formatAppointmentForDisplay(appointment);
                      return (
                        <div key={appointment.id} className="appointment-item d-flex align-items-center mb-2" style={{ position: 'relative' }}>
                          <div className="appointment-date-info me-3">
                            <div className="date-circle-small">
                              <span className="date-number-small">{selectedDate.getDate()}</span>
                            </div>
                            <div className="date-text-small">
                              <span>{selectedDate.toLocaleDateString('tr-TR', { weekday: 'short' }).toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="appointment-time-center me-3">
                            <div 
                              className="time-dot" 
                              style={{ backgroundColor: appointment.color || '#3b82f6' }}
                            ></div>
                            <span className="time-text">{formattedAppointment.time}</span>
                          </div>
                          <div className="appointment-details flex-grow-1">
                            <div className="appointment-title">{formattedAppointment.title}</div>
                            {formattedAppointment.subtitle && (
                              <div className="appointment-subtitle">{formattedAppointment.subtitle}</div>
                            )}
                          </div>
                          {/* Tamamlanmış randevular için yeşil tik */}
                          {appointment.status === 'COMPLETED' && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '16px',
                              height: '16px',
                              backgroundColor: '#10B981',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-appointments">
                      <p>Bu tarihte randevu bulunmuyor</p>
                    </div>
                  )
                ) : (
                  // Tüm randevuları tarih grupları halinde göster
                  <div className="all-appointments">
                    {appointments.length === 0 ? (
                      <div className="no-appointments">
                        <p>Henüz randevu bulunmuyor</p>
                      </div>
                    ) : null}
                  </div>
                )}
                
                {!selectedDate && appointments.length > 0 && (
                  // Randevuları tarihe göre grupla
                  (() => {
                    const groupedAppointments = appointments.reduce((groups, appointment) => {
                      const date = new Date(appointment.date);
                      const dateKey = date.toISOString().split('T')[0];
                      if (!groups[dateKey]) {
                        groups[dateKey] = [];
                      }
                      groups[dateKey].push(appointment);
                      return groups;
                    }, {});

                    return Object.entries(groupedAppointments)
                      .sort(([a], [b]) => new Date(a) - new Date(b))
                      .slice(0, 4) // Sadece ilk 4 günü göster
                      .map(([dateKey, dayAppointments]) => {
                        const date = new Date(dateKey);
                        const dayNumber = date.getDate();
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' }).toUpperCase();
                        const monthName = date.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase();
                        
                        return (
                          <div key={dateKey} className="appointment-day-group">
                            <div className="appointment-day-header">
                              <div className="day-number-large">{dayNumber}</div>
                              <div className="day-info">
                                <div className="day-name">{dayName}, {monthName}</div>
                              </div>
                            </div>
                            <div className="appointment-day-list">
                              {dayAppointments.map((appointment, index) => {
                                const formattedAppointment = formatAppointmentForDisplay(appointment);
                                const appointmentColor = appointment.color || '#3b82f6';
                                
                                return (
                                  <div key={appointment.id} className="appointment-time-row">
                                    <div className="appointment-time-info">
                                      <div 
                                        className="time-color-dot" 
                                        style={{ backgroundColor: appointmentColor }}
                                      ></div>
                                      <span className="appointment-time">{formattedAppointment.time}</span>
                                    </div>
                                    <div className="appointment-title-text">{formattedAppointment.title}</div>
                                    {appointment.status === 'COMPLETED' && (
                                      <div className="completed-check">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                          <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                  })()
                )}
                
                {/* TÜMÜNÜ GÖSTER Butonu */}
                {!selectedDate && appointments.length > 0 && (
                  <div className="show-all-button-container">
                    <button 
                      className="show-all-button"
                      onClick={() => navigate('/appointments')}
                    >
                      TÜMÜNÜ GÖSTER
                    </button>
                  </div>
                )}
                

              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CalendarWidget;