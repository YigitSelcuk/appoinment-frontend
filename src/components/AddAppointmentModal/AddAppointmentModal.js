import React, { useState, useEffect } from 'react';
import { checkAppointmentConflict, getInviteePreviousAppointments } from '../../services/appointmentsService';
import { contactsService } from '../../services/contactsService';
import { getUsers, getCurrentUser } from '../../services/usersService';
import { sendNotificationCombo } from '../../services/emailService';
import { sendSMS } from '../../services/smsService';
import AddContactModal from '../AddContactModal/AddContactModal';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import googleCalendarService from '../../services/googleCalendarService';
import './AddAppointmentModal.css';

const AddAppointmentModal = ({ isOpen, onClose, onSave, selectedDate, selectedTime }) => {
  // Toast hook'u
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  // Auth hook'u
  const { accessToken } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    date: selectedDate || '',
    startTime: selectedTime || '',
    endTime: '',
    description: '',
    color: '#3C02AA',
    isAllDay: false,
    repeat: 'TEKRARLANMAZ',
    assignedTo: 'YAKIP',
    location: '',
    startOffice: '',
    notification: false,
    reminderBefore: false,
    reminderValue: 1,
    reminderUnit: 'hours',
    notificationSMS: false, // SMS bildirimi
    notificationEmail: false, // EPOSTA bildirimi
    visibleToUsers: [], // Randevunun hangi kullanıcılarda gözükeceği
    visibleToAll: false // Tüm kullanıcılara görünür mü?
  });

  // Diğer state'ler
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  


  // Props değiştiğinde form verilerini güncelle
  React.useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
    if (selectedTime) {
      setFormData(prev => ({ ...prev, startTime: selectedTime }));
    }
  }, [selectedDate, selectedTime]);

  // Kullanıcının varsayılan rengini yükle (Authentication sonrası)
  useEffect(() => {
    const loadUserColor = async () => {
      try {
        if (!accessToken) {
          console.warn('Access token bulunamadı, kullanıcı rengi yüklenemedi');
          return;
        }
        const response = await getCurrentUser(accessToken);
        if (response.success && response.data && response.data.color) {
          setFormData(prev => ({ ...prev, color: response.data.color }));
        }
      } catch (error) {
        console.error('Kullanıcı rengi yüklenirken hata:', error);
      }
    };

    if (isOpen && accessToken) {
      // Biraz bekleyerek auth'un hazır olmasını sağla
      const timeoutId = setTimeout(loadUserColor, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, accessToken]);

  // Kullanıcıları yükle (Authentication sonrası)
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!accessToken) {
          showError('Erişim token\'ı gerekli');
          return;
        }
        setLoadingUsers(true);
        const response = await getUsers(accessToken);
        const usersData = response.data || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
        if (usersData.length > 0) {
          showSuccess('Kullanıcılar başarıyla yüklendi');
        } else {
          showWarning('Kullanıcı listesi boş');
        }
      } catch (error) {
        console.error('Kullanıcıları yüklerken hata:', error);
        showError('Kullanıcılar yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isOpen && accessToken) {
      // Biraz bekleyerek auth'un hazır olmasını sağla
      const timeoutId = setTimeout(loadUsers, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, accessToken, showSuccess, showWarning, showError]);

  // Contacts'ları yükle
  React.useEffect(() => {
    const loadContacts = async () => {
      try {
        // Tüm kişileri çekmek için yüksek limit kullan
        const response = await contactsService.getContacts({ limit: 1000 });
        
        if (response.success && response.data) {
          // API'den gelen verileri uygun formata çevir
          const formattedContacts = response.data.map(contact => ({
            id: contact.id,
            name: `${contact.name || ''} ${contact.surname || ''}`.trim(),
            email: contact.email || '',
            phone1: contact.phone1 || '',
            phone2: contact.phone2 || '',
            phone: contact.phone1 || contact.phone2 || 'Telefon yok' // Arama için
          }));
          setContacts(formattedContacts);
          setFilteredContacts(formattedContacts);
          showSuccess('Kişiler başarıyla yüklendi');
        } else {
          setContacts([]);
          setFilteredContacts([]);
          showWarning('Kişi listesi boş');
        }
      } catch (error) {
        // Hata durumunda boş array set et
        setContacts([]);
        setFilteredContacts([]);
        showError('Kişiler yüklenirken hata oluştu: ' + error.message);
      }
    };

    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Dropdown dışına tıklandığında kapatma
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Eğer tıklanan element dropdown veya input değilse dropdown'u kapat
      if (!event.target.closest('.visibility-search-container') && 
          !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserDropdown]);

  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [activeToolbarButtons, setActiveToolbarButtons] = useState([]);
  
  // Önceki randevular için state'ler
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [showPreviousAppointments, setShowPreviousAppointments] = useState(false);
  const [loadingPreviousAppointments, setLoadingPreviousAppointments] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [previousAppointmentsPagination, setPreviousAppointmentsPagination] = useState({
    currentPage: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  });



  const colorOptions = [
    '#3C02AA', '#29CC39', '#FF6633', '#FFCB33', 
    '#33BFFF', '#FF8C33', '#E62E7B', '#2EE6CA'
  ];

  // Çakışma kontrolü yap
  const checkForConflicts = async (date, startTime, endTime) => {
    if (!date || !startTime || !endTime || formData.isAllDay) {
      setConflicts([]);
      return;
    }

    if (!accessToken) {
      console.warn('Access token bulunamadı, çakışma kontrolü yapılamadı');
      setConflicts([]);
      return;
    }

    try {
      setIsCheckingConflict(true);
      console.log('Çakışma kontrolü parametreleri:', { date, startTime, endTime });
      const response = await checkAppointmentConflict(accessToken, {
        date,
        startTime,
        endTime
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
      showError('Çakışma kontrolü yapılırken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setIsCheckingConflict(false);
    }
  };

  // Debounce için timeout
  const [conflictTimeout, setConflictTimeout] = useState(null);

  // Contact search fonksiyonları
  const handleContactSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredContacts(contacts);
      setShowContactDropdown(false);
    } else {
      const filtered = contacts.filter(contact => {
        const name = contact.name || '';
        const email = contact.email || '';
        const phone = contact.phone || '';
        
        return name.toLowerCase().includes(term.toLowerCase()) ||
               email.toLowerCase().includes(term.toLowerCase()) ||
               phone.includes(term);
      });
      setFilteredContacts(filtered);
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

  const handleOpenAddContactModal = () => {
    setShowAddContactModal(true);
    showInfo('Yeni kişi ekleme formu açılıyor...');
  };

  const handleCloseAddContactModal = () => {
    setShowAddContactModal(false);
    showInfo('Kişi ekleme formu kapatıldı');
  };

  const handleContactAdded = (newContact) => {
    // Yeni kişi eklendikten sonra contacts listesini güncelle
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

  // Kullanıcı arama handler'ı
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
      // Arama terimi boş olduğunda da dropdown'u göster
      setShowUserDropdown(users.length > 0);
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
      setShowUserDropdown(filtered.length > 0);
    }
  };

  // Kullanıcı seçimi handler'ları
  const handleUserSelect = (user) => {
    const currentVisibleUsers = formData.visibleToUsers || [];
    if (!currentVisibleUsers.find(u => u.id === user.id)) {
      // Kullanıcıyı sadece gerekli alanlarla ekle
      const userToAdd = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      
      setFormData(prev => ({
        ...prev,
        visibleToUsers: [...currentVisibleUsers, userToAdd],
        visibleToAll: false // Bireysel seçim yapıldığında TÜMÜ'yü kapat
      }));
      showSuccess(`${user.name} görünürlük listesine eklendi`);
    } else {
      showWarning(`${user.name} zaten görünürlük listesinde`);
    }
    setUserSearchTerm('');
    setShowUserDropdown(false);
  };

  const handleUserRemove = (userId) => {
    const removedUser = formData.visibleToUsers?.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      visibleToUsers: prev.visibleToUsers.filter(u => u.id !== userId)
    }));
    if (removedUser) {
      showInfo(`${removedUser.name} görünürlük listesinden çıkarıldı`);
    }
  };

  const handleSelectAllUsers = () => {
    setFormData(prev => ({
      ...prev,
      visibleToAll: !prev.visibleToAll,
      visibleToUsers: !prev.visibleToAll ? [] : prev.visibleToUsers // TÜMÜ seçiliyse bireysel seçimleri temizle
    }));
    
    if (!formData.visibleToAll) {
      showInfo('Randevu tüm kullanıcılara görünür olarak ayarlandı');
    } else {
      showInfo('Randevu görünürlüğü özelleştirildi');
    }
  };

  const handleToolbarAction = (action, e) => {
    e.preventDefault();
    const textarea = document.querySelector('.editor-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.description.substring(start, end);
    let newText = formData.description;
    let newCursorPos = start;

    switch (action) {
      case 'attach':
        break;
        
      case 'bold':
        if (selectedText) {
          newText = formData.description.substring(0, start) + 
                   `**${selectedText}**` + 
                   formData.description.substring(end);
          newCursorPos = end + 4; // ** ** eklendi
        } else {
          newText = formData.description.substring(0, start) + 
                   `****` + 
                   formData.description.substring(end);
          newCursorPos = start + 2; // ** arasına cursor
        }
        break;
        
      case 'italic':
        if (selectedText) {
          newText = formData.description.substring(0, start) + 
                   `*${selectedText}*` + 
                   formData.description.substring(end);
          newCursorPos = end + 2;
        } else {
          newText = formData.description.substring(0, start) + 
                   `**` + 
                   formData.description.substring(end);
          newCursorPos = start + 1;
        }
        break;
        
      case 'underline':
        if (selectedText) {
          newText = formData.description.substring(0, start) + 
                   `<u>${selectedText}</u>` + 
                   formData.description.substring(end);
          newCursorPos = end + 7;
        } else {
          newText = formData.description.substring(0, start) + 
                   `<u></u>` + 
                   formData.description.substring(end);
          newCursorPos = start + 3;
        }
        break;
        
      case 'bullet':
        const lines = formData.description.split('\n');
        const lineStart = formData.description.lastIndexOf('\n', start - 1) + 1;
        const currentLineIndex = formData.description.substring(0, start).split('\n').length - 1;
        
        if (lines[currentLineIndex].startsWith('• ')) {
          // Zaten madde işareti varsa kaldır
          lines[currentLineIndex] = lines[currentLineIndex].substring(2);
          newCursorPos = start - 2;
        } else {
          // Madde işareti ekle
          lines[currentLineIndex] = '• ' + lines[currentLineIndex];
          newCursorPos = start + 2;
        }
        newText = lines.join('\n');
        break;
        
      case 'number':
        const numberedLines = formData.description.split('\n');
        const currentNumberLineIndex = formData.description.substring(0, start).split('\n').length - 1;
        
        if (numberedLines[currentNumberLineIndex].match(/^\d+\. /)) {
          // Zaten numaralı liste varsa kaldır
          numberedLines[currentNumberLineIndex] = numberedLines[currentNumberLineIndex].replace(/^\d+\. /, '');
          newCursorPos = start - 3;
        } else {
          // Numaralı liste ekle
          numberedLines[currentNumberLineIndex] = '1. ' + numberedLines[currentNumberLineIndex];
          newCursorPos = start + 3;
        }
        newText = numberedLines.join('\n');
        break;
        
      case 'link':
        if (selectedText) {
          const url = prompt('Link URL\'sini girin:', 'https://');
          if (url) {
            newText = formData.description.substring(0, start) + 
                     `[${selectedText}](${url})` + 
                     formData.description.substring(end);
            newCursorPos = end + url.length + 4;
          }
        } else {
          const url = prompt('Link URL\'sini girin:', 'https://');
          const linkText = prompt('Link metni girin:', 'Link');
          if (url && linkText) {
            newText = formData.description.substring(0, start) + 
                     `[${linkText}](${url})` + 
                     formData.description.substring(end);
            newCursorPos = start + linkText.length + url.length + 4;
          }
        }
        break;
        
      case 'clear':
        if (window.confirm('Tüm metni silmek istediğinizden emin misiniz?')) {
          newText = '';
          newCursorPos = 0;
          setActiveToolbarButtons([]);
        }
        break;
        
      default:
        break;
    }

    if (newText !== formData.description) {
      setFormData(prev => ({ ...prev, description: newText }));
      
      // Cursor pozisyonunu ayarla
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Geçmiş tarih/saat kontrolü ve çakışma kontrolü
    if (['date', 'startTime', 'endTime'].includes(name)) {
      const currentData = { ...formData, [name]: newValue };
      
             // Geçmiş tarih/saat bilgilendirmesi
       if (currentData.date) {
         const now = new Date();
         
         if (name === 'date' || (name === 'startTime' && currentData.startTime)) {
           const appointmentDateTime = new Date(`${currentData.date}T${currentData.startTime || '00:00'}`);
           
           if (!currentData.isAllDay && currentData.startTime) {
             if (appointmentDateTime < now) {
               showInfo('ℹ️ Geçmiş tarih ve saatte randevu oluşturuyorsunuz');
             }
           } else if (currentData.isAllDay && name === 'date') {
             const appointmentDate = new Date(currentData.date);
             const today = new Date();
             today.setHours(0, 0, 0, 0);
             appointmentDate.setHours(0, 0, 0, 0);
             
             if (appointmentDate < today) {
               showInfo('ℹ️ Geçmiş tarihte randevu oluşturuyorsunuz');
             }
           }
         }
       }
      
      // Çakışma kontrolü için debounce
      if (conflictTimeout) {
        clearTimeout(conflictTimeout);
      }
      
      const newTimeout = setTimeout(() => {
        if (currentData.date && currentData.startTime && currentData.endTime) {
          checkForConflicts(currentData.date, currentData.startTime, currentData.endTime);
        }
      }, 300);
      
      setConflictTimeout(newTimeout);
    }

    // Hataları temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };



  // Önceki randevuları yükle
  const loadPreviousAppointments = async (page = 1) => {
    if (!accessToken) {
      console.warn('Access token bulunamadı, önceki randevular yüklenemedi');
      setPreviousAppointments([]);
      setShowPreviousAppointments(false);
      return;
    }
    
    if (selectedContacts.length === 0) {
      setPreviousAppointments([]);
      setShowPreviousAppointments(false);
      setPreviousAppointmentsPagination({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 5,
        hasNextPage: false,
        hasPrevPage: false
      });
      return;
    }

    try {
      setLoadingPreviousAppointments(true);
      const inviteeEmails = selectedContacts.map(contact => contact.email).filter(email => email);
      
      if (inviteeEmails.length === 0) {
        setPreviousAppointments([]);
        setShowPreviousAppointments(false);
        return;
      }

      console.log('Loading previous appointments for:', inviteeEmails);
      
      const response = await getInviteePreviousAppointments(accessToken, {
        inviteeEmails,
        currentDate: formData.date || new Date().toISOString().split('T')[0],
        page,
        limit: 5
      });

      console.log('Previous appointments response:', response);

      if (response.appointments) {
        // Randevuları frontend'de de sıralayalım (ekstra güvence için)
        const sortedAppointments = response.appointments.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // En yeni en üstte
          }
          return b.start_time.localeCompare(a.start_time); // Aynı tarihte en geç saat en üstte
        });
        
        setPreviousAppointments(sortedAppointments);
        setPreviousAppointmentsPagination({
          currentPage: response.pagination.currentPage || 1,
          totalPages: response.pagination.totalPages || 0,
          totalItems: response.pagination.totalItems || 0,
          itemsPerPage: response.pagination.itemsPerPage || 10,
          hasNextPage: response.pagination.hasNextPage || false,
          hasPrevPage: response.pagination.hasPrevPage || false
        });
        setShowPreviousAppointments(sortedAppointments.length > 0);
        
        if (sortedAppointments.length > 0) {
          showInfo(`${sortedAppointments.length} önceki randevu bulundu`);
        } else {
          showInfo('Seçilen kişiler için önceki randevu bulunamadı');
        }
      }
    } catch (error) {
      console.error('Önceki randevuları yükleme hatası:', error);
      showError('Önceki randevular yüklenirken hata oluştu: ' + error.message);
      setPreviousAppointments([]);
      setShowPreviousAppointments(false);
      setPreviousAppointmentsPagination({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 5,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoadingPreviousAppointments(false);
    }
  };

  // Sayfa değiştirme fonksiyonu
  const handlePreviousAppointmentsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= previousAppointmentsPagination.totalPages) {
      loadPreviousAppointments(newPage);
    }
  };

  // Yıl navigasyon fonksiyonları
  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  // Seçilen kişiler değiştiğinde önceki randevuları yükle
  React.useEffect(() => {
    if (selectedContacts.length > 0 && formData.date) {
      loadPreviousAppointments(1);
    } else {
      setPreviousAppointments([]);
      setShowPreviousAppointments(false);
    }
  }, [selectedContacts, formData.date]);

  // Yıl değiştiğinde önceki randevuları yeniden yükle
  React.useEffect(() => {
    if (selectedContacts.length > 0 && formData.date) {
      loadPreviousAppointments(1);
    }
  }, [currentYear]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Randevu başlığı gereklidir';
    }
    
    if (!formData.date) {
      newErrors.date = 'Tarih seçimi gereklidir';
    }
    

    
    if (!formData.isAllDay) {
    if (!formData.startTime) {
        newErrors.startTime = 'Başlangıç saati gereklidir';
    }
    
    if (!formData.endTime) {
        newErrors.endTime = 'Bitiş saati gereklidir';
    }
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'Bitiş saati başlangıç saatinden sonra olmalıdır';
      }
    }
    

    
    setErrors(newErrors);
    
    // Hata varsa toast ile bildir
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      showError(firstError);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || conflicts.length > 0) {
      return;
    }

    try {
      // Randevu verilerini hazırla
      const appointmentDataToSave = {
        ...formData,
        selectedContacts,
        visibleToUsers: formData.visibleToUsers
      };
      
      console.log('=== FRONTEND RANDEVU VERİLERİ ===');
      console.log('appointmentDataToSave:', JSON.stringify(appointmentDataToSave, null, 2));
      console.log('formData.visibleToUsers:', formData.visibleToUsers);
      console.log('formData.visibleToAll:', formData.visibleToAll);
      
      // Google Calendar'a da ekle (eğer kullanıcı giriş yapmışsa)
      let googleEventId = null;
      try {
        // Önce Google Calendar servisinin başlatılıp başlatılmadığını kontrol et
        if (!googleCalendarService.isInitialized) {
          console.log('🔄 Google Calendar: Servis başlatılıyor...');
          await googleCalendarService.init();
        }
        
        if (googleCalendarService.isSignedIn()) {
          console.log('📅 Google Calendar: Randevu ekleniyor...');
          const googleEventData = {
            title: formData.title,
            description: formData.description || '',
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: formData.location || ''
          };
          
          const googleEvent = await googleCalendarService.createEvent(googleEventData);
          googleEventId = googleEvent.id;
          console.log('✅ Google Calendar: Randevu başarıyla eklendi:', googleEvent);
        } else {
          console.log('ℹ️ Google Calendar: Kullanıcı giriş yapmamış, randevu sadece yerel veritabanına kaydedilecek');
        }
      } catch (googleError) {
        console.error('❌ Google Calendar: Randevu eklenirken hata:', googleError);
        // Google Calendar hatası randevu oluşturmayı engellemez
      }
      
      // Google Event ID'yi appointment data'ya ekle
      if (googleEventId) {
        appointmentDataToSave.google_event_id = googleEventId;
      }
      
      // Randevuyu kaydet (bildirimler backend'de gönderilecek)
      const response = await onSave(appointmentDataToSave);
      
      // Toast bildirimi WeeklyCalendar'da gösterilecek, burada göstermeye gerek yok
      
      handleClose();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        showWarning('Bu saatte başka bir randevunuz bulunmaktadır!');
      } else {
        showError('Randevu kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      }
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
      isAllDay: false,
      repeat: 'TEKRARLANMAZ',
      assignedTo: 'YAKIP',
      location: '',
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
    showInfo('Randevu formu temizlendi');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="modal-overlay">
      <div className="add-appointment-modal">
        <div className="modal-header">
          <h2>RANDEVU OLUŞTUR</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Randevu Başlığı */}
            <div className="form-group full-width">
            <label>RANDEVU BAŞLIĞI</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Randevu başlığını girin"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Tarih ve Saat */}
          <div className="form-row">
            <div className="form-group">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>
            <div className="form-group">
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={errors.startTime ? 'error' : ''}
                disabled={formData.isAllDay}
              />
              {errors.startTime && <span className="error-message">{errors.startTime}</span>}
            </div>
            <div className="form-group">
              <input
                type="date"
                name="endDate"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? 'error' : ''}
              />
            </div>
            <div className="form-group">
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={errors.endTime ? 'error' : ''}
                disabled={formData.isAllDay}
              />
              {errors.endTime && <span className="error-message">{errors.endTime}</span>}
            </div>
          </div>

          {/* Tüm Gün Toggle */}
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                name="isAllDay"
                checked={formData.isAllDay}
                onChange={handleInputChange}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">TÜM GÜN</span>
            </label>
          </div>

          {/* Tekrarlanmaz ve Davetli Ekle yan yana */}
          <div className="repeat-invite-row">
            <div className="form-group">
              <div className="invite-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12a8 8 0 0 1 8-8V0l4 4-4 4V4a8 8 0 1 0 8 8" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>TEKRARLANMA</span>
              </div>
              <select
                name="repeat"
                value={formData.repeat}
                onChange={handleInputChange}
              >
                <option value="TEKRARLANMAZ">TEKRARLANMAZ</option>
                <option value="GÜNLÜK">GÜNLÜK</option>
                <option value="HAFTALIK">HAFTALIK</option>
                <option value="AYLIK">AYLIK</option>
              </select>
            </div>
            
            <div className="invite-section">
              <div className="invite-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 8v6M23 11h-6" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>DAVETLİ EKLE</span>
              </div>
              
              <div className="contact-search-container">
                <div className="contact-search-input-wrapper">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleContactSearch}
                    placeholder="Kişi ara..."
                    className="contact-search-input-new"
                  />
                  <button 
                    type="button"
                    className="add-contact-button-new"
                    onClick={handleOpenAddContactModal}
                    title="Yeni kişi ekle"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
                
                {/* Kişi Arama Dropdown */}
                {showContactDropdown && filteredContacts.length > 0 && (
                  <div className="contact-dropdown-new">
                    {filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="contact-option-new"
                        onClick={() => handleContactSelect(contact)}
                      >
                        <div className="contact-option-avatar">
                          <div className="contact-avatar-circle-tiny">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2"/>
                              <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                            </svg>
                          </div>
                        </div>
                        <div className="contact-option-info">
                          <div className="contact-option-name">{contact.name}</div>
                          <div className="contact-option-details">{contact.email} • {contact.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seçilen Kişiler */}
          {selectedContacts.length > 0 && (
            <div className="selected-contacts-section">
              <div className="selected-contacts-header-new">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#FF6B35" strokeWidth="2"/>
                  <circle cx="9" cy="7" r="4" stroke="#FF6B35" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#FF6B35" strokeWidth="2"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#FF6B35" strokeWidth="2"/>
                </svg>
                <span>SEÇİLEN KİŞİLER ({selectedContacts.length})</span>
              </div>
              <div className="selected-contacts-list-new">
                {selectedContacts.map(contact => (
                  <div key={contact.id} className="selected-contact-item-new">
                    <div className="selected-contact-avatar">
                      <div className="contact-avatar-circle-selected">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2"/>
                          <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                        </svg>
                      </div>
                    </div>
                    <div className="selected-contact-info">
                      <span className="selected-contact-name">{contact.name}</span>
                      <div className="selected-contact-details">
                        {contact.phone1 && <span className="contact-phone-tag">{contact.phone1}</span>}
                        {contact.phone2 && <span className="contact-phone-tag">{contact.phone2}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-contact-btn-new"
                      onClick={() => handleContactRemove(contact.id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Önceki Randevular - Resim Tasarımı */}
          {selectedContacts.length > 0 && showPreviousAppointments && (
            <div className="previous-appointments-image-style">
              <div className="appointments-top-bar">
                <div className="year-navigation">
                  <button type="button" className="nav-arrow prev-year" onClick={handlePrevYear}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  <span className="current-year">{currentYear}</span>
                  <button type="button" className="nav-arrow next-year" onClick={handleNextYear}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
                <div className="total-appointments">
                  <span className="total-text">TOPLAM {previousAppointments.length} RANDEVU BULUNMUŞTUR.</span>
                </div>
              </div>
              
              {previousAppointments.length > 0 ? (
                <div className="appointments-list-image">
                  {previousAppointments.map((appointment, index) => (
                    <div key={`${appointment.id}-${index}`} className="appointment-row">
                      <div className="appointment-dot" style={{backgroundColor: appointment.color || '#ff6b35'}}></div>
                      <div className="appointment-info">
                        <div className="appointment-datetime-inline">
                          <span className="appointment-date-text">
                            {new Date(appointment.date).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="appointment-time-text">
                            {appointment.start_time?.substring(0, 5)}
                          </span>
                        </div>
                        <div className="appointment-title-row">
                          <div className="appointment-title-text">{appointment.title}</div>
                          <div className="appointment-invitees-text">
                            Davetliler: {appointment.invitees && appointment.invitees.length > 0 
                              ? appointment.invitees.map(inv => inv.name).join(', ') 
                              : 'Davetli yok'}
                          </div>
                        </div>
                      </div>
                      <div className="appointment-status-right">
                        <span className="status-label" style={{color: appointment.color || '#ff6b35'}}>
                          {appointment.status === 'confirmed' ? 'GÖRÜŞME YAPILDI' : 
                           appointment.status === 'pending' ? 'RANDEVU TEKRARI' : 
                           appointment.status === 'cancelled' ? 'İPTAL EDİLDİ' : 
                           'RANDEVU TEKRARI'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-appointments-image">
                  <p>Seçilen kişiler için önceki randevu bulunamadı</p>
                </div>
              )}
              
              {/* Pagination */}
              {previousAppointmentsPagination.totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Sayfa {previousAppointmentsPagination.currentPage} / {previousAppointmentsPagination.totalPages} 
                    (Toplam {previousAppointmentsPagination.totalItems} randevu)
                  </div>
                  <div className="pagination-controls">
                    <button 
                      type="button"
                      className="pagination-btn prev"
                      onClick={() => handlePreviousAppointmentsPageChange(previousAppointmentsPagination.currentPage - 1)}
                      disabled={!previousAppointmentsPagination.hasPrevPage || loadingPreviousAppointments}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Önceki
                    </button>
                    
                    <div className="pagination-pages">
                      {Array.from({ length: Math.min(5, previousAppointmentsPagination.totalPages) }, (_, i) => {
                        const totalPages = previousAppointmentsPagination.totalPages;
                        const currentPage = previousAppointmentsPagination.currentPage;
                        let pageNumber;
                        
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            className={`pagination-page ${pageNumber === currentPage ? 'active' : ''}`}
                            onClick={() => handlePreviousAppointmentsPageChange(pageNumber)}
                            disabled={loadingPreviousAppointments}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button 
                      type="button"
                      className="pagination-btn next"
                      onClick={() => handlePreviousAppointmentsPageChange(previousAppointmentsPagination.currentPage + 1)}
                      disabled={!previousAppointmentsPagination.hasNextPage || loadingPreviousAppointments}
                    >
                      Sonraki
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bildirim Toggle'ları - Yan Yana */}
          <div className="notification-toggles-row">
        

            <div className="toggle-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  name="reminderBefore"
                  checked={formData.reminderBefore}
                  onChange={handleInputChange}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">RANDEVU ÖNCESİ BİLGİLENDİR</span>
              </label>
            </div>
          </div>

          {/* Randevu Öncesi Bildirim Saat Ayarı */}
          {formData.reminderBefore && (
            <div className="reminder-time-section">
              <div className="reminder-time-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2"/>
                  <polyline points="12,6 12,12 16,14" stroke="#666" strokeWidth="2"/>
                </svg>
                <span>BİLDİRİM ZAMANI</span>
              </div>
              <div className="reminder-time-options">
                <input
                  type="number"
                  name="reminderValue"
                  value={formData.reminderValue}
                  onChange={handleInputChange}
                  className="reminder-value-input"
                  min="1"
                  max="999"
                  placeholder="Sayı"
                />
                <select
                  name="reminderUnit"
                  value={formData.reminderUnit}
                  onChange={handleInputChange}
                  className="reminder-unit-select"
                >
                  <option value="minutes">Dakika</option>
                  <option value="hours">Saat</option>
                  <option value="days">Gün</option>
                  <option value="weeks">Hafta</option>
                </select>
                <span className="reminder-text">öncesinden bildirim gönder</span>
              </div>
            </div>
          )}



          {/* Konum */}
          <div className="form-group">
            <div className="input-with-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#666" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" stroke="#666" strokeWidth="2"/>
              </svg>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="KONUM"
              />
            </div>
          </div>

        



          {/* Açıklama - Editör Tarzı */}
          <div className="form-group full-width">
            <div className="description-editor">
              <div className="editor-header">
                <div className="editor-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#FF6B35" strokeWidth="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="#FF6B35" strokeWidth="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="#FF6B35" strokeWidth="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="#FF6B35" strokeWidth="2"/>
                  </svg>
                  <span>AÇIKLAMA</span>
                </div>
              </div>
              
              <div className="editor-toolbar">
                <button 
                  type="button" 
                  className="toolbar-btn" 
                  title="Dosya Ekle"
                  onClick={(e) => handleToolbarAction('attach', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  className={`toolbar-btn ${activeToolbarButtons.includes('bold') ? 'active' : ''}`}
                  title="Kalın (**metin**)"
                  onClick={(e) => handleToolbarAction('bold', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  className={`toolbar-btn ${activeToolbarButtons.includes('italic') ? 'active' : ''}`}
                  title="İtalik (*metin*)"
                  onClick={(e) => handleToolbarAction('italic', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="2"/>
                    <line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  className={`toolbar-btn ${activeToolbarButtons.includes('underline') ? 'active' : ''}`}
                  title="Altı Çizili (<u>metin</u>)"
                  onClick={(e) => handleToolbarAction('underline', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4v6a6 6 0 0 0 12 0V4" stroke="currentColor" strokeWidth="2"/>
                    <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  className="toolbar-btn" 
                  title="Madde İşareti (• metin)"
                  onClick={(e) => handleToolbarAction('bullet', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  className="toolbar-btn" 
                  title="Numaralı Liste (1. metin)"
                  onClick={(e) => handleToolbarAction('number', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line x1="10" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="10" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="10" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 6h1v4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 10h2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  className="toolbar-btn" 
                  title="Link Ekle ([metin](url))"
                  onClick={(e) => handleToolbarAction('link', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <button 
                  type="button" 
                  className="toolbar-btn" 
                  title="Tümünü Temizle"
                  onClick={(e) => handleToolbarAction('clear', e)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
              
              <div className="editor-content">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    // Ctrl/Cmd + B = Bold
                    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                      e.preventDefault();
                      handleToolbarAction('bold', e);
                    }
                    // Ctrl/Cmd + I = Italic
                    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                      e.preventDefault();
                      handleToolbarAction('italic', e);
                    }
                    // Ctrl/Cmd + U = Underline
                    else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                      e.preventDefault();
                      handleToolbarAction('underline', e);
                    }
                    // Ctrl/Cmd + K = Link
                    else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                      e.preventDefault();
                      handleToolbarAction('link', e);
                    }
                    // Tab = Indent (bullet point)
                    else if (e.key === 'Tab' && !e.shiftKey) {
                      e.preventDefault();
                      handleToolbarAction('bullet', e);
                    }
                  }}
                  
                  rows="6"
                  className="editor-textarea"
                />
              </div>
            </div>
          </div>



                      {/* Bildirim ve Görünürlük Bölümü */}
          <div className="notification-visibility-section">
            {/* Üst Başlıklar */}
            <div className="section-headers">
              <div className="notification-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#FF6B35" strokeWidth="2"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#FF6B35" strokeWidth="2"/>
                </svg>
                <span>BİLDİRİM</span>
              </div>
              <div className="visibility-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#FF6B35" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" stroke="#FF6B35" strokeWidth="2"/>
                </svg>
                <span>GÖRÜNÜRLÜK</span>
              </div>
            </div>
            
                        {/* Bildirim ve Görünürlük Seçenekleri */}
            <div className="notification-visibility-options">
              <div className="notification-controls">
                <div className="notification-checkboxes">
                  <label className="notification-checkbox-label">
                    <input
                      type="checkbox"
                      name="notificationEmail"
                      checked={formData.notificationEmail}
                      onChange={handleInputChange}
                      className="notification-checkbox"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">EPOSTA</span>
                  </label>
                  <label className="notification-checkbox-label">
                    <input
                      type="checkbox"
                      name="notificationSMS"
                      checked={formData.notificationSMS}
                      onChange={handleInputChange}
                      className="notification-checkbox"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">SMS</span>
                  </label>
                </div>
                
          
              </div>
              <div className="visibility-controls">
                <div className="visibility-search-container">
                  <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    value={userSearchTerm}
                    onChange={handleUserSearch}
                    onClick={() => {
                      if (users.length > 0) {
                        setShowUserDropdown(true);
                        // Eğer filteredUsers boşsa, tüm kullanıcıları göster
                        if (filteredUsers.length === 0) {
                          const selectedUserIds = formData.visibleToUsers ? formData.visibleToUsers.map(u => u.id) : [];
                          const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
                          const unselectedUsers = users.filter(user => !selectedUserIds.includes(user.id));
                          const sortedSelected = selectedUsers.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
                          const sortedUnselected = unselectedUsers.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
                          setFilteredUsers([...sortedSelected, ...sortedUnselected]);
                        }
                      }
                    }}
                    className="visibility-search-input"
                  />
                  <label className="visibility-all-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.visibleToAll}
                      onChange={handleSelectAllUsers}
                      className="visibility-checkbox"
                    />
                    <span className="visibility-checkbox-custom"></span>
                    <span className="visibility-checkbox-text">TÜMÜ</span>
                  </label>
                </div>
                
                {/* Kullanıcı Arama Dropdown */}
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="user-dropdown">
                    {filteredUsers.map(user => {
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
                        <div className="user-option-info">
                          <div className="user-option-name">{user.name}</div>
                          <div className="user-option-email">{user.email}</div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Seçilen Kullanıcılar */}
            {((formData.visibleToUsers && formData.visibleToUsers.length > 0) || formData.visibleToAll) && (
              <div className="selected-users-section">
                <div className="selected-users-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#FF6B35" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="#FF6B35" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#FF6B35" strokeWidth="2"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#FF6B35" strokeWidth="2"/>
                  </svg>
                  <span>
                    {formData.visibleToAll 
                      ? 'TÜM KULLANICILARA GÖRÜNÜR' 
                      : `SEÇİLEN KULLANICILAR (${formData.visibleToUsers ? formData.visibleToUsers.length : 0})`
                    }
                  </span>
                </div>
                
                {/* TÜMÜ seçiliyse bilgi mesajı göster */}
                {formData.visibleToAll ? (
                  <div className="all-users-info">
                    <div className="all-users-message">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#10B981"/>
                        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Bu randevu sistemdeki tüm kullanıcıların takviminde görünecektir.</span>
                    </div>
                  </div>
                ) : (
                  /* Bireysel seçilen kullanıcıları göster */
                  <div className="selected-users-list">
                    {formData.visibleToUsers && formData.visibleToUsers.map(user => (
                      <div key={user.id} className="selected-user-item">
                        <div className="selected-user-avatar">
                          <div className="avatar-circle-selected">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2"/>
                              <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                            </svg>
                          </div>
                        </div>
                        <div className="selected-user-info">
                          <span className="selected-user-name">{user.name}</span>
                          <span className="selected-user-email">{user.email}</span>
                        </div>
                        <button 
                          type="button"
                          className="remove-user-btn"
                          onClick={() => handleUserRemove(user.id)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Çakışma uyarısı */}
          {isCheckingConflict && (
            <div className="conflict-checking">
              <span>Çakışma kontrolü yapılıyor...</span>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="conflict-warning">
              <div className="conflict-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Randevu Çakışması!</span>
              </div>
              <p>Bu saatte aşağıdaki randevularınız bulunmaktadır:</p>
              <ul>
                {conflicts.map((conflict, index) => (
                  <li key={index}>
                    <strong>{conflict.title}</strong> - {conflict.startTime} / {conflict.endTime}
                  </li>
                ))}
              </ul>
              <p>Lütfen farklı bir saat seçiniz.</p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              İPTAL ET
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={conflicts.length > 0 || isCheckingConflict}
            >
              KAYDET
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Add Contact Modal */}
    <AddContactModal
      show={showAddContactModal}
      onHide={handleCloseAddContactModal}
      onContactAdded={handleContactAdded}
    />
  </>
  );
};

export default AddAppointmentModal;