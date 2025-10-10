import React, { useState, useEffect } from 'react';
import { updateAppointment, checkAppointmentConflict, getInviteePreviousAppointments, resendReminder, updateReminderTime, getAppointmentById } from '../../services/appointmentsService';
import { contactsService } from '../../services/contactsService';
import { getUsers, getCurrentUser } from '../../services/usersService';
import { sendNotificationCombo } from '../../services/emailService';
import { sendSMS } from '../../services/smsService';
import AddContactModal from '../AddContactModal/AddContactModal';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import googleCalendarService from '../../services/googleCalendarService';
import './EditAppointmentModal.css';

const EditAppointmentModal = ({ isOpen, onClose, onSave, appointmentData }) => {
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  const { accessToken, user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    color: '#3C02AA',
    location: '',
    status: 'scheduled',
    isAllDay: false,
    repeat: 'TEKRARLANMAZ',
    assignedTo: 'YAKIP',
    startOffice: '',
    notification: false,
    reminderBefore: false,
    reminderDateTime: '',
    notificationSMS: false,
    notificationEmail: false,
    visibleToUsers: [],
    visibleToAll: false
  });

  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kişiler ve kullanıcılar için state'ler
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  // Kullanıcılar için state'ler
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Önceki randevular için state'ler
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [showPreviousAppointments, setShowPreviousAppointments] = useState(false);
  const [loadingPreviousAppointments, setLoadingPreviousAppointments] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Toolbar state'leri
  const [activeToolbarButtons, setActiveToolbarButtons] = useState([]);

  // Hatırlatma kontrolleri
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showReminderControls, setShowReminderControls] = useState(false);
  const [resendingReminder, setResendingReminder] = useState(false);
  const [showManualTime, setShowManualTime] = useState(false);
  const [manualReminderDateTime, setManualReminderDateTime] = useState('');
  const [showReminderEdit, setShowReminderEdit] = useState(false);
  const [newReminderValue, setNewReminderValue] = useState('');
  const [newReminderUnit, setNewReminderUnit] = useState('MINUTES');
  const [updatingReminder, setUpdatingReminder] = useState(false);

  // Modal açıldığında form verilerini doldur
  useEffect(() => {
    if (isOpen && appointmentData) {
      // Yetki kontrolü kaldırıldı - herkes düzenleyebilir
      
      // JSON parsing için yardımcı fonksiyon
      const safeJsonParse = (input, defaultValue = []) => {
        if (input === null || input === undefined || input === '') {
          return defaultValue;
        }
        if (Array.isArray(input)) {
          return input;
        }
        if (typeof input === 'string') {
          try {
            return JSON.parse(input);
          } catch {
            return defaultValue;
          }
        }
        // Nesne gelirse olduğu gibi döndür (beklenen yapıdaysa)
        if (typeof input === 'object') {
          return input;
        }
        return defaultValue;
      };

      // Tarihi local timezone'a çevir
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Local timezone'da tarihi al
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFormData({
        title: appointmentData.title || '',
        date: formatDateForInput(appointmentData.date),
        startTime: appointmentData.start_time ? appointmentData.start_time.substring(0, 5) : '',
        endTime: appointmentData.end_time ? appointmentData.end_time.substring(0, 5) : '',
        description: appointmentData.description || '',
        color: appointmentData.color || '#3C02AA',
        location: appointmentData.location || '',
        status: appointmentData.status || 'scheduled',
        isAllDay: appointmentData.is_all_day || false,
        repeat: appointmentData.repeat_type || 'TEKRARLANMAZ',
        reminderBefore: appointmentData.reminder_enabled || false,
        reminderDateTime: '',
        notificationSMS: appointmentData.notification_sms || false,
        notificationEmail: appointmentData.notification_email || false,
        // DÜZELTME: doğru alan adı ve esnek parse
        visibleToUsers: safeJsonParse(appointmentData.visible_to_users),
        visibleToAll: appointmentData.visible_to_all || false
      });

      // Davetlileri ve katılımcıları set et
      const invitees = safeJsonParse(appointmentData.invitees);
      const attendees = safeJsonParse(appointmentData.attendees);
      const allInvited = [...invitees, ...attendees];
      setSelectedContacts(allInvited);

      setErrors({});
      setConflicts([]);
    }
  }, [isOpen, appointmentData]);

  // Kişileri yükle
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await contactsService.getContacts({ limit: 1000 });
        
        if (response.success && response.data) {
          const formattedContacts = response.data.map(contact => ({
            id: contact.id,
            name: `${contact.name || ''} ${contact.surname || ''}`.trim(),
            email: contact.email || '',
            phone1: contact.phone1 || '',
            phone2: contact.phone2 || '',
            phone: contact.phone1 || contact.phone2 || 'Telefon yok'
          }));
          setContacts(formattedContacts);
          setFilteredContacts(formattedContacts);
        } else {
          setContacts([]);
          setFilteredContacts([]);
        }
      } catch (error) {
        setContacts([]);
        setFilteredContacts([]);
        console.error('Kişiler yüklenirken hata:', error);
      }
    };

    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Kullanıcıları yükle
  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!accessToken) {
          console.warn('Access token bulunamadı, kullanıcılar yüklenemedi');
          return;
        }
        setLoadingUsers(true);
        const response = await getUsers(accessToken);
        const usersData = response.data || [];
        // Kullanıcıları alfabetik olarak sırala
        const sortedUsers = usersData.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
        setUsers(sortedUsers);
        setFilteredUsers(sortedUsers);
      } catch (error) {
        console.error('Kullanıcıları yüklerken hata:', error);
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isOpen && accessToken) {
      loadUsers();
    }
  }, [isOpen, accessToken]);

  // Hatırlatma detaylarını yükle
  useEffect(() => {
    const loadAppointmentDetails = async () => {
      if (isOpen && appointmentData?.id) {
        try {
          setLoadingDetails(true);
          if (!accessToken) {
            console.error('Access token bulunamadı');
            return;
          }
          const response = await getAppointmentById(accessToken, appointmentData.id);
          if (response.success) {
            setAppointmentDetails(response.data);
          }
        } catch (error) {
          console.error('Randevu detayları yüklenirken hata:', error);
        } finally {
          setLoadingDetails(false);
        }
      }
    };

    loadAppointmentDetails();
  }, [isOpen, appointmentData?.id]);

  const colorOptions = [
    '#3C02AA', '#29CC39', '#FF6633', '#FFCB33', 
    '#33BFFF', '#FF8C33', '#E62E7B', '#2EE6CA'
  ];



  const statusOptions = [
    { value: 'scheduled', label: 'Planlandı' },
    { value: 'confirmed', label: 'Onaylandı' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'cancelled', label: 'İptal Edildi' },
    { value: 'postponed', label: 'Ertelendi' }
  ];

  // Çakışma kontrolü
  const checkForConflicts = async (date, startTime, endTime) => {
    if (!date || !startTime || !endTime) {
      setConflicts([]);
      return;
    }

    try {
      setIsCheckingConflict(true);
      if (!accessToken) {
        showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const response = await checkAppointmentConflict(accessToken, {
        date,
        startTime,
        endTime,
        excludeId: appointmentData?.id // Mevcut randevuyu hariç tut
      });

      if (response.success) {
        const conflicts = response.conflicts || [];
        setConflicts(conflicts);
        if (conflicts.length > 0) {
          showWarning(`${conflicts.length} randevu çakışması tespit edildi!`);
        }
      }
    } catch (error) {
      console.error('Çakışma kontrolü hatası:', error);
      setConflicts([]);
    } finally {
      setIsCheckingConflict(false);
    }
  };

  // Kişi arama ve seçim fonksiyonları
  const handleContactSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Seçilmiş davetlilerin ID'lerini al
    const selectedContactIds = selectedContacts.map(c => c.id);
    
    if (term.trim() === '') {
      // Seçilmiş davetlileri en üste koy, seçilmemişleri alt kısma
      const selectedContactsFromAll = contacts.filter(contact => selectedContactIds.includes(contact.id));
      const unselectedContacts = contacts.filter(contact => !selectedContactIds.includes(contact.id));
      
      // Her iki grubu da alfabetik sırala
      const sortedSelected = selectedContactsFromAll.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      const sortedUnselected = unselectedContacts.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      
      setFilteredContacts([...sortedSelected, ...sortedUnselected]);
      setShowContactDropdown(true); // Boş durumda da dropdown'ı açık tut
    } else {
      const filtered = contacts.filter(contact => {
        const name = contact.name || '';
        const email = contact.email || '';
        const phone = contact.phone || '';
        
        return name.toLowerCase().includes(term.toLowerCase()) ||
               email.toLowerCase().includes(term.toLowerCase()) ||
               phone.includes(term);
      });
      
      // Arama sonuçlarında da seçilmiş davetlileri üste koy
      const selectedFiltered = filtered.filter(contact => selectedContactIds.includes(contact.id));
      const unselectedFiltered = filtered.filter(contact => !selectedContactIds.includes(contact.id));
      
      const sortedSelectedFiltered = selectedFiltered.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      const sortedUnselectedFiltered = unselectedFiltered.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      
      setFilteredContacts([...sortedSelectedFiltered, ...sortedUnselectedFiltered]);
      setShowContactDropdown(true);
    }
  };

  const handleContactSelect = (contact) => {
    if (!selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts(prev => [...prev, contact]);
      showSuccess(`${contact.name} davetli listesine eklendi`);
    } else {
      showWarning(`${contact.name} zaten davetli listesinde`);
    }
    setSearchTerm('');
    setShowContactDropdown(false);
  };

  const handleContactRemove = (contactId) => {
    const removedContact = selectedContacts.find(c => c.id === contactId);
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
    if (removedContact) {
      showInfo(`${removedContact.name} davetli listesinden çıkarıldı`);
    }
  };

  // Kullanıcı arama ve seçim fonksiyonları
  const handleUserSearch = (e) => {
    const searchTerm = e.target.value;
    setUserSearchTerm(searchTerm);
    
    // Seçilmiş kullanıcıları al
    const selectedUserIds = formData.visibleToUsers ? formData.visibleToUsers.map(u => u.id) : [];
    
    if (searchTerm.trim() === '') {
      // Seçilmiş kullanıcıları en üste koy, seçilmemişleri alt kısma
      const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
      const unselectedUsers = users.filter(user => !selectedUserIds.includes(user.id));
      
      // Her iki grubu da alfabetik sırala
      const sortedSelected = selectedUsers.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      const sortedUnselected = unselectedUsers.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      
      setFilteredUsers([...sortedSelected, ...sortedUnselected]);
      setShowUserDropdown(true); // Boş durumda da dropdown'ı açık tut
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Arama sonuçlarında da seçilmiş kullanıcıları üste koy
      const selectedFiltered = filtered.filter(user => selectedUserIds.includes(user.id));
      const unselectedFiltered = filtered.filter(user => !selectedUserIds.includes(user.id));
      
      const sortedSelectedFiltered = selectedFiltered.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      const sortedUnselectedFiltered = unselectedFiltered.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      
      setFilteredUsers([...sortedSelectedFiltered, ...sortedUnselectedFiltered]);
      setShowUserDropdown(true);
    }
  };

  const handleUserSelect = (user) => {
    if (!formData.visibleToUsers || !formData.visibleToUsers.find(u => u.id === user.id)) {
      // Kullanıcıyı sadece gerekli alanlarla ekle
      const userToAdd = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      
      setFormData(prev => ({
        ...prev,
        visibleToUsers: [...prev.visibleToUsers, userToAdd],
        visibleToAll: false
      }));
      showSuccess(`${user.name} görünürlük listesine eklendi`);
    } else {
      showWarning(`${user.name} zaten görünürlük listesinde`);
    }
    setUserSearchTerm('');
    setShowUserDropdown(false);
  };

  const handleUserRemove = (userId) => {
    const removedUser = formData.visibleToUsers.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      visibleToUsers: prev.visibleToUsers.filter(u => u.id !== userId)
    }));
    if (removedUser) {
      showInfo(`${removedUser.name} görünürlük listesinden çıkarıldı`);
    }
  };

  // Modal yönetimi
  const handleOpenAddContactModal = () => {
    setShowAddContactModal(true);
  };

  const handleCloseAddContactModal = () => {
    setShowAddContactModal(false);
  };

  const handleContactAdded = (newContact) => {
    const formattedContact = {
      id: newContact.id,
      name: `${newContact.name} ${newContact.surname}`,
      email: newContact.email,
      phone1: newContact.phone1 || '',
      phone2: newContact.phone2 || '',
      phone: newContact.phone1 || newContact.phone2 || 'Telefon yok'
    };
    setContacts(prev => [...prev, formattedContact]);
    setFilteredContacts(prev => [...prev, formattedContact]);
    setShowAddContactModal(false);
    showSuccess('Yeni kişi başarıyla eklendi!');
  };

  // Debounce için timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.date && formData.startTime && formData.endTime) {
        checkForConflicts(formData.date, formData.startTime, formData.endTime);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.date, formData.startTime, formData.endTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Geçmiş tarih/saat kontrolü (gerçek zamanlı)
    if (['date', 'startTime'].includes(name)) {
      const currentData = { ...formData, [name]: value };
      
      if (currentData.date && currentData.startTime) {
        const now = new Date();
        const appointmentDateTime = new Date(`${currentData.date}T${currentData.startTime}`);
        
        // Orijinal randevu tarih/saati
        const originalDateTime = appointmentData.date && appointmentData.start_time ? 
          new Date(`${appointmentData.date.split('T')[0]}T${appointmentData.start_time}`) : null;
        
                 // Eğer tarih/saat değiştiriliyorsa ve geçmişe alınıyorsa bilgilendir
         if (appointmentDateTime < now && 
             (!originalDateTime || appointmentDateTime.getTime() !== originalDateTime.getTime())) {
           showInfo('ℹ️ Randevuyu geçmiş tarih ve saate taşıyorsunuz');
         }
      }
    }
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gereklidir';
    }

    if (!formData.date) {
      newErrors.date = 'Tarih gereklidir';
    }



    if (!formData.startTime) {
      newErrors.startTime = 'Başlangıç saati gereklidir';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Bitiş saati gereklidir';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (end <= start) {
        newErrors.endTime = 'Bitiş saati başlangıç saatinden sonra olmalıdır';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Detayları yeniden yükle
  const reloadAppointmentDetails = async () => {
    if (appointmentData?.id) {
      try {
        if (!accessToken) {
          console.error('Access token bulunamadı');
          return;
        }
        const response = await getAppointmentById(accessToken, appointmentData.id);
        if (response.success) {
          setAppointmentDetails(response.data);
        }
      } catch (error) {
        console.error('Randevu detayları yeniden yüklenirken hata:', error);
      }
    }
  };

  // Hatırlatma yeniden gönder (hemen)
  const handleResendReminder = async () => {
    if (!accessToken) {
      showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      return;
    }
    
    try {
      setResendingReminder(true);
      const response = await resendReminder(accessToken, appointmentData.id);
      if (response.success) {
        showSuccess('Hatırlatma başarıyla yeniden gönderildi');
        setShowReminderControls(false);
        await reloadAppointmentDetails();
      }
    } catch (error) {
      showError(error.message || 'Hatırlatma yeniden gönderilemedi');
    } finally {
      setResendingReminder(false);
    }
  };

  // Hatırlatma manuel saat ile gönder
  const handleManualReminder = async () => {
    if (!manualReminderDateTime) {
      showError('Lütfen hatırlatma zamanını seçin');
      return;
    }
    
    if (!accessToken) {
      showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      setResendingReminder(true);
      const response = await resendReminder(accessToken, appointmentData.id, manualReminderDateTime);
      if (response.success) {
        showSuccess('Hatırlatma başarıyla zamanlandı');
        setShowReminderControls(false);
        setShowManualTime(false);
        setManualReminderDateTime('');
        await reloadAppointmentDetails();
      }
    } catch (error) {
      showError(error.message || 'Hatırlatma zamanlanamadı');
    } finally {
      setResendingReminder(false);
    }
  };

  // Hatırlatma zamanını güncelle
  const handleUpdateReminderTime = async () => {
    if (!accessToken) {
      showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      return;
    }
    
    try {
      setUpdatingReminder(true);
      const response = await updateReminderTime(accessToken, appointmentData.id, parseInt(newReminderValue), newReminderUnit);
      if (response.success) {
        showSuccess('Hatırlatma zamanı başarıyla güncellendi');
        setShowReminderEdit(false);
        await reloadAppointmentDetails();
      }
    } catch (error) {
      showError(error.message || 'Hatırlatma zamanı güncellenemedi');
    } finally {
      setUpdatingReminder(false);
    }
  };

  // Hatırlatma düzenleme başlat
  const startReminderEdit = () => {
    setNewReminderValue(appointmentDetails?.reminder_value || appointmentData?.reminder_value || '15');
    setNewReminderUnit(appointmentDetails?.reminder_unit || appointmentData?.reminder_unit || 'MINUTES');
    setShowReminderEdit(true);
  };

  // Hatırlatma düzenleme iptal et
  const cancelReminderEdit = () => {
    setShowReminderEdit(false);
    setNewReminderValue('');
    setNewReminderUnit('MINUTES');
  };

  // Manuel zaman girişini iptal et
  const cancelManualTime = () => {
    setShowManualTime(false);
    setManualReminderDateTime('');
  };

  // Değişiklikleri tespit et
  const detectChanges = () => {
    const changes = {};
    
    // Temel alanları kontrol et
    if (formData.title.trim() !== (appointmentData.title || '')) {
      changes.title = { old: appointmentData.title, new: formData.title.trim() };
    }
    
    if (formData.date !== appointmentData.date?.split('T')[0]) {
      changes.date = { old: appointmentData.date, new: formData.date };
    }
    
    if (formData.startTime !== (appointmentData.start_time?.substring(0, 5) || '')) {
      changes.startTime = { old: appointmentData.start_time, new: formData.startTime };
    }
    
    if (formData.endTime !== (appointmentData.end_time?.substring(0, 5) || '')) {
      changes.endTime = { old: appointmentData.end_time, new: formData.endTime };
    }
    
    if (formData.description.trim() !== (appointmentData.description || '')) {
      changes.description = { old: appointmentData.description, new: formData.description.trim() };
    }
    
    if (formData.location.trim() !== (appointmentData.location || '')) {
      changes.location = { old: appointmentData.location, new: formData.location.trim() };
    }

    // Davetlileri kontrol et
    const currentInvitees = appointmentData.invitees || [];
    const newInvitees = selectedContacts;
    
    const currentInviteeIds = currentInvitees.map(inv => inv.email || inv.name).sort();
    const newInviteeIds = newInvitees.map(inv => inv.email || inv.name).sort();
    
    if (JSON.stringify(currentInviteeIds) !== JSON.stringify(newInviteeIds)) {
      changes.invitees = { old: currentInvitees, new: newInvitees };
    }

    return changes;
  };

  // Bildirim gönder
  const sendUpdateNotifications = async (changes) => {
    try {
      // Değişiklik mesajı oluştur
      const changeMessages = [];
      
      if (changes.title) {
        changeMessages.push(`Başlık: "${changes.title.old}" → "${changes.title.new}"`);
      }
      if (changes.date) {
        changeMessages.push(`Tarih: ${changes.date.old} → ${changes.date.new}`);
      }
      if (changes.startTime || changes.endTime) {
        const oldTime = `${changes.startTime?.old || appointmentData.start_time?.substring(0, 5)} - ${changes.endTime?.old || appointmentData.end_time?.substring(0, 5)}`;
        const newTime = `${changes.startTime?.new || formData.startTime} - ${changes.endTime?.new || formData.endTime}`;
        changeMessages.push(`Saat: ${oldTime} → ${newTime}`);
      }
      if (changes.description) {
        changeMessages.push(`Açıklama güncellendi`);
      }
      if (changes.location) {
        changeMessages.push(`Konum: "${changes.location.old}" → "${changes.location.new}"`);
      }
      if (changes.invitees) {
        changeMessages.push(`Davetliler güncellendi`);
      }

      const changeText = changeMessages.join('\n');
      
      // E-posta bildirimi
      if (formData.notificationEmail) {
        try {
          await sendNotificationCombo({
            appointmentData: {
              title: formData.title,
              date: formData.date,
              startTime: formData.startTime,
              endTime: formData.endTime,
              description: formData.description,
              location: formData.location,
              changes: changeText
            },
            recipients: selectedContacts.filter(contact => contact.email),
            notificationType: 'updated'
          });
          
          console.log('Güncelleme e-posta bildirimi gönderildi');
        } catch (emailError) {
          console.error('E-posta bildirimi gönderme hatası:', emailError);
        }
      }

      // SMS bildirimi
      if (formData.notificationSMS) {
        try {
          const smsMessage = `Randevu Güncellendi: ${formData.title}\nTarih: ${formData.date}\nSaat: ${formData.startTime} - ${formData.endTime}\n\nDeğişiklikler:\n${changeText}`;
          
          for (const contact of selectedContacts) {
            if (contact.phone1 || contact.phone) {
              try {
                await sendSMS(contact.phone1 || contact.phone, smsMessage);
                console.log(`SMS gönderildi: ${contact.phone1 || contact.phone}`);
              } catch (smsError) {
                console.error(`SMS gönderme hatası (${contact.phone1 || contact.phone}):`, smsError);
              }
            }
          }
        } catch (smsError) {
          console.error('SMS bildirimi gönderme hatası:', smsError);
        }
      }

      return true;
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      
      // Değişiklikleri tespit et
      const changes = detectChanges();
      const hasChanges = Object.keys(changes).length > 0;
      
      const appointmentUpdateData = {
        title: formData.title.trim(),
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        description: formData.description.trim(),
        color: formData.color,
        location: formData.location.trim(),
        google_event_id: appointmentData.google_event_id || appointmentData.googleEventId,
        status: formData.status,
        is_all_day: formData.isAllDay,
        repeat_type: formData.repeat,
        notification_email: formData.notificationEmail,
        notification_sms: formData.notificationSMS,
        reminder_enabled: formData.reminderBefore,
        reminder_datetime: formData.reminderDateTime,
        visible_to_all: formData.visibleToAll,
        selectedContacts: selectedContacts,
        visibleToUsers: formData.visibleToUsers
      };

      if (!accessToken) {
        showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const response = await updateAppointment(accessToken, appointmentData.id, appointmentUpdateData);
      
      if (response.success) {
        // Google Calendar'da da güncelle (eğer kullanıcı giriş yapmışsa)
        try {
          if (googleCalendarService.isSignedIn() && appointmentData.googleEventId) {
            console.log('📅 Google Calendar: Randevu güncelleniyor...');
            const googleEventData = {
              title: formData.title,
              description: formData.description || '',
              date: formData.date,
              startTime: formData.startTime,
              endTime: formData.endTime,
              location: formData.location || ''
            };
            
            await googleCalendarService.updateEvent(appointmentData.googleEventId, googleEventData);
            console.log('✅ Google Calendar: Randevu başarıyla güncellendi');
          }
        } catch (googleError) {
          console.error('❌ Google Calendar: Randevu güncellenirken hata:', googleError);
        }
        
        // Toast bildirimi WeeklyCalendar'da gösterilecek
        
        // Eğer değişiklik varsa ve bildirim seçenekleri açıksa bildirim gönder
        if (hasChanges && (formData.notificationEmail || formData.notificationSMS)) {
          console.log('Güncelleme bildirimleri gönderiliyor...');
          console.log('Değişiklikler:', changes);
          
          const notificationSent = await sendUpdateNotifications(changes);
          if (notificationSent) {
            showInfo('Güncelleme bildirimleri gönderildi');
          }
        }
        
        onSave && onSave();
        onClose();
      } else {
        showError(response.message || 'Randevu güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Randevu güncelleme hatası:', error);
      showError('Randevu güncellenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      description: '',
      color: '#3C02AA',
      location: '',
      type: 'meeting',
      priority: 'medium',
      status: 'scheduled',
      isAllDay: false,
      repeat: 'TEKRARLANMAZ',
      assignedTo: 'YAKIP',
      startOffice: '',
      notification: false,
      reminderBefore: false,
      reminderValue: 1,
      reminderUnit: 'hours',
      notificationSMS: false,
      notificationEmail: false,
      visibleToUsers: [],
      visibleToAll: false
    });
    setErrors({});
    setConflicts([]);
    setSelectedContacts([]);
    setSearchTerm('');
    setUserSearchTerm('');
    setShowContactDropdown(false);
    setShowUserDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="edit-appointment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Randevu Düzenle</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Başlık */}
          <div className="form-group">
            <label htmlFor="title">Başlık *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="Randevu başlığını girin"
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Tarih ve Saat */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Tarih *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Başlangıç Saati *</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={errors.startTime ? 'error' : ''}
              />
              {errors.startTime && <span className="error-message">{errors.startTime}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endTime">Bitiş Saati *</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={errors.endTime ? 'error' : ''}
              />
              {errors.endTime && <span className="error-message">{errors.endTime}</span>}
            </div>
          </div>

          {/* Açıklama */}
          <div className="form-group full-width">
            <label htmlFor="description">Açıklama</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Randevu açıklamasını girin"
            />
          </div>

          {/* Konum */}
          <div className="form-group full-width">
            <label htmlFor="location">Konum</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Randevu konumunu girin"
            />
          </div>

          {/* Durum */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Durum</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>



          {/* Tüm Gün Etkinliği */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAllDay"
                checked={formData.isAllDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
              />
              Tüm gün etkinliği
            </label>
          </div>

          {/* Davetli Seçimi */}
          <div className="form-group full-width">
            <label>Davetliler</label>
            <div className="contact-search-container">
              <input
                type="text"
                value={searchTerm}
                onChange={handleContactSearch}
                placeholder="Davetli aramak için isim yazın..."
                className="contact-search-input"
                onFocus={() => setShowContactDropdown(true)}
              />
              <button
                type="button"
                className="add-contact-btn"
                onClick={handleOpenAddContactModal}
                title="Yeni kişi ekle"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {showContactDropdown && filteredContacts.length > 0 && (
                <div className="contact-dropdown">
                  {filteredContacts.slice(0, 10).map(contact => {
                    const isSelected = selectedContacts.find(c => c.id === contact.id);
                    return (
                    <div
                      key={contact.id}
                      className={`contact-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="contact-option-avatar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="contact-info">
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-details">{contact.phone} - {contact.email}</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seçilen Davetliler */}
            {selectedContacts.length > 0 && (
              <div className="selected-contacts">
                <label>Seçilen Davetliler:</label>
                <div className="contact-tags">
                  {selectedContacts.map(contact => (
                    <div key={contact.id} className="contact-tag">
                      <span>{contact.name}</span>
                      <button
                        type="button"
                        onClick={() => handleContactRemove(contact.id)}
                        className="remove-tag-btn"
                        title="Kaldır"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bildirim Ayarları */}
          <div className="form-group full-width">
            <label>Bildirim Ayarları</label>
            <div className="notification-info">
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px 0' }}>
                ℹ️ Bu seçenekler açıksa, randevu güncellendiğinde değişiklikler davetlilere bildirilir
              </p>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="notificationEmail"
                  checked={formData.notificationEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, notificationEmail: e.target.checked }))}
                />
                E-posta Bildirimi (Güncellemeler davetlilere e-posta ile gönderilir)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="notificationSMS"
                  checked={formData.notificationSMS}
                  onChange={(e) => setFormData(prev => ({ ...prev, notificationSMS: e.target.checked }))}
                />
                SMS Bildirimi (Güncellemeler davetlilere SMS ile gönderilir)
              </label>
            </div>
          </div>

          {/* Hatırlatma Ayarları */}
          <div className="form-group full-width">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="reminderBefore"
                checked={formData.reminderBefore}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderBefore: e.target.checked }))}
              />
              Hatırlatma Gönder
            </label>
            
            {formData.reminderBefore && (
              <div className="reminder-settings">
                <div className="reminder-datetime-group">
                  <label>Hatırlatma Tarihi ve Saati:</label>
                  <input
                    type="datetime-local"
                    value={formData.reminderDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderDateTime: e.target.value }))}
                    className="reminder-datetime-input"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <small className="reminder-help-text">
                    Hatırlatma mesajının gönderileceği tarih ve saati seçin
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* Görünürlük Ayarları */}
          <div className="form-group full-width">
            <label>Görünürlük Ayarları</label>
            <div className="visibility-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.visibleToAll}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visibleToAll: e.target.checked,
                    visibleToUsers: e.target.checked ? [] : prev.visibleToUsers
                  }))}
                />
                Tüm kullanıcılara görünür
              </label>

              {!formData.visibleToAll && (
                <div className="user-visibility-section">
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={handleUserSearch}
                    placeholder="Kullanıcı aramak için isim yazın..."
                    className="user-search-input"
                    onFocus={() => {
                      setShowUserDropdown(true);
                      // Input'a focus olduğunda tüm kullanıcıları göster
                      if (userSearchTerm.trim() === '') {
                        setFilteredUsers(users);
                      }
                    }}
                    onBlur={() => {
                      // Dropdown'daki seçim işlemini tamamlamak için kısa bir gecikme
                      setTimeout(() => setShowUserDropdown(false), 200);
                    }}
                  />
                  
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="user-dropdown">
                      {filteredUsers.slice(0, 10).map(user => {
                        const isSelected = formData.visibleToUsers && formData.visibleToUsers.find(u => u.id === user.id);
                        return (
                        <div
                          key={user.id}
                          className={`user-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="user-option-avatar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                          <div className="user-info">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Seçilen Kullanıcılar */}
                  {formData.visibleToUsers && formData.visibleToUsers.length > 0 && (
                    <div className="selected-users">
                      <label>Görünür Kullanıcılar:</label>
                      <div className="user-tags">
                        {formData.visibleToUsers.map(user => (
                          <div key={user.id} className="user-tag">
                            <span>{user.name}</span>
                            <button
                              type="button"
                              onClick={() => handleUserRemove(user.id)}
                              className="remove-tag-btn"
                              title="Kaldır"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Çakışma Uyarısı */}
          {isCheckingConflict && (
            <div className="conflict-checking">
              <div className="spinner-small"></div>
              <span>Çakışma kontrolü yapılıyor...</span>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="conflicts-warning">
              <div className="warning-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Çakışan Randevular ({conflicts.length})</span>
              </div>
              <div className="conflicts-list">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-item">
                    <strong>{conflict.title}</strong>
                    <span>{conflict.start_time} - {conflict.end_time}</span>
                    <span>{conflict.creator_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hatırlatma Kontrolleri */}
          {appointmentDetails?.reminder_info && (
            <div className="reminder-management-section">
              <h3>Hatırlatma Yönetimi</h3>
              
              <div className="reminder-status-info">
                <div className="status-item">
                  <label>Durum:</label>
                  <span className={`reminder-status-badge status-${appointmentDetails.reminder_info.status}`}>
                    {appointmentDetails.reminder_info.status === 'scheduled' && 'Zamanlandı'}
                    {appointmentDetails.reminder_info.status === 'sending' && 'Gönderiliyor'}
                    {appointmentDetails.reminder_info.status === 'sent' && 'Gönderildi'}
                    {appointmentDetails.reminder_info.status === 'failed' && 'Başarısız'}
                    {appointmentDetails.reminder_info.status === 'cancelled' && 'İptal'}
                  </span>
                </div>
                {appointmentDetails.reminder_info.reminder_time && (
                  <div className="status-item">
                    <label>Hatırlatma Zamanı:</label>
                    <span>{new Date(appointmentDetails.reminder_info.reminder_time).toLocaleString('tr-TR')}</span>
                  </div>
                )}
                {appointmentDetails.reminder_info.sent_at && (
                  <div className="status-item">
                    <label>Gönderilme Zamanı:</label>
                    <span>{new Date(appointmentDetails.reminder_info.sent_at).toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="reminder-controls">
                {/* Eğer hatırlatma gönderildiyse tekrar gönder butonu göster */}
                {(appointmentDetails.reminder_info.status === 'sent' || appointmentDetails.reminder_info.status === 'failed') && (
                  <div className="reminder-resend-section">
                    {!showReminderControls ? (
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={() => setShowReminderControls(true)}
                        disabled={resendingReminder}
                      >
                        Tekrar Gönder
                      </button>
                    ) : (
                      <div className="resend-options">
                        <h4>Hatırlatma Tekrar Gönder</h4>
                        <div className="resend-choice">
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            onClick={handleResendReminder}
                            disabled={resendingReminder}
                          >
                            {resendingReminder ? 'Gönderiliyor...' : 'Hemen Gönder'}
                          </button>
                          <button 
                            type="button"
                            className="btn btn-primary" 
                            onClick={() => setShowManualTime(true)}
                            disabled={resendingReminder}
                          >
                            Tarih/Saat Belirle
                          </button>
                        </div>
                        
                        {showManualTime && (
                          <div className="manual-time-form">
                            <div className="form-group">
                              <label>Hatırlatma Zamanı:</label>
                              <input
                                type="datetime-local"
                                value={manualReminderDateTime}
                                onChange={(e) => setManualReminderDateTime(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                              />
                            </div>
                            <div className="form-actions">
                              <button 
                                type="button"
                                className="btn btn-primary" 
                                onClick={handleManualReminder}
                                disabled={resendingReminder || !manualReminderDateTime}
                              >
                                {resendingReminder ? 'Zamanlanıyor...' : 'Zamanla'}
                              </button>
                              <button 
                                type="button"
                                className="btn btn-secondary" 
                                onClick={() => {
                                  setShowManualTime(false);
                                  setManualReminderDateTime('');
                                }}
                                disabled={resendingReminder}
                              >
                                İptal
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="resend-actions">
                          <button 
                            type="button"
                            className="btn btn-outline" 
                            onClick={() => {
                              setShowReminderControls(false);
                              setShowManualTime(false);
                              setManualReminderDateTime('');
                            }}
                            disabled={resendingReminder}
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Eğer hatırlatma henüz gönderilmediyse zaman değiştirme imkanı ver */}
                {appointmentDetails.reminder_info.status === 'scheduled' && (
                  <div className="reminder-edit-section">
                    {!showReminderEdit ? (
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={startReminderEdit}
                      >
                        Hatırlatma Zamanını Değiştir
                      </button>
                    ) : (
                      <div className="reminder-edit-form">
                        <div className="form-row">
                          <div className="form-group">
                            <input
                              type="number"
                              min="1"
                              value={newReminderValue}
                              onChange={(e) => setNewReminderValue(e.target.value)}
                              placeholder="Değer"
                            />
                          </div>
                          <div className="form-group">
                            <select
                              value={newReminderUnit}
                              onChange={(e) => setNewReminderUnit(e.target.value)}
                            >
                              <option value="MINUTES">Dakika</option>
                              <option value="HOURS">Saat</option>
                              <option value="DAYS">Gün</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-actions">
                          <button 
                            type="button"
                            className="btn btn-primary" 
                            onClick={handleUpdateReminderTime}
                            disabled={updatingReminder || !newReminderValue}
                          >
                            {updatingReminder ? 'Güncelleniyor...' : 'Güncelle'}
                          </button>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            onClick={cancelReminderEdit}
                            disabled={updatingReminder}
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              İptal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || isCheckingConflict}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Güncelleniyor...
                </>
              ) : (
                'Güncelle'
              )}
            </button>
          </div>
        </form>

        {/* AddContactModal */}
        <AddContactModal
          isOpen={showAddContactModal}
          onClose={handleCloseAddContactModal}
          onSave={handleContactAdded}
        />
      </div>
    </div>
  );
};

export default EditAppointmentModal;