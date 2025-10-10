import React, { useState, useEffect } from 'react';
import AddAppointmentModal from '../AddAppointmentModal/AddAppointmentModal';
import DeleteAppointmentModal from '../DeleteAppointmentModal/DeleteAppointmentModal';
import ViewAppointmentModal from '../ViewAppointmentModal/ViewAppointmentModal';
import EditAppointmentModal from '../EditAppointmentModal/EditAppointmentModal';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from '../../services/appointmentsService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import googleCalendarService from '../../services/googleCalendarService';
import './WeeklyCalendar.css';

const WeeklyCalendar = ({ 
  selectedDate: externalSelectedDate,
  onDateChange 
}) => {
  // Toast hook'u
  const { showSuccess, showError } = useSimpleToast();
  const { accessToken, user } = useAuth();
  const { socket } = useSocket();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Google Calendar için state'ler - varsayılan olarak kapalı
  // showGoogleEvents state'i kaldırıldı - Google etkinlikleri artık görüntülenmeyecek
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(true);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(() => {
    try {
      const signedIn = localStorage.getItem('googleSignedIn') === 'true';
      console.log('🔧 WeeklyCalendar: isGoogleSignedIn başlangıç değeri:', signedIn);
      return signedIn;
    } catch (error) {
      console.log('🔧 WeeklyCalendar: isGoogleSignedIn başlangıç hatası:', error);
      return false;
    }
  });
  const [googleLoading, setGoogleLoading] = useState(false);
  // currentTime state'i kaldırıldı - pozisyonlama sistemi sıfırdan yazılacak
  
  // Takvim navigasyonu için state'ler
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('HAFTA'); // 'YIL', 'AY', 'HAFTA', 'GÜN'
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());

  // Randevu verileri - backend'den gelecek
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      title: 'Bilgi İşlem Müdürlüğü Sunum',
      time: '09:00',
      endTime: '11:30',
      attendee: 'Melih Aygün',
      color: '#29CC39',
      day: 1, // Pazartesi
      duration: 2.5 // 2.5 saat
    },
    {
      id: 2,
      title: 'Fen İşleri Müdürlüğü koordinasyon toplantısı',
      time: '11:00',
      endTime: '12:00',
      attendee: 'Melih Aygün',
      color: '#FF6633',
      day: 1, // Pazartesi
      duration: 1
    },
    {
      id: 3,
      title: 'Muhtarlar Toplantısı',
      time: '10:00',
      endTime: '11:00',
      attendee: 'Ömer Gök',
      color: '#FF6633',
      day: 2, // Salı
      duration: 1
    },
    {
      id: 4,
      title: 'İl meclis Üyesi Toplantısı',
      time: '11:00',
      endTime: '12:30',
      attendee: 'Ömer Gök',
      color: '#FFCB33',
      day: 2, // Salı
      duration: 1.5
    },
    {
      id: 5,
      title: 'Hizmet Tesisi Programı',
      time: '13:00',
      endTime: '14:00',
      attendee: 'Melih Aygün',
      color: '#33BFFF',
      day: 3, // Çarşamba
      duration: 1
    },
    {
      id: 6,
      title: 'Belediye Açılış Tesisleri',
      time: '11:00',
      endTime: '14:00',
      attendee: 'Ömer Gök',
      color: '#FF8C33',
      day: 4, // Perşembe
      duration: 3
    },
    {
      id: 7,
      title: 'Sultangazi Gastronomi Programı',
      time: '15:00',
      endTime: '17:30',
      attendee: 'Ömer Gök',
      color: '#E62E7B',
      day: 4, // Perşembe
      duration: 2.5
    },
    {
      id: 8,
      title: 'Sultangazi Federasyonu Programı',
      time: '17:00',
      endTime: '19:00',
      attendee: 'Melih Aygün',
      color: '#33BFFF',
      day: 4, // Perşembe
      duration: 2
    },
    {
      id: 9,
      title: 'Ankara Külliye Programı',
      time: '11:00',
      endTime: '14:00',
      attendee: 'Ömer Gök',
      color: '#2EE6CA',
      day: 5, // Cuma
      duration: 3
    }
  ]);

  // Backend'den randevuları yükle
  useEffect(() => {
    loadAppointments();
  }, [accessToken]);

  // Hafta değiştiğinde randevuları yeniden yükle
  useEffect(() => {
    loadAppointments();
  }, [selectedWeekStart, accessToken]);

  // Haftanın başlangıcını ayarla
  useEffect(() => {
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    setSelectedWeekStart(startOfWeek);
  }, []);

  // Google Calendar başlatma
  useEffect(() => {
    const initGoogleCalendar = async () => {
      try {
        const initResult = await googleCalendarService.init();
        
        if (initResult) {
          // Init sonrası token durumunu kontrol et (localStorage'dan geri yüklenmiş olabilir)
          let isSignedIn = await googleCalendarService.isSignedIn();
          console.log('🔐 Google Calendar giriş durumu:', isSignedIn);
          
          // Eğer hala giriş yapılmamışsa ve daha önce giriş yapılmışsa, sessiz token iste
          if (!isSignedIn) {
            let wasSignedIn = false;
            try { wasSignedIn = localStorage.getItem('googleSignedIn') === 'true'; } catch (_) {}
            
            if (wasSignedIn) {
              try {
                const silentResult = await googleCalendarService.silentSignIn();
                isSignedIn = await googleCalendarService.isSignedIn();
                console.log('🔐 Google Calendar sessiz giriş sonucu:', isSignedIn);
              } catch (e) {
                console.warn('❌ Google Calendar sessiz giriş başarısız:', e);
              }
            }
          }

          setIsGoogleSignedIn(isSignedIn);
          try { localStorage.setItem('googleSignedIn', isSignedIn ? 'true' : 'false'); } catch (_) {}
        }
      } catch (error) {
        console.error('❌ Google Calendar başlatma hatası:', error);
      }
    };
    if (googleCalendarEnabled) {
      initGoogleCalendar();
    } else {
      console.log('⚠️ WeeklyCalendar: Google Calendar devre dışı');
      setIsGoogleSignedIn(false);
    }
  }, [googleCalendarEnabled]);

  // Hafta değiştiğinde randevuları yeniden yükle
  useEffect(() => {
    console.log('📅 WeeklyCalendar: Randevular yeniden yükleniyor...', {
      selectedWeekStart: selectedWeekStart.toISOString(),
      accessToken: accessToken ? 'MEVCUT' : 'YOK',
      googleCalendarEnabled,
      isGoogleSignedIn
    });
    loadAppointments();
  }, [selectedWeekStart, accessToken, googleCalendarEnabled, isGoogleSignedIn]);

  // External selected date değiştiğinde hafta görünümünü güncelle
  useEffect(() => {
    if (externalSelectedDate) {
      const selectedDateObj = new Date(externalSelectedDate);
      const startOfWeek = getStartOfWeek(selectedDateObj);
      setSelectedWeekStart(startOfWeek);
    }
  }, [externalSelectedDate]);

  // Socket.IO real-time güncellemeler
  useEffect(() => {
    if (!socket) return;

    console.log('🔌 WeeklyCalendar: Socket event listenerlari ekleniyor...');

    // Randevu ekleme event'i
    const handleAppointmentCreated = (data) => {
      console.log('📅 Yeni randevu eklendi:', data);
      loadAppointments(); // Randevuları yeniden yükle
    };

    // Randevu güncelleme event'i
    const handleAppointmentUpdated = (data) => {
      console.log('📅 Randevu güncellendi:', data);
      loadAppointments(); // Randevuları yeniden yükle
    };

    // Randevu silme event'i
    const handleAppointmentDeleted = (data) => {
      console.log('📅 Randevu silindi:', data);
      loadAppointments(); // Randevuları yeniden yükle
    };

    // Event listener'ları ekle
    socket.on('appointment-created', handleAppointmentCreated);
    socket.on('appointment-updated', handleAppointmentUpdated);
    socket.on('appointment-deleted', handleAppointmentDeleted);

    // Cleanup function
    return () => {
      console.log('🔌 WeeklyCalendar: Socket event listenerlari kaldiriliyor...');
      socket.off('appointment-created', handleAppointmentCreated);
      socket.off('appointment-updated', handleAppointmentUpdated);
      socket.off('appointment-deleted', handleAppointmentDeleted);
    };
  }, [socket, showSuccess]);

  // Anlık saat çizgisi useEffect'i kaldırıldı - pozisyonlama sistemi sıfırdan yazılacak

  // Haftanın başlangıcını hesapla (Pazartesi)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'yi başlangıç yap
    return new Date(d.setDate(diff));
  };

  // Hafta sonunu hesapla
  const getEndOfWeek = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate;
  };

  // Tarih formatını düzenle
  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Saat formatını düzenle
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  // Ay adını getir
  const getMonthName = (date) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[date.getMonth()];
  };

  // Hafta tarih aralığını formatla
  const getWeekRange = () => {
    const endDate = getEndOfWeek(selectedWeekStart);
    const startMonth = getMonthName(selectedWeekStart).toUpperCase();
    const endMonth = getMonthName(endDate).toUpperCase();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${selectedWeekStart.getDate()} – ${endDate.getDate()}, ${selectedWeekStart.getFullYear()}`;
    } else {
      return `${startMonth} ${selectedWeekStart.getDate()} – ${endMonth} ${endDate.getDate()}, ${selectedWeekStart.getFullYear()}`;
    }
  };

  const loadAppointments = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await getAppointments(accessToken);
      let formattedAppointments = [];
      
      if (response.success) {
        // Backend'den gelen verileri frontend formatına çevir ve filtreleme uygula
        const filteredAppointments = response.data.filter(appointment => {
          // BAŞKAN departmanı, admin veya başkan rolündeki kullanıcılar tüm randevuları görebilir
          const canViewAll = user?.role === 'admin' || 
                            user?.role === 'başkan' || 
                            user?.department === 'BAŞKAN';
          
          if (canViewAll) {
            return true;
          }
          
          // Kendi oluşturduğu randevular
          if (appointment.user_id === user?.id) {
            return true;
          }
          
          // Tüm kullanıcılara görünür randevular
          if (appointment.visible_to_all) {
            return true;
          }
          
          // visible_to_users listesinde olan randevular
          if (appointment.visible_to_users) {
            try {
              const visibleUsers = typeof appointment.visible_to_users === 'string' 
                ? JSON.parse(appointment.visible_to_users) 
                : appointment.visible_to_users;
              
              if (Array.isArray(visibleUsers)) {
                return visibleUsers.some(visibleUser => 
                  visibleUser.id === user?.id || visibleUser.id === user?.id?.toString()
                );
              }
            } catch (error) {
              console.error('visible_to_users parse hatası:', error);
            }
          }
          
          return false;
        });
        
        formattedAppointments = filteredAppointments.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          date: appointment.date,
          time: appointment.start_time ? appointment.start_time.substring(0, 5) : '00:00',
          startTime: appointment.start_time ? appointment.start_time.substring(0, 5) : '00:00',
          endTime: appointment.end_time ? appointment.end_time.substring(0, 5) : '00:00',
          attendee: (() => {
            if (appointment.creator_name) return appointment.creator_name;
            if (appointment.created_by_name) return appointment.created_by_name;
            if (appointment.attendee_name) return appointment.attendee_name;
            if (appointment.invitees && Array.isArray(appointment.invitees) && appointment.invitees.length > 0) {
              return appointment.invitees[0].name || appointment.invitees[0].email || 'Davetli';
            }
            if (appointment.attendees && Array.isArray(appointment.attendees) && appointment.attendees.length > 0) {
              return appointment.attendees[0].name || appointment.attendees[0].email || 'Katılımcı';
            }
            return 'Bilinmiyor';
          })(),
          color: appointment.creator_color || appointment.color || '#3C02AA',
          day: calculateDayIndex(appointment.date),
          duration: calculateDurationFromTimes(appointment.start_time, appointment.end_time),
          description: appointment.description,
          status: appointment.status,
          type: appointment.type,
          priority: appointment.priority,
          creatorName: appointment.creator_name || appointment.created_by_name,
          attendeeName: appointment.attendee_name,
          attendees: appointment.attendees || [],
          invitees: appointment.invitees || [],
          isGoogleEvent: appointment.source === 'GOOGLE',
          googleEventId: appointment.google_event_id,
          ...appointment
        }));
      }
      
      // Google Calendar etkinliklerini sadece state'e yükle, ana listeye ekleme
      // Sadece kendi sistemimizden gelen randevuları göster
      if (googleCalendarEnabled && isGoogleSignedIn) {
        try {
          console.log('📅 WeeklyCalendar: Google Calendar bağlantısı aktif (sadece senkronizasyon için)');
          const weekStart = new Date(selectedWeekStart);
          const weekEnd = new Date(selectedWeekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          // Kullanıcının rengini Google etkinlikleri için kullan
          const userColor = user?.color || '#4285f4';
          
          const googleEvents = await googleCalendarService.getEvents(
            weekStart.toISOString(),
            weekEnd.toISOString(),
            userColor
          );
          setGoogleEvents(googleEvents);
          console.log('📅 Google Calendar etkinlikleri yüklendi (sadece senkronizasyon için):', googleEvents.length);
        } catch (error) {
          console.error('❌ Google Calendar etkinlikleri yüklenirken hata:', error);
          setGoogleEvents([]);
        }
      } else {
        // Google Calendar bağlantısı yoksa boş array set et
        setGoogleEvents([]);
      }
      
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Randevular yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tarihten gün indexini hesapla (0-6 arası)
  const calculateDayIndex = (dateString) => {
    // Backend'den gelen tarih formatı: YYYY-MM-DD veya ISO string
    const appointmentDateStr = dateString.split('T')[0]; // ISO string ise sadece tarih kısmını al
    
    const weekStart = selectedWeekStart;
    const weekEnd = getEndOfWeek(weekStart);
    
    // Hafta başlangıcı ve bitişini YYYY-MM-DD formatına çevir
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    // String karşılaştırması ile randevunun bu haftaya ait olup olmadığını kontrol et
    if (appointmentDateStr >= weekStartStr && appointmentDateStr <= weekEndStr) {
      // Gün farkını hesapla
      const appointmentDate = new Date(appointmentDateStr + 'T12:00:00'); // Timezone sorununu önlemek için öğlen saati
      const weekStartDate = new Date(weekStartStr + 'T12:00:00');
      const diffTime = appointmentDate - weekStartDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return -1; // Gösterilmeyecek
  };

  // İki saat arasındaki süreyi hesapla
  const calculateDurationFromTimes = (startTime, endTime) => {
    if (!startTime || !endTime) return 1; // Varsayılan 1 saat
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end - start;
      const hours = diffMs / (1000 * 60 * 60); // Saate çevir
      return hours > 0 ? hours : 1; // Negatif değerlerde varsayılan 1 saat
    } catch (error) {
      console.error('Süre hesaplama hatası:', error);
      return 1; // Hata durumunda varsayılan 1 saat
    }
  };

  // Saat dilimleri - 00:00'dan 23:00'a kadar
  const timeSlots = [];
  for (let hour = 0; hour <= 23; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Haftalık görünüm için günleri hesapla
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    for (let i = 0; i < 7; i++) {
      // Timezone sorununu önlemek için string bazlı hesaplama
      const weekStartStr = selectedWeekStart.toISOString().split('T')[0];
      const date = new Date(weekStartStr + 'T12:00:00'); // Öğlen saati ile timezone sorununu önle
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      
      let dayName;
      if (dateStr === todayStr) {
        dayName = 'BUGÜN';
      } else {
        dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' }).toUpperCase();
      }
      
      days.push({
        name: dayName,
        date: date.getDate().toString(),
        fullDate: date
      });
    }
    
    return days;
  };

  const weekDays = getWeekDays();

  // Gün başlığına tıklama
  const handleDayHeaderClick = (selectedDate) => {
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  };

  // Hex rengi RGB'ye çevir
  const hexToRgb = (hex) => {
    if (!hex || hex.charAt(0) !== '#') {
      return null; 
    }
    
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getAppointmentColor = (appointment) => {
    return appointment.color || '#3C02AA';
  };

  // RANDEVU POZİSYONLAMA SİSTEMİ - Saatlere göre pozisyonlama
  const getAppointmentStyle = (appointment) => {
    const appointmentColor = appointment.color || '#3C02AA';
    const rgb = hexToRgb(appointmentColor);
    const rgbValues = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '60, 2, 170';
    
    // Randevunun başlangıç ve bitiş saatlerini al
    const startTime = appointment.startTime || appointment.time || '00:00';
    const endTime = appointment.endTime || '01:00';
    
    // Saat formatını parse et (HH:MM)
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + (minutes / 60);
    };
    
    const startHour = parseTime(startTime);
    const endHour = parseTime(endTime);
    
    // Her saat slotu 60px yüksekliğinde
    const hourHeight = 60;
    
    // Pozisyon hesaplama
    const topPosition = startHour * hourHeight;
    const appointmentHeight = Math.max((endHour - startHour) * hourHeight, 30); // Minimum 30px yükseklik
    
    return {
      position: 'absolute',
      top: `${topPosition}px`,
      height: `${appointmentHeight}px`,
      left: '4px',
      right: '4px',
      backgroundColor: `rgba(${rgbValues}, 0.15)`,
      border: `2px solid ${appointmentColor}`,
      borderRadius: '8px',
      padding: '8px 12px',
      cursor: 'pointer',
      zIndex: 5,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      // CSS değişkenlerini ayarla
      '--appointment-color': appointmentColor,
      '--appointment-color-rgb': rgbValues
    };
  };

  // Randevu ekleme modalını aç
  const handleTimeSlotClick = (dayIndex, timeIndex) => {
    if (dayIndex >= 7) return; // Geçersiz gün indexi
    
    const baseHour = 0;
    const selectedHour = timeIndex + baseHour; // 0'dan başlıyor
    const selectedTimeStr = `${selectedHour.toString().padStart(2, '0')}:00`;
    
    // Seçilen günün tarihini hesapla - timezone sorununu önlemek için
    const weekStartStr = selectedWeekStart.toISOString().split('T')[0];
    const targetDate = new Date(weekStartStr + 'T12:00:00'); // Öğlen saati ile timezone sorununu önle
    targetDate.setDate(targetDate.getDate() + dayIndex);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    setSelectedDate(dateStr);
    setSelectedTime(selectedTimeStr);
    setSelectedDay(dayIndex);
    setIsModalOpen(true);
  };

  // Yeni randevu kaydet
  const handleSaveAppointment = async (appointmentData) => {
    if (!accessToken) {
      showError('Erişim token\'ı bulunamadı!');
      return;
    }
    
    try {
      const response = await createAppointment(accessToken, appointmentData);
      if (response.success) {
        // Başarılı kayıt sonrası randevuları yeniden yükle
        await loadAppointments();
        showSuccess('Randevu başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('Randevu kaydetme hatası:', error);
      showError('Randevu kaydedilirken hata oluştu!');
    }
  };

  // Modal kapat
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedDay(null);
  };

  const handleAppointmentClick = (appointment) => {
    // Randevu tıklandığında görüntüleme modalını aç
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };

  const handleEditAppointment = (appointment) => {
    // Görüntüleme modalını kapat ve düzenleme modalını aç
    setIsViewModalOpen(false);
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const handleUpdateAppointment = async () => {
    // Randevu güncellendikten sonra listeyi yenile
    await loadAppointments();
    setIsEditModalOpen(false);
    setSelectedAppointment(null);
    showSuccess('Randevu başarıyla güncellendi!');
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!accessToken) {
      showError('Erişim token\'ı bulunamadı!');
      return;
    }
    
    try {
      // Google Calendar'dan da sil (eğer kullanıcı giriş yapmışsa ve Google Event ID varsa)
      console.log('🔍 Debug - Google Calendar silme kontrolü:');
      console.log('- isSignedIn:', googleCalendarService.isSignedIn());
      console.log('- selectedAppointment:', selectedAppointment);
      console.log('- googleEventId:', selectedAppointment?.googleEventId);
      
      if (googleCalendarService.isSignedIn() && selectedAppointment?.googleEventId) {
        try {
          console.log('📅 Google Calendar: Randevu siliniyor...', selectedAppointment.googleEventId);
          await googleCalendarService.deleteEvent(selectedAppointment.googleEventId);
          console.log('✅ Google Calendar: Randevu başarıyla silindi');
        } catch (googleError) {
          console.error('❌ Google Calendar: Randevu silinirken hata:', googleError);
        }
      } else {
        console.log('⚠️ Google Calendar silme atlandı - Koşullar sağlanmadı');
      }
      
      await deleteAppointment(accessToken, appointmentId);
      await loadAppointments(); // Randevuları yeniden yükle
      setIsDeleteModalOpen(false);
      setSelectedAppointment(null);
      
      if (googleCalendarService.isSignedIn() && selectedAppointment?.googleEventId) {
        showSuccess('Randevu başarıyla silindi ve Google Calendar\'dan kaldırıldı!');
      } else {
        showSuccess('Randevu başarıyla silindi!');
      }
    } catch (error) {
      console.error('Randevu silme hatası:', error);
      showError('Randevu silinirken bir hata oluştu: ' + error.message);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAppointment(null);
  };

  // Google Calendar fonksiyonları
  const handleGoogleSignIn = async () => {
    try {
      console.log('🔑 WeeklyCalendar: Google giriş başlatılıyor...');
      setGoogleLoading(true);
      
      const signInResult = await googleCalendarService.signIn();
      console.log('✅ WeeklyCalendar: Google giriş sonucu:', signInResult);
      
      const isSignedIn = await googleCalendarService.isSignedIn();
      console.log('🔐 WeeklyCalendar: Giriş sonrası durum:', isSignedIn);
      console.log('🔍 WeeklyCalendar: GAPI token:', window.gapi?.client?.getToken());
      
      setIsGoogleSignedIn(isSignedIn);
      try { 
        localStorage.setItem('googleSignedIn', isSignedIn ? 'true' : 'false'); 
        console.log('💾 WeeklyCalendar: localStorage güncellendi:', localStorage.getItem('googleSignedIn'));
      } catch (_) {}
      
      if (isSignedIn) {
        showSuccess('Google Calendar\'a başarıyla giriş yapıldı!');
        await loadAppointments(); // Etkinlikleri yükle
      } else {
        showError('Google Calendar girişi tamamlanamadı!');
      }
    } catch (error) {
      console.error('❌ WeeklyCalendar: Google Calendar giriş hatası:', error);
      showError('Google Calendar giriş hatası: ' + error.message);
      setIsGoogleSignedIn(false);
      try { localStorage.setItem('googleSignedIn', 'false'); } catch (_) {}
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      console.log('🚪 WeeklyCalendar: Google çıkış başlatılıyor...');
      setGoogleLoading(true);
      
      const signOutResult = await googleCalendarService.signOut();
      console.log('✅ WeeklyCalendar: Google çıkış sonucu:', signOutResult);
      
      const isSignedIn = await googleCalendarService.isSignedIn();
      console.log('🔐 WeeklyCalendar: Çıkış sonrası durum:', isSignedIn);
      console.log('🔍 WeeklyCalendar: GAPI token temizlendi:', window.gapi?.client?.getToken());
      
      setIsGoogleSignedIn(false);
      setGoogleEvents([]);
      try { 
        localStorage.setItem('googleSignedIn', 'false'); 
        console.log('💾 WeeklyCalendar: localStorage temizlendi:', localStorage.getItem('googleSignedIn'));
      } catch (_) {}
      
      showSuccess('Google Calendar\'dan çıkış yapıldı!');
      await loadAppointments(); // Sadece yerel randevuları göster
    } catch (error) {
      console.error('❌ WeeklyCalendar: Google Calendar çıkış hatası:', error);
      showError('Google Calendar çıkış hatası: ' + error.message);
    } finally {
      setGoogleLoading(false);
    }
  };



  const handleOpenDeleteModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  // Navigasyon fonksiyonları
  const goToPreviousWeek = () => {
    if (viewMode === 'AY') {
      const prevMonth = new Date(currentDate);
      prevMonth.setMonth(currentDate.getMonth() - 1);
      setCurrentDate(prevMonth);
      if (onDateChange) {
        onDateChange(prevMonth);
      }
    } else {
      const prevWeek = new Date(selectedWeekStart);
      prevWeek.setDate(selectedWeekStart.getDate() - 7);
      setSelectedWeekStart(prevWeek);
      
      if (onDateChange) {
        onDateChange(prevWeek);
      }
    }
  };

  const goToNextWeek = () => {
    if (viewMode === 'AY') {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(currentDate.getMonth() + 1);
      setCurrentDate(nextMonth);
      if (onDateChange) {
        onDateChange(nextMonth);
      }
    } else {
      const nextWeek = new Date(selectedWeekStart);
      nextWeek.setDate(selectedWeekStart.getDate() + 7);
      setSelectedWeekStart(nextWeek);
      
      if (onDateChange) {
        onDateChange(nextWeek);
      }
    }
  };

  const goToToday = () => {
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    setSelectedWeekStart(startOfWeek);
    
    if (onDateChange) {
      onDateChange(today);
    }
  };

  // Görünüm değiştirme
  const handleViewChange = (newView) => {
    setViewMode(newView);
    // Görünüm değiştiğinde ilgili işlemler yapılabilir
    if (newView === 'GÜN') {
      // Günlük görünüm için bugünü seç
      const today = new Date();
      setCurrentDate(today);
    }
  };

  // Görünüm moduna göre içerik render et
  const renderCalendarContent = () => {
    switch (viewMode) {
      case 'YIL':
        return renderYearView();
      case 'AY':
        return renderMonthView();
      case 'GÜN':
        return renderDayView();
      default:
        return renderWeekView();
    }
  };

  // ANLIK SAAT ÇİZGİSİ POZİSYONU - SİLİNDİ (Kullanıcı tarafından sıfırdan yazılacak)
  const getCurrentTimePosition = () => {
    // Pozisyonlama mantığı kaldırıldı
    return 0;
  };

  // Haftalık görünüm
  const renderWeekView = () => {
    // currentTimePosition kaldırıldı - pozisyonlama sistemi sıfırdan yazılacak
    
    return (
    <div className="weekly-grid">
      {/* Saat Sütunu */}
      <div className="time-column">
        <div className="time-header"></div>
        {timeSlots.map((time, index) => (
          <div key={index} className="time-slot">
            {time}
          </div>
        ))}
      </div>

      {/* Gün Sütunları */}
      {weekDays.map((day, dayIndex) => (
        <div key={dayIndex} className="day-column">
          <div 
            className="day-header"
            onClick={() => handleDayHeaderClick(day.fullDate)}
            style={{ cursor: 'pointer' }}
          >
            <div className="day-name">{day.name}</div>
            <div className="day-date">{day.date}</div>
          </div>
          
          <div className="day-slots">
            {/* Saat çizgileri (arka plan) */}
            {timeSlots.map((time, timeIndex) => (
              <div 
                key={timeIndex} 
                className="time-cell"
                onClick={() => handleTimeSlotClick(dayIndex, timeIndex)}
              ></div>
            ))}
            
            {/* Anlık saat çizgisi - SİLİNDİ (Kullanıcı tarafından sıfırdan yazılacak) */}
            
            {/* Bu güne ait randevular (sürekli bloklar) */}
            {appointments
              .filter(appointment => {
                // Backend'den gelen randevuları tarihe göre filtrele
                if (appointment.date) {
                  const appointmentDate = new Date(appointment.date);
                  const currentDayDate = new Date(selectedWeekStart);
                  currentDayDate.setDate(currentDayDate.getDate() + dayIndex);
                  
                  return appointmentDate.toDateString() === currentDayDate.toDateString();
                }
                // Eski test verileri için day alanını kullan
                return appointment.day === dayIndex && appointment.day !== -1;
              })
              .map(appointment => (
                <div
                  key={appointment.id}
                  className={`appointment-block ${appointment.isGoogleEvent ? 'google-event' : ''}`}
                  style={getAppointmentStyle(appointment)}
                  onClick={() => handleAppointmentClick(appointment)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!appointment.isGoogleEvent) {
                      handleOpenDeleteModal(appointment);
                    }
                  }}
                  title={appointment.isGoogleEvent ? 'Google Calendar Etkinliği (Dış Kaynak)' : 'Sistem Randevusu - Sol tık: Görüntüle, Sağ tık: Sil'}
                >
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
                  <div style={{ 
                    fontSize: '10px', 
                    marginBottom: '3px',
                    color: appointment.color,
                    fontWeight: '700'
                  }}>
                    {formatTime(appointment.startTime || appointment.time)} - {formatTime(appointment.endTime)}
                  </div>
                  <div style={{ 
                    fontSize: '12px',
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '2px'
                  }}>
                    {appointment.title}
                  </div>
                  <div style={{ 
                    fontSize: '10px',
                    color: '#6B7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {appointment.attendee}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      ))}
    </div>
    );
  };

  // Günlük görünüm
  const renderDayView = () => (
    <div className="day-view">
      <div className="day-view-content">
        <h3>Günlük Görünüm - {formatDate(currentDate)}</h3>
        <p>Günlük görünüm yakında eklenecek...</p>
      </div>
    </div>
  );

  // Aylık görünüm için yardımcı fonksiyonlar
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Pazartesi'yi 0 yap
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    
    const days = [];
    
    // Sadece bu ayın günleri (30 günlük görünüm)
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isPrevMonth: false,
        date: new Date(year, month, day)
      });
    }
    
    return days;
  };

  const getAppointmentsForDate = (date) => {
    if (!date || isNaN(date.getTime())) {
      return [];
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const dayAppointments = appointments.filter(appointment => {
      if (!appointment.date) {
        return false;
      }
      
      const appointmentDate = new Date(appointment.date);
      if (isNaN(appointmentDate.getTime())) {
        return false;
      }
      
      return appointmentDate.toISOString().split('T')[0] === dateStr;
    });
    
    // Randevuları saate göre sırala
    return dayAppointments.sort((a, b) => {
      const timeA = a.startTime || a.time || '00:00';
      const timeB = b.startTime || b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  const isToday = (date) => {
    if (!date || isNaN(date.getTime())) {
      return false;
    }
    
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Aylık görünüm
  const renderMonthView = () => {
    const monthDays = getMonthDays();
    const dayNames = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];
    
    return (
      <div className="month-view">
        <div className="month-grid">
          {/* Gün başlıkları */}
          <div className="month-header">
            {dayNames.map(dayName => (
              <div key={dayName} className="month-day-header">
                {dayName}
              </div>
            ))}
          </div>
          
          {/* Günler */}
          <div className="month-days">
            {monthDays.map((dayInfo, index) => {
              const dayAppointments = getAppointmentsForDate(dayInfo.date);
              return (
                <div 
                  key={index} 
                  className={`month-day ${
                    dayInfo.isCurrentMonth ? 'current-month' : 'other-month'
                  } ${
                    isToday(dayInfo.date) ? 'today' : ''
                  }`}
                  onClick={() => {
                    if (dayInfo.isCurrentMonth && dayInfo.date && !isNaN(dayInfo.date.getTime())) {
                      handleDayHeaderClick(dayInfo.date);
                    }
                  }}
                >
                  <div className="month-day-number">
                    {dayInfo.day}
                  </div>
                  
                  {/* Randevular */}
                  <div className="month-day-appointments">
                    {dayAppointments.slice(0, 2).map((appointment, idx) => (
                      <div 
                        key={appointment.id}
                        className={`month-appointment ${appointment.isGoogleEvent ? 'google-event' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppointmentClick(appointment);
                        }}
                        title={appointment.isGoogleEvent 
                          ? `Google Calendar Etkinliği (Dış Kaynak) - ${formatTime(appointment.startTime)} - ${appointment.title}`
                          : `Sistem Randevusu - ${formatTime(appointment.startTime)} - ${appointment.title}`
                        }
                        style={{ position: 'relative' }}
                      >
                        <div 
                          className="month-appointment-dot"
                          style={{
                            backgroundColor: getAppointmentColor(appointment)
                          }}
                        ></div>
                        <span className="month-appointment-time">{formatTime(appointment.startTime)}</span>
                        <span className="month-appointment-title">{appointment.title}</span>
                        {/* Tamamlanmış randevular için yeşil tik */}
                        {appointment.status === 'COMPLETED' && (
                          <div style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#10B981',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                          }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="month-appointment-more">
                        +{dayAppointments.length - 2} daha
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          

        </div>
      </div>
    );
  };

  // Yıllık görünüm
  const renderYearView = () => (
    <div className="year-view">
      <div className="year-view-content">
        <h3>Yıllık Görünüm - {currentDate.getFullYear()}</h3>
        <p>Yıllık görünüm yakında eklenecek...</p>
      </div>
    </div>
  );

  // Tarih seçici
  const handleDateSelect = (selectedDate) => {
    const startOfWeek = getStartOfWeek(new Date(selectedDate));
    setSelectedWeekStart(startOfWeek);
    setCurrentDate(new Date(selectedDate));
    
    if (onDateChange) {
      onDateChange(new Date(selectedDate));
    }
  };

  if (loading) {
    return (
      <div className="weekly-calendar-container">
        <div className="modern-loading">
          <div className="activity-indicator">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
          </div>
          <p className="loading-text">Takvim yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-calendar-container">
      {/* Üst Başlık */}
      <div className="calendar-header">
        <div className="header-left">
          <div className="calendar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M19 3H18V1C18 0.45 17.55 0 17 0C16.45 0 16 0.45 16 1V3H8V1C8 0.45 7.55 0 7 0C6.45 0 6 0.45 6 1V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z" fill="#3C02AA"/>
            </svg>
          </div>
          <h1 className="calendar-title">RANDEVU TAKVİMİ</h1>
        </div>
        
        <div className="header-controls">
          <div className="date-navigation">
            <button className="nav-btn" onClick={goToPreviousWeek}>
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path d="M7 1L2 6L7 11" stroke="#666" strokeWidth="2"/>
              </svg>
            </button>
            <div className="date-selector">
              <span className="current-date" onClick={goToToday}>
                {viewMode === 'AY' 
                  ? `${getMonthName(currentDate).toUpperCase()} ${currentDate.getFullYear()}`
                  : getWeekRange()
                }
              </span>
              <input
                type="date"
                className="date-input"
                value={viewMode === 'AY' 
                  ? currentDate.toISOString().split('T')[0]
                  : selectedWeekStart.toISOString().split('T')[0]
                }
                onChange={(e) => handleDateSelect(e.target.value)}
              />
            </div>
            <button className="nav-btn" onClick={goToNextWeek}>
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path d="M1 1L6 6L1 11" stroke="#666" strokeWidth="2"/>
              </svg>
            </button>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'YIL' ? 'active' : ''}`}
              onClick={() => handleViewChange('YIL')}
            >
              YIL
            </button>
            <button 
              className={`view-btn ${viewMode === 'AY' ? 'active' : ''}`}
              onClick={() => handleViewChange('AY')}
            >
              AY
            </button>
            <button 
              className={`view-btn ${viewMode === 'HAFTA' ? 'active' : ''}`}
              onClick={() => handleViewChange('HAFTA')}
            >
              HAFTA
            </button>
            <button 
              className={`view-btn ${viewMode === 'GÜN' ? 'active' : ''}`}
              onClick={() => handleViewChange('GÜN')}
            >
              GÜN
            </button>
          </div>
          
          {/* Google Calendar Kontrolleri */}
          <div className="google-calendar-controls">
            <button 
              className={`google-auth-btn ${isGoogleSignedIn ? 'signed-in' : 'signed-out'}`}
              onClick={isGoogleSignedIn ? handleGoogleSignOut : handleGoogleSignIn}
              disabled={googleLoading}
            >
              <i className={`fas ${isGoogleSignedIn ? 'fa-sign-out-alt' : 'fa-sign-in-alt'}`}></i>
              <span className="btn-text">
                {googleLoading 
                  ? (isGoogleSignedIn ? 'Çıkış yapılıyor...' : 'Bağlanıyor...')
                  : (isGoogleSignedIn ? 'Google Çıkış' : 'Google Giriş')
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Takvim İçeriği */}
      {renderCalendarContent()}

      {/* Randevu Ekleme Modalı */}
      <AddAppointmentModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAppointment}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
      />

      {/* Randevu Silme Modalı */}
      <DeleteAppointmentModal 
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteAppointment}
        appointmentData={selectedAppointment}
      />

      {/* Randevu Görüntüleme Modalı */}
      <ViewAppointmentModal 
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        onEdit={handleEditAppointment}
        appointmentData={selectedAppointment}
      />

      {/* Randevu Düzenleme Modalı */}
      <EditAppointmentModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateAppointment}
        appointmentData={selectedAppointment}
      />
    </div>
  );
};

export default WeeklyCalendar;