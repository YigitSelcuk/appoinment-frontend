import React, { useState, useEffect } from 'react';
import { getAppointmentById } from '../../services/appointmentsService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './ViewAppointmentModal.css';

const ViewAppointmentModal = ({ isOpen, onClose, onEdit, onDelete, appointmentId, appointmentData }) => {
  const { showError } = useSimpleToast();
  const { accessToken, user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal açıldığında randevu detaylarını yükle
  useEffect(() => {
    if (isOpen && appointmentId) {
      loadAppointmentDetails();
    } else if (isOpen && appointmentData) {
      setAppointment(appointmentData);
    }
  }, [isOpen, appointmentId, appointmentData]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      if (!accessToken) {
        showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const response = await getAppointmentById(accessToken, appointmentId);
      if (response.success) {
        const appointmentData = response.data;
        
        // Yetki kontrolü kaldırıldı - herkes görüntüleyebilir
        
        console.log('=== RANDEVU DETAYLARI DEBUG ===');
        console.log('Backend\'den gelen tam veri:', response.data);
        console.log('Oluşturan bilgileri:');
        console.log('- creator_name:', response.data.creator_name);
        console.log('- created_by_name:', response.data.created_by_name);
        console.log('- creator_email:', response.data.creator_email);
        console.log('- created_by_email:', response.data.created_by_email);
        console.log('Katılımcı bilgileri:');
        console.log('- attendee_name:', response.data.attendee_name);
        console.log('- attendees array:', response.data.attendees);
        console.log('Davetli bilgileri:');
        console.log('- invitees array:', response.data.invitees);
        console.log('- invitees raw:', typeof response.data.invitees, response.data.invitees);
        if (response.data.invitees && response.data.invitees.length > 0) {
          console.log('- İlk davetli:', response.data.invitees[0]);
        }
        console.log('Diğer alanlar:');
        console.log('- status:', response.data.status);
        console.log('- type:', response.data.type);
        console.log('- priority:', response.data.priority);
        console.log('- visible_to_all:', response.data.visible_to_all);
        console.log('- notification_email:', response.data.notification_email);
        console.log('- notification_sms:', response.data.notification_sms);
        console.log('- reminder_value:', response.data.reminder_value);
        console.log('- reminder_unit:', response.data.reminder_unit);
        console.log('- reminder_info:', response.data.reminder_info);
        console.log('================================');
        setAppointment(response.data);
      } else {
        showError('Randevu detayları yüklenemedi');
      }
    } catch (error) {
      console.error('Randevu detayları yüklenirken hata:', error);
      showError('Randevu detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (onEdit && appointment) {
      onEdit(appointment);
    }
  };

  const handleDelete = () => {
    if (onDelete && appointment) {
      // Önce ViewAppointmentModal'ı kapat
      onClose();
      // Sonra silme işlemini başlat
      onDelete(appointment);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM formatı
  };



  const getStatusText = (status) => {
    const statuses = {
      'SCHEDULED': 'Planlandı',
      'scheduled': 'Planlandı',
      'CONFIRMED': 'Onaylandı',
      'confirmed': 'Onaylandı',
      'COMPLETED': 'Tamamlandı',
      'completed': 'Tamamlandı',
      'CANCELLED': 'İptal Edildi',
      'cancelled': 'İptal Edildi',
      'postponed': 'Ertelendi'
    };
    return statuses[status] || 'Belirtilmemiş';
  };

  const getReminderText = (value, unit) => {
    if (!value || !unit) return 'Hatırlatma yok';
    const units = {
      'minutes': 'dakika',
      'hours': 'saat',
      'days': 'gün',
      'weeks': 'hafta'
    };
    return `${value} ${units[unit] || unit} önce`;
  };

  const getReminderStatusText = (status) => {
    const statuses = {
      'scheduled': 'Zamanlandı',
      'sending': 'Gönderiliyor',
      'sent': 'Gönderildi',
      'cancelled': 'İptal Edildi',
      'failed': 'Başarısız'
    };
    return statuses[status] || 'Bilinmiyor';
  };

  const formatReminderDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Katılımcı bilgisini akıllı şekilde al
  const getAttendeeInfo = (appointment) => {
    // Önce attendee_name'i kontrol et
    if (appointment.attendee_name) {
      return appointment.attendee_name;
    }
    
    // Sonra attendee_email'i kontrol et
    if (appointment.attendee_email) {
      return appointment.attendee_email;
    }
    
    // Sonra invitees array'ini kontrol et
    if (appointment.invitees && Array.isArray(appointment.invitees) && appointment.invitees.length > 0) {
      // Birden fazla davetli varsa hepsini göster
      return appointment.invitees.map(invitee => invitee.name || invitee.email || 'İsimsiz').join(', ');
    }
    
    // Sonra attendees array'ini kontrol et
    if (appointment.attendees && Array.isArray(appointment.attendees) && appointment.attendees.length > 0) {
      return appointment.attendees.map(attendee => attendee.name || attendee.email || 'İsimsiz').join(', ');
    }
    
    return 'Belirtilmemiş';
  };



  if (!isOpen) return null;

  return (
    <div className="modal-overlay view-appointment-overlay" onClick={onClose}>
      <div className="view-appointment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Randevu Detayları</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Randevu detayları yükleniyor...</p>
            </div>
          ) : appointment ? (
            <div className="appointment-details">
              {/* Başlık ve Renk */}
              <div className="detail-section">
                <div className="appointment-header">
                  <div 
                    className="appointment-color-indicator"
                    style={{ backgroundColor: appointment.color || '#3C02AA' }}
                  ></div>
                  <h3 className="appointment-title">{appointment.title}</h3>
                </div>
                <div className="appointment-meta">
                  <span className="chip date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect x="3" y="5" width="18" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="1.6"/>
                      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.6"/>
                      <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                    {formatDate(appointment.date)}
                  </span>
                  <span className="chip time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {appointment.start_time && appointment.end_time 
                      ? `${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`
                      : 'Belirtilmemiş'}
                  </span>
                </div>
              </div>

              {/* Tarih ve Saat */}
              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Tarih:</label>
                    <span>{formatDate(appointment.date)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Saat:</label>
                    <span>
                      {appointment.start_time && appointment.end_time 
                        ? `${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`
                        : 'Belirtilmemiş'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Açıklama */}
              {appointment.description && (
                <div className="detail-section">
                  <label>Açıklama:</label>
                  <p className="description-text">{appointment.description}</p>
                </div>
              )}

              {/* Konum */}
              {appointment.location && (
                <div className="detail-section">
                  <label>Konum:</label>
                  <span>{appointment.location}</span>
                </div>
              )}

              {/* Durum, Tip ve Öncelik */}
              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Durum:</label>
                    <span className={`status-badge status-${appointment.status ? appointment.status.toLowerCase() : 'scheduled'}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Oluşturan ve Katılımcı */}
              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Oluşturan:</label>
                    <span>
                      {appointment.creator_name || appointment.created_by_name || 
                       (appointment.created_by_email ? appointment.created_by_email : 'Bilinmiyor')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Katılımcı:</label>
                    <span>{getAttendeeInfo(appointment)}</span>
                  </div>
                </div>
                {appointment.created_by_email && (
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Oluşturan E-posta:</label>
                      <span>{appointment.created_by_email}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Katılımcılar Listesi */}
              {appointment.attendees && appointment.attendees.length > 0 && (
                <div className="detail-section">
                  <label>Katılımcılar:</label>
                  <div className="attendees-list">
                    {appointment.attendees.map((attendee, index) => (
                      <div key={index} className="attendee-item">
                        <span className="attendee-name">{attendee.name}</span>
                        {attendee.email && <span className="attendee-email">{attendee.email}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Davetliler Listesi */}
              {appointment.invitees && appointment.invitees.length > 0 && (
                <div className="detail-section">
                  <label>Davetliler:</label>
                  <div className="invitees-list">
                    {appointment.invitees.map((invitee, index) => (
                      <div key={index} className="invitee-item">
                        <span className="invitee-name">{invitee.name}</span>
                        {invitee.email && <span className="invitee-email">{invitee.email}</span>}
                        {invitee.phone && <span className="invitee-phone">{invitee.phone}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bildirim Ayarları */}
              <div className="detail-section">
                <label>Bildirim Ayarları:</label>
                <div className="detail-row">
                  <div className="detail-item">
                    <label>E-posta Bildirimi:</label>
              
                  </div>

                </div>
              </div>

              {/* Hatırlatma */}
              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Hatırlatma:</label>
                    <span>{getReminderText(appointment.reminder_value, appointment.reminder_unit)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Görünürlük:</label>
                    <span className={`visibility-badge ${appointment.visible_to_all ? 'public' : 'private'}`}>
                      {appointment.visible_to_all ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Herkese Açık
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2"/>
                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Özel
                        </>
                      )}
                    </span>
                  </div>
                </div>
                {/* Hatırlatma Durumu */}
                {appointment.reminder_info && (
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Hatırlatma Durumu:</label>
                      <span className={`reminder-status-badge status-${appointment.reminder_info.status}`}>
                        {getReminderStatusText(appointment.reminder_info.status)}
                      </span>
                    </div>
                    {appointment.reminder_info.reminder_time && (
                      <div className="detail-item">
                        <label>Hatırlatma Zamanı:</label>
                        <span>{formatReminderDateTime(appointment.reminder_info.reminder_time)}</span>
                      </div>
                    )}
                  </div>
                )}
                {appointment.reminder_info && appointment.reminder_info.sent_at && (
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Gönderilme Zamanı:</label>
                      <span>{formatReminderDateTime(appointment.reminder_info.sent_at)}</span>
                    </div>
                  </div>
                )}
                

              </div>

              {/* Tarih Bilgileri */}
              <div className="detail-section">
                <div className="detail-row">
                  {appointment.created_at && (
                    <div className="detail-item">
                      <label>Oluşturulma Tarihi:</label>
                      <span>{formatDateTime(appointment.created_at)}</span>
                    </div>
                  )}
                  {appointment.updated_at && (
                    <div className="detail-item">
                      <label>Güncellenme Tarihi:</label>
                      <span>{formatDateTime(appointment.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data">
              <p>Randevu detayları bulunamadı.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            {appointment && onDelete && (
              <button className="btn btn-danger" onClick={handleDelete}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sil
              </button>
            )}
          </div>
          <div className="footer-right">
            <button className="btn btn-secondary" onClick={onClose}>
              Kapat
            </button>
            {appointment && onEdit && (
              <button className="btn btn-primary" onClick={handleEdit}>
                Düzenle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAppointmentModal;