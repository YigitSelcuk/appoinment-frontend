import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { tr } from 'date-fns/locale';
import AddAppointmentModal from '../AddAppointmentModal/AddAppointmentModal';
import DeleteAppointmentModal from '../DeleteAppointmentModal/DeleteAppointmentModal';
import ViewAppointmentModal from '../ViewAppointmentModal/ViewAppointmentModal';
import EditAppointmentModal from '../EditAppointmentModal/EditAppointmentModal';
import { getAppointments, getAppointmentsByDateRange, createAppointment, updateAppointment, deleteAppointment } from '../../services/appointmentsService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import googleCalendarService from '../../services/googleCalendarService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './WeeklyCalendar.css';

// React Big Calendar localizer'ı
const locales = {
  'tr': tr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Pazartesi'yi hafta başlangıcı yap
  getDay,
  locales,
});

const WeeklyCalendar = ({ 
  selectedDate: externalSelectedDate,
  onDateChange 
}) => {
  // Toast hook'u
  const { showError } = useSimpleToast();
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
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Pazartesi başlangıçlı hafta
  });

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

  // Randevuları React Big Calendar formatına dönüştür
  const convertAppointmentsToEvents = useCallback((appointments) => {
    return appointments.map(appointment => {
      // Tarih ve saat bilgilerini birleştir
      const appointmentDate = new Date(appointment.date || appointment.appointment_date);
      const [startHour, startMinute] = (appointment.time || appointment.start_time || '09:00').split(':');
      const [endHour, endMinute] = (appointment.endTime || appointment.end_time || '10:00').split(':');
      
      const start = new Date(appointmentDate);
      start.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const end = new Date(appointmentDate);
      end.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      
      const dayOfWeek = appointmentDate.getDay();
      
      // Pazar günü randevularını debug et
      if (dayOfWeek === 0) {
        console.log('🔴 PAZAR GÜNÜ EVENT OLUŞTURMA:', {
          appointmentId: appointment.id,
          title: appointment.title,
          originalDate: appointment.date,
          appointmentDate: appointmentDate,
          dayOfWeek: dayOfWeek,
          start: start,
          end: end
        });
      }
      
      return {
        id: appointment.id,
        title: appointment.title || appointment.description,
        start: start,
        end: end,
        resource: {
          ...appointment,
          color: appointment.color || '#3174ad',
          attendee: appointment.attendee || appointment.client_name || appointment.user_name
        }
      };
    });
  }, []);

  // React Big Calendar için event'leri hazırla
  const events = useMemo(() => {
    const allAppointments = [...appointments, ...googleEvents];
    const convertedEvents = convertAppointmentsToEvents(allAppointments);
    
    // Pazar günü event'lerini debug et
    const sundayEvents = convertedEvents.filter(event => event.start.getDay() === 0);
    if (sundayEvents.length > 0) {
      console.log('🔴 PAZAR GÜNÜ EVENTS TOPLAM:', sundayEvents.length, sundayEvents);
    }
    
    return convertedEvents;
  }, [appointments, googleEvents, convertAppointmentsToEvents]);

  // Tarihten gün indexini hesapla (0-6 arası) - Pazartesi=0, Pazar=6
  // TEMİZ VE BASİT MANTIK - Pazar günü kartlarının kaybolma sorunu çözüldü
  const calculateDayIndex = useCallback((dateString) => {
    try {
      if (!dateString) return -1;
      
      console.log('🔍 calculateDayIndex DEBUG:');
      console.log('- dateString:', dateString);
      console.log('- selectedWeekStart:', selectedWeekStart);
      
      // UTC tarihini yerel tarihe dönüştür
      const utcDate = new Date(dateString);
      console.log('- utcDate:', utcDate);
      
      // Yerel saat diliminde tarihi al (sadece tarih kısmı)
      const localYear = utcDate.getFullYear();
      const localMonth = utcDate.getMonth();
      const localDay = utcDate.getDate();
      const appointmentDate = new Date(localYear, localMonth, localDay);
      console.log('- appointmentDate (yerel):', appointmentDate);
      
      // Hafta başlangıcını hesapla (Pazartesi) - date-fns ile tutarlılık için
      const weekStartLocal = startOfWeek(selectedWeekStart, { weekStartsOn: 1 });
      console.log('- weekStartLocal:', weekStartLocal);
      
      // Hafta sonunu hesapla (Pazar)
      const weekEndLocal = new Date(weekStartLocal);
      weekEndLocal.setDate(weekEndLocal.getDate() + 6);
      console.log('- weekEndLocal:', weekEndLocal);
      
      // Randevunun bu haftaya ait olup olmadığını kontrol et
      console.log('- appointmentDate < weekStartLocal:', appointmentDate < weekStartLocal);
      console.log('- appointmentDate > weekEndLocal:', appointmentDate > weekEndLocal);
      
      if (appointmentDate < weekStartLocal || appointmentDate > weekEndLocal) {
        console.log('❌ Randevu bu haftaya ait değil');
        return -1; // Bu haftaya ait değil
      }
      
      // JavaScript'te getDay(): 0=Pazar, 1=Pazartesi, 2=Salı, ..., 6=Cumartesi
      // Bizim sistem: 0=Pazartesi, 1=Salı, 2=Çarşamba, 3=Perşembe, 4=Cuma, 5=Cumartesi, 6=Pazar
      const jsDay = appointmentDate.getDay();
      
      // JavaScript gün numarasını bizim sisteme çevir
      let dayIndex;
      if (jsDay === 0) {
        // Pazar günü = 6 (hafta sonu)
        dayIndex = 6;
      } else {
        // Pazartesi(1) = 0, Salı(2) = 1, ..., Cumartesi(6) = 5
        dayIndex = jsDay - 1;
      }
      
      // Güvenlik kontrolü
      if (dayIndex >= 0 && dayIndex <= 6) {
        return dayIndex;
      }
      
      return -1;
    } catch (error) {
      console.error('calculateDayIndex hatası:', error, 'dateString:', dateString);
      return -1;
    }
  }, [selectedWeekStart]);

  // Randevu filtreleme mantığı - ayrı fonksiyon
  const filterAppointments = useCallback((appointments, user) => {
    return appointments.filter(appointment => {
      // İptal edilen ve tamamlanan randevuları filtrele
      if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
        return false;
      }
      
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
              visibleUser.id === user?.id || 
              visibleUser.email === user?.email ||
              visibleUser === user?.id.toString()
            );
          }
        } catch (parseError) {
          console.error('visible_to_users parse hatası:', parseError);
        }
      }
      
      return false;
    });
  }, []);

  // Randevu formatlama mantığı - basitleştirilmiş
  const formatAppointments = useCallback((appointments) => {
    return appointments.map(appointment => {
      const dayIndex = calculateDayIndex(appointment.date);
      
      return {
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
        day: dayIndex,
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
      };
    });
  }, [calculateDayIndex]);

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

  // External selected date değiştiğinde hafta görünümünü güncelle
  useEffect(() => {
    if (externalSelectedDate) {
      const selectedDateObj = new Date(externalSelectedDate);
      const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
      
      // Sadece gerçekten değişmişse güncelle
      if (weekStart.getTime() !== selectedWeekStart.getTime()) {
        setSelectedWeekStart(weekStart);
      }
    }
  }, [externalSelectedDate, selectedWeekStart]);

  // Anlık saat çizgisi useEffect'i kaldırıldı - pozisyonlama sistemi sıfırdan yazılacak

  // Haftanın başlangıcını hesapla (Pazartesi) - date-fns ile tutarlılık için
  const getStartOfWeek = (date) => {
    return startOfWeek(date, { weekStartsOn: 1 }); // Pazartesi başlangıçlı hafta
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

  // Temizlenmiş loadAppointments fonksiyonu
  const loadAppointments = useCallback(async () => {
    if (!accessToken || !user) {
      console.log('⚠️ loadAppointments: accessToken veya user eksik');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📅 Randevular yükleniyor...', { 
        selectedWeekStart: selectedWeekStart.toISOString(),
        userId: user.id 
      });
      
      // Hafta tarih aralığını hesapla (Pazartesi-Pazar = 7 gün)
      // date-fns ile tutarlılık için startOfWeek kullan
      const startOfWeekLocal = startOfWeek(selectedWeekStart, { weekStartsOn: 1 });
      const endOfWeekLocal = new Date(startOfWeekLocal);
      endOfWeekLocal.setDate(endOfWeekLocal.getDate() + 6); // +6 gün = 7 günlük hafta (Pazartesi-Pazar)
      
      // Tarih formatını hazırla (saat dilimi olmadan)
      const startDateStr = `${startOfWeekLocal.getFullYear()}-${String(startOfWeekLocal.getMonth() + 1).padStart(2, '0')}-${String(startOfWeekLocal.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endOfWeekLocal.getFullYear()}-${String(endOfWeekLocal.getMonth() + 1).padStart(2, '0')}-${String(endOfWeekLocal.getDate()).padStart(2, '0')}`;
      
      // Randevuları getir
      const response = await getAppointmentsByDateRange(accessToken, startDateStr, endDateStr);
      
      if (response.success && Array.isArray(response.data)) {
        // Filtreleme ve formatlama işlemlerini ayrı fonksiyonlarla yap
        const filteredAppointments = filterAppointments(response.data, user);
        const formattedAppointments = formatAppointments(filteredAppointments);
        
        setAppointments(formattedAppointments);
      } else {
        setAppointments([]);
      }
      
    } catch (error) {
      console.error('❌ Randevular yüklenirken hata:', error);
      setAppointments([]);
      // Toast kaldırıldı - console log yeterli
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedWeekStart, user, filterAppointments, formatAppointments]);

  // Google Calendar etkinliklerini yükle - DEVRE DIŞI
  // Sadece WeeklyCalendar'dan eklenen randevular Google Calendar'a senkronize olacak
  // Google Calendar'dan direkt eklenen etkinlikler WeeklyCalendar'da görünmeyecek
  const loadGoogleEvents = useCallback(async () => {
    // Google Calendar etkinliklerini çekme işlemi devre dışı bırakıldı
    setGoogleEvents([]);
  }, []);

  // Randevuları yükle - sadece gerekli bağımlılıklar
  useEffect(() => {
    if (accessToken && user) {
      loadAppointments();
    }
  }, [selectedWeekStart, accessToken, user?.id, loadAppointments]);

  // Google Calendar durumu değiştiğinde etkinlik yükleme - DEVRE DIŞI
  // Google Calendar etkinlikleri artık çekilmiyor, sadece senkronizasyon aktif
  useEffect(() => {
    // Google Calendar etkinliklerini yükleme işlemi devre dışı
  }, [googleCalendarEnabled, isGoogleSignedIn]);

  // Socket event handler'ları - useCallback ile optimize edildi
  const handleAppointmentCreated = useCallback((data) => {
    console.log('🔥 handleAppointmentCreated çağrıldı:', data);
    
    if (data && data.appointment) {
      const newAppointment = data.appointment;
      console.log('📅 Yeni randevu verisi:', newAppointment);
      
      // Randevunun mevcut haftaya ait olup olmadığını kontrol et
      const dayIndex = calculateDayIndex(newAppointment.date);
      console.log('📊 calculateDayIndex sonucu:', dayIndex, 'randevu tarihi:', newAppointment.date);
      
      if (dayIndex >= 0) {
        console.log('✅ Randevu mevcut haftaya ait, işleniyor...');
        
        // Filtreleme ve formatlama işlemlerini yap
        const filteredAppointments = filterAppointments([newAppointment], user);
        console.log('🔍 Filtreleme sonucu:', filteredAppointments.length, 'randevu');
        
        if (filteredAppointments.length > 0) {
          const formattedAppointments = formatAppointments(filteredAppointments);
          console.log('🎨 Formatlanmış randevular:', formattedAppointments);
          
          // Mevcut haftaya ait - state'e ekle
          setAppointments(prevAppointments => {
            // Aynı ID'li randevu zaten var mı kontrol et (çift eklemeyi önle)
            const exists = prevAppointments.some(apt => apt.id === newAppointment.id);
            if (exists) {
              console.log('⚠️ Randevu zaten mevcut, eklenmedi');
              return prevAppointments;
            }
            
            console.log('🚀 Randevu state\'e ekleniyor...');
            return [...prevAppointments, ...formattedAppointments];
          });
        } else {
          console.log('❌ Filtreleme sonucu randevu görünür değil');
        }
      } else {
        console.log('❌ Randevu mevcut haftaya ait değil');
      }
    } else {
      console.log('❌ Geçersiz veri formatı:', data);
    }
  }, [calculateDayIndex, filterAppointments, formatAppointments, user]);

  const handleAppointmentUpdated = useCallback((data) => {
    if (data && data.appointment) {
      const updatedAppointment = data.appointment;
      
      // Filtreleme ve formatlama işlemlerini yap
      const filteredAppointments = filterAppointments([updatedAppointment], user);
      
      setAppointments(prevAppointments => {
        // Eğer filtreleme sonucu randevu görünür değilse, mevcut listeden kaldır
        if (filteredAppointments.length === 0) {
          return prevAppointments.filter(apt => apt.id !== updatedAppointment.id);
        }
        
        const formattedAppointments = formatAppointments(filteredAppointments);
        const formattedAppointment = formattedAppointments[0];
        
        // Mevcut randevuyu bul ve güncelle
        const found = prevAppointments.some(apt => apt.id === updatedAppointment.id);
        
        if (found) {
          // Randevu mevcut listede var - güncelle
          const dayIndex = calculateDayIndex(updatedAppointment.date);
          if (dayIndex >= 0) {
            // Hala mevcut haftaya ait - güncelle
            return prevAppointments.map(apt => 
              apt.id === updatedAppointment.id ? formattedAppointment : apt
            );
          } else {
            // Artık mevcut haftaya ait değil - kaldır
            return prevAppointments.filter(apt => apt.id !== updatedAppointment.id);
          }
        } else {
          // Randevu mevcut listede yok - mevcut haftaya aitse ekle
          const dayIndex = calculateDayIndex(updatedAppointment.date);
          if (dayIndex >= 0) {
            return [...prevAppointments, formattedAppointment];
          }
        }
        
        return prevAppointments;
      });
    }
  }, [calculateDayIndex, filterAppointments, formatAppointments, user]);

  const handleAppointmentDeleted = useCallback((data) => {
    if (data && (data.appointmentId || data.appointment?.id)) {
      const deletedId = data.appointmentId || data.appointment?.id;
      
      setAppointments(prevAppointments => {
        const filtered = prevAppointments.filter(apt => apt.id != deletedId); // != ile type conversion
        return filtered;
      });
    }
  }, []);

  // Socket.IO real-time güncellemeler
  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket mevcut değil');
      return;
    }

    console.log('🔌 Socket event listener\'ları ekleniyor...');
    
    // Event listener'ları ekle
    socket.on('appointment-created', handleAppointmentCreated);
    socket.on('appointment-updated', handleAppointmentUpdated);
    socket.on('appointment-deleted', handleAppointmentDeleted);

    console.log('✅ Socket event listener\'ları eklendi');

    // Cleanup function
    return () => {
      console.log('🧹 Socket event listener\'ları temizleniyor...');
      socket.off('appointment-created', handleAppointmentCreated);
      socket.off('appointment-updated', handleAppointmentUpdated);
      socket.off('appointment-deleted', handleAppointmentDeleted);
    };
  }, [socket, handleAppointmentCreated, handleAppointmentUpdated, handleAppointmentDeleted]);

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

  // Haftalık görünüm için günleri hesapla - Timezone sorunları düzeltildi ve optimize edildi
  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Hafta başlangıcını local timezone'da hesapla
    const weekStart = new Date(selectedWeekStart);
    const weekStartLocal = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    
    for (let i = 0; i < 7; i++) {
      // Local timezone'da tarih hesapla
      const date = new Date(weekStartLocal);
      date.setDate(date.getDate() + i);
      
      let dayName;
      // Bugün kontrolü local tarihler ile
      if (date.getTime() === todayLocal.getTime()) {
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
  }, [selectedWeekStart]);

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
    const hourHeight = 50;
    
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
      console.error('Erişim token\'ı bulunamadı!');
      return;
    }
    
    try {
      const response = await createAppointment(accessToken, appointmentData);
      if (response.success) {
        // Başarılı kayıt sonrası randevuları hemen yeniden yükle
        await loadAppointments();
        
        // Modal'ı kapat
        setIsModalOpen(false);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedDay(null);
        
        console.log('✅ Randevu başarıyla kaydedildi ve takvim güncellendi');
      }
    } catch (error) {
      console.error('Randevu kaydetme hatası:', error);
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

  const handleUpdateAppointment = async (appointmentData) => {
    if (!accessToken) {
      console.error('Erişim token\'ı bulunamadı!');
      return;
    }

    try {
      console.log('🔄 Randevu güncelleniyor...', appointmentData);
      console.log('🔄 selectedAppointment.id:', selectedAppointment?.id);
      
      // Backend'e güncelleme isteği gönder
      const response = await updateAppointment(accessToken, selectedAppointment.id, appointmentData);
      console.log('✅ Randevu güncelleme response:', response);
      
      // Randevu güncellendikten sonra listeyi yenile
      await loadAppointments();
      setIsEditModalOpen(false);
      setSelectedAppointment(null);
      
      return response;
    } catch (error) {
      console.error('❌ Randevu güncelleme hatası:', error);
      showError('Randevu güncellenemedi: ' + error.message);
      throw error;
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!accessToken) {
      console.error('Erişim token\'ı bulunamadı!');
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
      
      // Toast kaldırıldı - gereksiz bildirim
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
        // Toast kaldırıldı - gereksiz bildirim
        await loadAppointments(); // Etkinlikleri yükle
      } else {
        console.error('Google Calendar girişi tamamlanamadı!');
      }
    } catch (error) {
      console.error('❌ WeeklyCalendar: Google Calendar giriş hatası:', error);
      // Toast kaldırıldı - console log yeterli
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
      
      // Toast kaldırıldı - gereksiz bildirim
      await loadAppointments(); // Sadece yerel randevuları göster
    } catch (error) {
      console.error('❌ WeeklyCalendar: Google Calendar çıkış hatası:', error);
      // Toast kaldırıldı - console log yeterli
    } finally {
      setGoogleLoading(false);
    }
  };



  const handleOpenDeleteModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  // Custom Event Component - Sağ tık ile düzenleme
  const CustomEvent = ({ event }) => {
    const handleContextMenu = (e) => {
      e.preventDefault(); // Varsayılan sağ tık menüsünü engelle
      handleEditAppointment(event.resource);
    };

    return (
      <div 
        onContextMenu={handleContextMenu}
        style={{ 
          height: '100%', 
          width: '100%',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '12px',
          overflow: 'hidden'
        }}
        title={`Sol tık: Görüntüle | Sağ tık: Düzenle\n${event.title}`}
      >
        {event.title}
      </div>
    );
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
    } else if (viewMode === 'GÜN') {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
      if (onDateChange) {
        onDateChange(prevDay);
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
    } else if (viewMode === 'GÜN') {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
      if (onDateChange) {
        onDateChange(nextDay);
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
    
    if (viewMode === 'HAFTA') {
      const startOfWeek = getStartOfWeek(today);
      setSelectedWeekStart(startOfWeek);
    } else {
      setCurrentDate(today);
    }
    
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
    return (
      <div style={{ height: '725px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view="week"
          views={['week']}
          culture="tr"
          date={selectedWeekStart}
          onNavigate={(date) => {
            setSelectedWeekStart(date);
            setCurrentDate(date);
            if (onDateChange) {
              onDateChange(date);
            }
          }}
          toolbar={false}
          onSelectEvent={(event) => {
            setSelectedAppointment(event.resource);
            setIsViewModalOpen(true);
          }}
          onSelectSlot={(slotInfo) => {
            const selectedDate = format(slotInfo.start, 'yyyy-MM-dd');
            const selectedTime = format(slotInfo.start, 'HH:mm');
            setSelectedDate(selectedDate);
            setSelectedTime(selectedTime);
            setIsModalOpen(true);
          }}
          selectable
          popup
          components={{
            event: CustomEvent
          }}
          eventPropGetter={(event) => {
            const color = event.resource.color || '#3174ad';
            const hexToRgb = (hex) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            const rgb = hexToRgb(color);
            const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '49, 116, 173';
            
            return {
              style: {
                backgroundColor: `rgba(${rgbString}, 0.15)`,
                borderColor: color,
                color: '#1F2937'
              }
            };
          }}
          messages={{
            week: 'Hafta',
            today: 'Bugün',
            previous: 'Önceki',
            next: 'Sonraki',
            showMore: (total) => `+${total} daha`,
            time: 'Saat',
            event: 'Etkinlik',
            allDay: 'Tüm Gün',
            date: 'Tarih',
            noEventsInRange: 'Bu tarih aralığında etkinlik yok'
          }}
          formats={{
            dayHeaderFormat: (date, culture, localizer) =>
              localizer.format(date, 'dddd, dd MMMM', culture),
            timeGutterFormat: (date, culture, localizer) =>
              localizer.format(date, 'HH:mm', culture),
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
            selectRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`
          }}
          min={new Date(2024, 0, 1, 0, 0)} // 00:00
          max={new Date(2024, 0, 1, 23, 59)} // 23:59
          step={30}
          timeslots={2}
        />
      </div>
    );
  };

  // Günlük görünüm
  const renderDayView = () => (
    <div style={{ height: '750px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view="day"
        views={['day']}
        culture="tr"
        date={currentDate}
        onNavigate={(date) => {
          setCurrentDate(date);
          if (onDateChange) {
            onDateChange(date);
          }
        }}
        toolbar={false}
        onSelectEvent={(event) => {
          setSelectedAppointment(event.resource);
          setIsViewModalOpen(true);
        }}
        onSelectSlot={(slotInfo) => {
          const selectedDate = format(slotInfo.start, 'yyyy-MM-dd');
          const selectedTime = format(slotInfo.start, 'HH:mm');
          setSelectedDate(selectedDate);
          setSelectedTime(selectedTime);
          setIsModalOpen(true);
        }}
        selectable
        components={{
          event: CustomEvent
        }}
        eventPropGetter={(event) => {
          const color = event.resource.color || '#3174ad';
          const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
          };
          const rgb = hexToRgb(color);
          const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '49, 116, 173';
          
          return {
            style: {
              backgroundColor: `rgba(${rgbString}, 0.15)`,
              borderColor: color,
              color: '#1F2937'
            }
          };
        }}
        messages={{
          day: 'Gün',
          today: 'Bugün',
          previous: 'Önceki',
          next: 'Sonraki',
          allDay: 'Tüm Gün',
          time: 'Saat',
          event: 'Etkinlik',
          date: 'Tarih',
          noEventsInRange: 'Bu tarihte etkinlik yok'
        }}
        formats={{
          dayHeaderFormat: (date, culture, localizer) =>
            localizer.format(date, 'dd MMMM yyyy, dddd', culture),
          timeGutterFormat: (date, culture, localizer) =>
            localizer.format(date, 'HH:mm', culture),
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
          selectRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`
        }}
        min={new Date(2024, 0, 1, 0, 0)} // 00:00
        max={new Date(2024, 0, 1, 23, 59)} // 23:59
        step={30}
        timeslots={2}
      />
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
    return (
      <div style={{ height: '800px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view="month"
          views={['month']}
          culture="tr"
          date={currentDate}
          onNavigate={(date) => {
            setCurrentDate(date);
            if (onDateChange) {
              onDateChange(date);
            }
          }}
          toolbar={false}
          onSelectEvent={(event) => {
            setSelectedAppointment(event.resource);
            setIsViewModalOpen(true);
          }}
          onSelectSlot={(slotInfo) => {
            const selectedDate = format(slotInfo.start, 'yyyy-MM-dd');
            setSelectedDate(selectedDate);
            setSelectedTime('09:00');
            setIsModalOpen(true);
          }}
          selectable
          popup
          components={{
            event: CustomEvent
          }}
          eventPropGetter={(event) => {
            const color = event.resource.color || '#3174ad';
            const hexToRgb = (hex) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            const rgb = hexToRgb(color);
            const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '49, 116, 173';
            
            return {
              style: {
                backgroundColor: `rgba(${rgbString}, 0.15)`,
                borderColor: color,
                color: '#1F2937'
              }
            };
          }}
          messages={{
            month: 'Ay',
            today: 'Bugün',
            previous: 'Önceki',
            next: 'Sonraki',
            showMore: (total) => `+${total} daha`,
            time: 'Saat',
            event: 'Etkinlik',
            allDay: 'Tüm Gün',
            date: 'Tarih',
            noEventsInRange: 'Bu ayda etkinlik yok'
          }}
          formats={{
            monthHeaderFormat: (date, culture, localizer) =>
              localizer.format(date, 'MMMM yyyy', culture),
            dayHeaderFormat: (date, culture, localizer) =>
              localizer.format(date, 'dddd', culture),
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
            dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
              `${localizer.format(start, 'dd MMMM', culture)} - ${localizer.format(end, 'dd MMMM yyyy', culture)}`
          }}
        />
      </div>
    );
  };

  // Yıllık görünüm
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      months.push(monthDate);
    }
    
    return (
      <div className="year-view">
        <div className="year-header">
          <h3>Yıllık Görünüm - {year}</h3>
        </div>
        <div className="year-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          padding: '20px'
        }}>
          {months.map((monthDate, index) => (
            <div key={index} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
            onClick={() => {
              setCurrentDate(monthDate);
              setViewMode('AY');
            }}>
              <div style={{ height: '200px' }}>
                <Calendar
                  localizer={localizer}
                  events={events.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.getFullYear() === year && 
                           eventDate.getMonth() === monthDate.getMonth();
                  })}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  view="month"
                  views={['month']}
                  date={monthDate}
                  toolbar={false}
                  eventPropGetter={(event) => {
                    const color = event.resource.color || '#3174ad';
                    const hexToRgb = (hex) => {
                      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                      return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                      } : null;
                    };
                    const rgb = hexToRgb(color);
                    const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '49, 116, 173';
                    
                    return {
                      style: {
                        backgroundColor: `rgba(${rgbString}, 0.15)`,
                        borderColor: color,
                        color: '#1F2937',
                        fontSize: '10px'
                      }
                    };
                  }}
                  formats={{
                    dayHeaderFormat: (date, culture, localizer) =>
                      localizer.format(date, 'dd', culture)
                  }}
                />
              </div>
              <div style={{
                textAlign: 'center',
                marginTop: '10px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {format(monthDate, 'MMMM', { locale: tr })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
        onDelete={handleOpenDeleteModal}
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