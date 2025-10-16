import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import Calendar from '../../components/Calendar/Calendar';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import chatService from '../../services/chatService';
import { getAvatarUrl } from '../../services/profileService';
import './MessagingPanel.css';
import './ContactsPanel.css';

const MessagingPanel = () => {
  const { user, logout, accessToken } = useAuth();
  const { socket, isConnected, onMessage, onChatListUpdate, joinRoom, leaveRoom } = useSocket();
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  const [searchParams] = useSearchParams();
  
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // Her chat için okunmamış mesaj sayısı
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatPanelRef = useRef(null);

  // Bildirim göster
  const showNotification = (title, body, icon) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: icon || '/assets/images/logo.png',
        badge: '/assets/images/logo.png',
        tag: 'message-notification',
        requireInteraction: false,
        silent: false
      });

      // 5 saniye sonra bildirimi kapat
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Bildirime tıklandığında pencereyi öne getir
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Kullanıcı listesini yükle
  const loadAvailableUsers = async () => {
    try {
      const response = await chatService.getAllUsers(accessToken);
      if (response.success) {
        // Eğer data nested array ise flatten et
        const users = Array.isArray(response.data) && Array.isArray(response.data[0]) 
          ? response.data.flat() 
          : response.data;
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Kullanıcıları yüklerken hata:', error);
      showError('Kullanıcılar yüklenirken bir hata oluştu');
    }
  };

  // Yeni chat başlat
  const startNewChat = async (targetUser) => {
    try {
      setShowUserDropdown(false);
      
      // Kullanıcının kendi kendisiyle chat oluşturmasını engelle
      if (targetUser.id === user.id) {
      showError('Kendinizle sohbet oluşturamazsınız');
      return;
    }
      
      // Direct chat oluştur veya mevcut olanı getir
      const response = await chatService.createOrGetDirectChat(accessToken, targetUser.id);
      console.log('Backend response:', response);
      if (response.success) {
        const roomData = response.data;
        console.log('Room data:', roomData);
        
        // room_id kontrolü
        if (!roomData || !roomData.room_id) {
          console.error('Backend\'den geçersiz room_id geldi:', roomData);
          showError('Sohbet odası oluşturulamadı');
          return;
        }
        
        // Backend'den gelen room_id'yi id olarak dönüştür
        const room = {
          id: roomData.room_id,
          type: 'direct',
          name: targetUser.name,
          avatar: targetUser.avatar,
          other_user: targetUser
        };
        console.log('Created room object:', room);
        
        // Yeni room'u chat listesine ekle (eğer yoksa)
        setChatRooms(prev => {
          const exists = prev.find(r => r.id === room.id);
          if (!exists) {
            return [room, ...prev];
          }
          return prev;
        });
        
        // Room'u seç
        await handleRoomSelect(room);
      }
      
    } catch (error) {
      console.error('Yeni chat başlatırken hata:', error);
      showError('Yeni sohbet başlatılamadı: ' + error.message);
    }
  };



  // Basit chat işlemleri (şimdilik sadece placeholder)
  const hideChat = async (contactId) => {
    console.log('Chat gizleme özelliği gelecekte eklenecek');
  };

  const deleteChatMessages = async (contactId) => {
    console.log('Mesaj silme özelliği gelecekte eklenecek');
  };

  const toggleMuteChat = async (contactId) => {
    console.log('Chat susturma özelliği gelecekte eklenecek');
  };

  const togglePinChat = async (roomId, isPinned) => {
    try {
      const response = await chatService.pinChat(accessToken, roomId, isPinned);
      if (response.success) {
        // Chat listesini güncelle
        setChatRooms(prev => prev.map(room => 
          room.id === roomId ? { ...room, is_pinned: isPinned } : room
        ));
        
        // Seçili room'u da güncelle (real-time buton metni için)
        setSelectedRoom(prev => {
          if (prev && prev.id === roomId) {
            return { ...prev, is_pinned: isPinned };
          }
          return prev;
        });
        
        // Chat listesini yeniden sırala (sabitlenmiş chatler üstte)
        setChatRooms(prev => [...prev].sort((a, b) => {
          // Önce sabitlenmiş chatler
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          
          // Sonra son mesaj zamanına göre
          const aTime = new Date(a.last_message_time || a.created_at);
          const bTime = new Date(b.last_message_time || b.created_at);
          return bTime - aTime;
        }));
        
        console.log(isPinned ? 'Chat başa sabitlendi' : 'Chat sabitleme kaldırıldı');
      }
    } catch (error) {
      console.error('Chat sabitleme hatası:', error);
      showError('Chat sabitleme işlemi başarısız oldu');
    }
  };

  const handlePinChat = async (roomId) => {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      await togglePinChat(roomId, !room.is_pinned);
    }
  };

  // Chat odalarını yükle
  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const response = await chatService.getChatRooms(accessToken);
      if (response.success) {
        const rawRooms = response.data || [];
        // Backend response'unu frontend'in beklediği formata map et
        const rooms = rawRooms.map(room => {
          // Direct chat için diğer kullanıcının department bilgisini al
          let department = room.description;
          if (room.room_type === 'direct' && room.participants && room.participants.length > 0) {
            const otherUser = room.participants.find(p => p.user_id !== user.id);
            if (otherUser && otherUser.department) {
              department = otherUser.department;
            }
          }
          
          return {
            id: room.room_id,
            name: room.display_name,
            avatar: room.display_avatar,
            type: room.room_type,
            description: room.description,
            department: department,
            is_online: room.is_online || 0,
            unread_count: room.unread_count || 0,
            last_message: room.last_message,
            last_message_time: room.last_message_time,
            last_sender_name: room.last_sender_name,
            is_pinned: room.is_pinned,
            is_muted: room.is_muted,
            is_archived: room.is_archived,
            custom_name: room.custom_name,
            created_at: room.room_created_at,
            participants: room.participants || []
          };
        });
        setChatRooms(rooms);
        
        // URL parametresinden roomId kontrolü
        const roomId = searchParams.get('roomId');
        const userId = searchParams.get('userId'); // Backward compatibility
        
        if (roomId && !selectedRoom) {
          const targetRoom = rooms.find(room => room.id === parseInt(roomId));
          if (targetRoom) {
            await handleRoomSelect(targetRoom);
            return;
          }
        } else if (userId && !selectedRoom) {
          // Backward compatibility: userId ile direct chat bul
          const targetRoom = rooms.find(room => 
            room.type === 'direct' && 
            room.participants?.some(p => p.user_id === parseInt(userId) && p.user_id !== user.id)
          );
          if (targetRoom) {
            await handleRoomSelect(targetRoom);
            return;
          } else {
            // Kullanıcı ile yeni chat başlat
            try {
              const usersResponse = await chatService.getAllUsers(accessToken);
              if (usersResponse.success) {
                const targetUser = usersResponse.data.find(u => u.id === parseInt(userId));
                if (targetUser) {
                  await startNewChat(targetUser);
                  return;
                }
              }
            } catch (error) {
              console.error('Kullanıcı bulunamadı:', error);
            }
          }
        }
        
        // Seçili oda kontrolü (varsa koru, yoksa ilkini seç)
        if (!selectedRoom && rooms.length > 0 && rooms[0].id) {
          setSelectedRoom(rooms[0]);
          await loadMessages(rooms[0].id, false);
          localStorage.setItem('selectedRoomId', rooms[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Chat odalarını yüklerken hata:', error);
      showError('Chat odaları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Seçili odanın mesajlarını yükle
  const loadMessages = async (roomId, markAsRead = false) => {
    if (!roomId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    
    try {
      setLoadingMessages(true);
      setMessages([]);
      
      const response = await chatService.getMessages(accessToken, roomId, 1, 50);
      if (response.success) {
        setMessages(response.data || []);
        
        // Mesajları okundu olarak işaretle
        if (markAsRead) {
          await chatService.markMessagesAsRead(accessToken, roomId);
        }
        
        // Chat açıldığında hemen en alta scroll et
        setTimeout(() => {
          scrollToBottom(false);
        }, 50);
        setTimeout(() => {
          scrollToBottom(false);
        }, 200);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Mesajları yüklerken hata:', error);
      showError('Mesajlar yüklenirken bir hata oluştu');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Mesaj gönder
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedRoom) {
      console.log('Mesaj gönderme engellendi:', { 
        hasMessage: !!newMessage.trim(), 
        hasRoom: !!selectedRoom,
        roomId: selectedRoom?.id 
      });
      return;
    }

    const messageText = newMessage.trim();
    
    console.log('Mesaj gönderiliyor:', { 
      roomId: selectedRoom.id, 
      message: messageText
    });
    
    setNewMessage('');

    try {
      const response = await chatService.sendMessage(accessToken, selectedRoom.id, messageText);

      if (response.success) {
        console.log('Mesaj başarıyla gönderildi:', response.data);
        
        // Mesaj gönderildikten sonra scroll'u en alta getir
        setTimeout(() => {
          scrollToBottom(true);
        }, 100);
        
      } else {
        console.error('Mesaj gönderme başarısız:', response);
        showError('Mesaj gönderilemedi');
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      showError('Mesaj gönderilemedi: ' + error.message);
    }
  };

  // Dosya seç
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && selectedRoom) {
      handleFileUpload(file);
    }
  };

  // Dosya yükle
  const handleFileUpload = async (file) => {
    if (!selectedRoom || !file) {
      return;
    }

    setUploading(true);
    
    try {
      const response = await chatService.sendFileMessage(accessToken, selectedRoom.id, file);
      
      if (response.success) {
        console.log('Dosya başarıyla gönderildi:', response.data);
        
        // Mesaj gönderildikten sonra scroll'u en alta getir
        setTimeout(() => {
          scrollToBottom(true);
        }, 100);
        
      } else {
        showError('Dosya gönderilemedi: ' + response.message);
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      showError('Dosya gönderilemedi: ' + error.message);
    } finally {
      setUploading(false);
      // File input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };



  // Tüm mesajları sil
  const handleDeleteAllMessages = async (roomId) => {
    if (!window.confirm('Tüm mesajları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const response = await chatService.deleteAllMessages(accessToken, roomId);
      
      if (response.success) {
        // Chat listesinden bu chat'i kaldır
        setChatRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
        
        // Eğer silinen chat seçili ise, seçimi temizle
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
          setMessages([]);
        }
        
        setShowChatMenu(false);
        console.log('Chat başarıyla silindi');
      } else {
        console.error('Chat silme hatası:', response.message);
        showError('Chat silinemedi: ' + response.message);
      }
    } catch (error) {
      console.error('Chat silme hatası:', error);
      showError('Chat silinemedi. Lütfen tekrar deneyin.');
    }
  };

  // Dosya seçme butonuna tıkla
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Drag & Drop event handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedRoom && isConnected) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Sadece chat panel'den tamamen çıkıldığında drag over'ı kapat
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (!selectedRoom || !isConnected) {
      showWarning('Dosya göndermek için bir sohbet odası seçin');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      return;
    }

    // İlk dosyayı al (tek dosya upload)
    const file = files[0];
    
    // Dosya tipini kontrol et
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      showWarning('Desteklenmeyen dosya türü. Lütfen resim, PDF, Excel, Word, PowerPoint, metin veya arşiv dosyası seçin.');
      return;
    }

    handleFileUpload(file);
  };

  // Odayı seç
  const handleRoomSelect = async (room) => {
    try {
      // Room ID kontrolü
      if (!room || !room.id) {
        console.error('Geçersiz room objesi:', room);
        showError('Geçersiz sohbet odası');
        return;
      }

      // Aynı oda seçilmişse işlem yapma
      if (selectedRoom && selectedRoom.id === room.id) {
        return;
      }

      // Eski odadan ayrıl
      if (selectedRoom && selectedRoom.id !== room.id) {
        await leaveRoom(selectedRoom.id);
      }
      
      // Önce mesajları temizle
      setMessages([]);
      setLoadingMessages(true);
      
      // Yeni odayı seç
      setSelectedRoom(room);
      
      // Seçili oda ID'sini localStorage'a kaydet
      localStorage.setItem('selectedRoomId', room.id.toString());
      
      // Bu chat için okunmamış sayacı sıfırla
      setUnreadCounts(prev => ({
        ...prev,
        [room.id]: 0
      }));

      // FloatingChat'e chat açıldığını bildir
      window.dispatchEvent(new CustomEvent('chatOpened', {
        detail: { roomId: room.id }
      }));
      
      // Mesajları yükle ve okundu olarak işaretle
      await loadMessages(room.id, true); // markAsRead=true
      
      // Yeni odaya katıl
      await joinRoom(room.id);
      
      // Chat açıldıktan sonra scroll'u en alta getir
      setTimeout(() => {
        scrollToBottom(false); // Instant scroll
      }, 100);
      
    } catch (error) {
      console.error('Oda seçerken hata:', error);
      showError('Sohbet açılamadı');
      setLoadingMessages(false);
    }
  };

  // Mesajları en alta kaydır
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant',
        block: 'nearest'
      });
    }
  };

  // Mesaj zamanını formatla
  const formatMessageTime = (timestamp) => {
    if (!timestamp) {
      return '';
    }
    
    // MySQL datetime formatı: "2024-01-15 14:30:00"
    // Backend'den gelen saat zaten Türkiye saati (UTC+3) olarak kaydedildi
    // String'i direkt parse et, timezone dönüşümü yapma
    const date = new Date(timestamp.replace(' ', 'T')); // MySQL formatını ISO formatına çevir
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Dosya URL'sini oluştur
  const getFileUrl = (fileUrl) => {
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api', '');
    return `${baseUrl}${fileUrl}`;
  };

  // Resim zoom fonksiyonları
  const openImageZoom = (imageUrl, fileName) => {
    setZoomedImage({ url: imageUrl, name: fileName });
  };

  const closeImageZoom = () => {
    setZoomedImage(null);
  };

  // ESC tuşu ile zoom kapatma
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && zoomedImage) {
        closeImageZoom();
      }
    };

    if (zoomedImage) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden'; // Scroll'u engelle
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [zoomedImage]);

  // Dosya indirme fonksiyonu
  const downloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Blob URL oluştur
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Temporary link oluştur ve tıkla
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Temizle
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Dosya indirirken hata:', error);
      showWarning('Dosya indirilemedi, yeni sekmede açılıyor');
      // Fallback: Yeni sekmede aç
      window.open(fileUrl, '_blank');
    }
  };

  // Filtrelenmiş odalar
  const filteredRooms = chatRooms.filter(room => {
    const roomName = room.name || '';
    
    const searchTermLower = searchTerm.toLowerCase();
    const roomNameMatch = roomName && roomName.toLowerCase().includes(searchTermLower);
    const messageMatch = room.last_message && room.last_message.toLowerCase().includes(searchTermLower);
    
    return roomNameMatch || messageMatch;
  });

  // Component mount edildiğinde
  useEffect(() => {
    loadChatRooms();
    loadAvailableUsers(); // Kullanıcıları yükle
    
    // Bildirim izni iste
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Bildirim izni:', permission);
      });
    }
    
    // Component unmount olduğunda selectedRoomId'yi temizle
    return () => {
      localStorage.removeItem('selectedRoomId');
    };
  }, []);

  // WebSocket olayları dinleyicisi
  useEffect(() => {
    if (socket && isConnected) {
      // Yeni mesaj dinleyicisi
      const unsubscribeMessage = onMessage ? 
        onMessage(async (message) => {
        console.log('Yeni mesaj alındı:', message);
        
        // Aktif sohbetteki mesajları göster
        if (selectedRoom && message.room_id === selectedRoom.id) {
          setMessages(prev => {
            // Aynı mesajın tekrar eklenmesini önle
            const exists = prev.find(m => m.id === message.id);
            if (exists) return prev;
            
            return [...prev, message];
          });
          
          // Yeni mesaj geldiğinde smooth scroll
          setTimeout(() => {
            scrollToBottom(true);
          }, 50);
          
          // Eğer mesaj başkasından geliyorsa ve aktif chat'teyse okundu olarak işaretle
          if (message.sender_id !== user.id) {
            try {
              await chatService.markMessagesAsRead(accessToken, selectedRoom.id);
            } catch (error) {
              console.error('Mesajları okundu olarak işaretlerken hata:', error);
            }
          }
        }
        
        // Eğer mesaj başkasından geliyorsa bildirim göster ve sayacı artır
        if (message.sender_id !== user.id) {
          // Sayfa aktif değilse veya farklı chat açıksa bildirim göster
          if (document.hidden || !selectedRoom || selectedRoom.id !== message.room_id) {
            showNotification(
              `${message.sender_name} - Yeni Mesaj`,
              message.content,
              message.sender_avatar
            );
          }
          
          // Eğer mesaj seçili olmayan bir chat'ten geliyorsa sayacı artır
          if (!selectedRoom || selectedRoom.id !== message.room_id) {
            setUnreadCounts(prev => ({
              ...prev,
              [message.room_id]: (prev[message.room_id] || 0) + 1
            }));
          } else {
            // Aktif chat'te mesaj geldiğinde sayacı sıfırla
            setUnreadCounts(prev => ({
              ...prev,
              [message.room_id]: 0
            }));
          }
        }
        
        // Chat rooms listesini güncelle (son mesaj için)
        setChatRooms(prev => prev.map(room => {
          if (room.id === message.room_id) {
            // Aktif chat'te mesaj geldiğinde unread_count'u sıfırla
            const unreadCount = (selectedRoom && selectedRoom.id === message.room_id && message.sender_id !== user.id) ? 0 : room.unread_count;
            
            return {
              ...room,
              last_message: message.content,
              last_message_at: message.created_at,
              unread_count: unreadCount
            };
          }
          return room;
        }));
      }) : () => {};

      // Chat listesi güncelleme dinleyicisi
      const unsubscribeChatList = onChatListUpdate ? 
        onChatListUpdate(() => {
          console.log('Chat listesi güncelleniyor...');
          loadChatRooms(); // Chat listesini yeniden yükle
        }) : () => {};

      return () => {
        if (typeof unsubscribeMessage === 'function') unsubscribeMessage();
        if (typeof unsubscribeChatList === 'function') unsubscribeChatList();
      };
    }
  }, [socket, isConnected, onMessage, onChatListUpdate, selectedRoom, user.id]);

  // Kullanıcı online/offline durumu dinleyicisi
  useEffect(() => {
    if (socket && isConnected) {
      const handleUserOnline = (data) => {
        console.log('🟢 Kullanıcı online oldu (MessagingPanel):', data);
        const userId = parseInt(data.userId);
        
        // Available users listesini güncelle
        setAvailableUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, is_online: true, last_seen: data.last_seen } : user
        ));
        
        // Chat rooms'taki participants bilgisini güncelle
        setChatRooms(prev => prev.map(room => {
          if (room.participants && room.participants.length > 0) {
            const updatedParticipants = room.participants.map(participant =>
              participant.user_id === userId ? { ...participant, is_online: true, last_seen: data.last_seen } : participant
            );
            
            // Direct chat ise ve bu kullanıcı diğer participant ise room'un is_online durumunu güncelle
            let updatedRoom = { ...room, participants: updatedParticipants };
            if (room.type === 'direct') {
              const otherParticipant = room.participants.find(p => p.user_id !== user.id);
              if (otherParticipant && otherParticipant.user_id === userId) {
                updatedRoom.is_online = true;
              }
            }
            
            return updatedRoom;
          }
          return room;
        }));
        
        // Seçili odayı da güncelle
        setSelectedRoom(prev => {
          if (prev && prev.participants && prev.participants.length > 0) {
            const updatedParticipants = prev.participants.map(participant =>
              participant.user_id === userId ? { ...participant, is_online: true, last_seen: data.last_seen } : participant
            );
            return { ...prev, participants: updatedParticipants };
          }
          return prev;
        });
      };

      const handleUserOffline = (data) => {
        console.log('🔴 Kullanıcı offline oldu (MessagingPanel):', data);
        const userId = parseInt(data.userId);
        
        // Available users listesini güncelle
        setAvailableUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, is_online: false, last_seen: data.last_seen } : user
        ));
        
        // Chat rooms'taki participants bilgisini güncelle
        setChatRooms(prev => prev.map(room => {
          if (room.participants && room.participants.length > 0) {
            const updatedParticipants = room.participants.map(participant =>
              participant.user_id === userId ? { ...participant, is_online: false, last_seen: data.last_seen } : participant
            );
            
            // Direct chat ise ve bu kullanıcı diğer participant ise room'un is_online durumunu güncelle
            let updatedRoom = { ...room, participants: updatedParticipants };
            if (room.type === 'direct') {
              const otherParticipant = room.participants.find(p => p.user_id !== user.id);
              if (otherParticipant && otherParticipant.user_id === userId) {
                updatedRoom.is_online = false;
              }
            }
            
            return updatedRoom;
          }
          return room;
        }));
        
        // Seçili odayı da güncelle
        setSelectedRoom(prev => {
          if (prev && prev.participants && prev.participants.length > 0) {
            const updatedParticipants = prev.participants.map(participant =>
              participant.user_id === userId ? { ...participant, is_online: false, last_seen: data.last_seen } : participant
            );
            return { ...prev, participants: updatedParticipants };
          }
          return prev;
        });
      };

      console.log('🔗 Socket event listener\'ları kuruluyor...');
      socket.on('user-online', handleUserOnline);
      socket.on('user-offline', handleUserOffline);

      return () => {
        console.log('🔌 Socket event listener\'ları kaldırılıyor...');
        socket.off('user-online', handleUserOnline);
        socket.off('user-offline', handleUserOffline);
      };
    }
  }, [socket, isConnected]);

  // Mesajlar değiştiğinde en alta kaydır
  useEffect(() => {
    if (messages.length > 0) {
      // İlk yüklenmede hızlı scroll, sonrasında smooth
      const isInitialLoad = messages.length > 5; // Çok mesaj varsa ilk yükleme
      setTimeout(() => {
        scrollToBottom(!isInitialLoad); // İlk yüklemede instant, sonra smooth
      }, 100);
    }
  }, [messages]);

  // Sayfa yüklendiğinde chat kısmına scroll
  useEffect(() => {
    const messagingPanel = document.querySelector('.messaging-panel');
    if (messagingPanel) {
      setTimeout(() => {
        messagingPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, []);

  // Dışarıya tıklandığında menüleri kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      // User dropdown'u da kapat
      if (!event.target.closest('.user-search-container')) {
        setShowUserDropdown(false);
      }
      
      // Chat menu'yu da kapat
      if (!event.target.closest('.chat-action-btn') && !event.target.closest('.chat-menu')) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Seçili oda değiştiğinde mesajları okundu olarak işaretle
  useEffect(() => {
    const markMessagesAsReadDelayed = async () => {
      if (selectedRoom && selectedRoom.id && accessToken && messages.length > 0) {
        try {
          // Biraz bekle ki mesajlar yüklensin
          setTimeout(async () => {
            await chatService.markMessagesAsRead(accessToken, selectedRoom.id);
            console.log('Mesajlar okundu olarak işaretlendi:', selectedRoom.id);
            
            // Unread count'u sıfırla
            setUnreadCounts(prev => ({
              ...prev,
              [selectedRoom.id]: 0
            }));
            
            // Chat rooms listesindeki unread count'u da güncelle
            setChatRooms(prev => prev.map(room => 
              room.id === selectedRoom.id 
                ? { ...room, unread_count: 0 }
                : room
            ));
          }, 500);
        } catch (error) {
          console.error('Mesajları okundu işaretlerken hata:', error);
        }
      }
    };

    markMessagesAsReadDelayed();
  }, [selectedRoom?.id, messages.length, accessToken]);

  return (
    <div className="messaging-panel-page">
      <div className="messaging-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Sağ Panel - Mesaj Paneli */}
        <div className="messaging-content">
          <div className="messaging-panel">
              {/* Kişiler Listesi */}
              <div className="messaging-contacts-panel">
                <div className="messaging-contacts-header">
                  <div className="messaging-header-top">
                    <div className="user-search-container">
                      <div className="search-input-wrapper">
                        <input 
                          type="text" 
                          placeholder="Kullanıcı ara..." 
                          className="user-search-input"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onFocus={() => setShowUserDropdown(true)}
                          onBlur={() => {
                            setTimeout(() => setShowUserDropdown(false), 200);
                          }}
                        />
                        <div className="search-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      {showUserDropdown && (
                        <div className="user-search-dropdown">
                          {(() => {
                            const filteredUsers = availableUsers.filter(availableUser => 
                              availableUser.id !== user.id && ( // Kendi kendisini hariç tut
                                availableUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                availableUser.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                availableUser.department?.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                            );
                            
                            if (filteredUsers.length === 0) {
                              return (
                                <div key="no-results" className="dropdown-no-results">
                                  Kullanıcı bulunamadı
                                </div>
                              );
                            }
                            
                            return filteredUsers.slice(0, 8).map((user, index) => (
                              <div
                                key={`user-${user.id || `temp-${index}`}`}
                                className="user-dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  startNewChat(user);
                                  setSearchTerm('');
                                  setShowUserDropdown(false);
                                }}
                              >
                                <div className="user-avatar">
                                  <img 
                                    src={user.avatar ? getAvatarUrl(user.avatar) : "/assets/images/logo.png"} 
                                    alt={user.name}
                                    onError={(e) => e.target.src = "/assets/images/logo.png"}
                                  />
                                </div>
                                <div className="user-info">
                                  <div className="user-name">{user.name}</div>
                                  <div className="user-detail">{user.department || user.email}</div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="messaging-header-bottom">
                    <div className="connection-status-dot">
                      <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
                    </div>
                  </div>
                </div>
                
                <div className="messaging-contacts-list">
                  {loading && chatRooms.length === 0 && (
                    <div className="loading-message">
                      Sohbet odaları yükleniyor...
                    </div>
                  )}
                  {filteredRooms.map((room, index) => {
                    return (
                      <div 
                        key={`room-${room.id}-${index}`} 
                        className={`messaging-contact-item ${selectedRoom?.id === room.id ? 'active' : ''} ${room.is_online ? 'online' : 'offline'}`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="messaging-contact-avatar">
                          <img 
                            src={room.avatar ? getAvatarUrl(room.avatar) : "/assets/images/logo.png"} 
                            alt={room.name}
                            onError={(e) => {
                              e.target.src = "/assets/images/logo.png";
                            }}
                          />
                          <div className={`messaging-online-indicator ${room.is_online ? 'active' : ''}`}></div>
                        </div>
                        <div className="messaging-contact-info">
                          <div className="messaging-contact-name">
                            {room.name}
                            {room.is_pinned && (
                              <svg 
                                width="12" 
                                height="12" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                className="pin-icon"
                                style={{ marginLeft: '5px', color: '#007bff' }}
                              >
                                <path d="M16 4V2C16 1.45 15.55 1 15 1H9C8.45 1 8 1.45 8 2V4H7C6.45 4 6 4.45 6 5S6.45 6 7 6H8V12L6 14V15H10V22H14V15H18V14L16 12V6H17C17.55 6 18 5.55 18 5S17.55 4 17 4H16Z" fill="currentColor"/>
                              </svg>
                            )}
                          </div>
                          <div className="messaging-contact-description">
                            {room.department || room.description || 'Kullanıcı'}
                          </div>
                          {room.last_message_time && (
                            <div className="messaging-contact-time">
                              {formatMessageTime(room.last_message_time)}
                            </div>
                          )}
                        </div>
                        
                        {/* Okunmamış mesaj sayısı */}
                        {room.unread_count > 0 && (
                          <div className="messaging-unread-badge">
                            {room.unread_count > 99 ? '99+' : room.unread_count}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Alanı */}
              <div 
                ref={chatPanelRef}
                className={`chat-panel ${dragOver ? 'drag-over' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {selectedRoom ? (
                  <>
                    {/* Drag Over Overlay */}
                    {dragOver && (
                      <div className="drag-overlay">
                        <div className="drag-overlay-content">
                          <div className="drag-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="#007bff"/>
                            </svg>
                          </div>
                          <div className="drag-text">
                            <h3>Dosyayı buraya bırakın</h3>
                            <p>Resim, PDF, Excel, Word ve diğer dosya türleri desteklenir</p>
                          </div>
                        </div>
                      </div>
                    )}
                
                <div className="chat-header">
                  <div className="chat-contact-info">
                    <div className="chat-avatar">
                      <img 
                            src={selectedRoom.avatar ? getAvatarUrl(selectedRoom.avatar) : "/assets/images/logo.png"} 
                            alt={selectedRoom.name}
                        onError={(e) => {
                          e.target.src = "/assets/images/logo.png";
                        }}
                      />
                      <div className={`online-indicator ${
                        selectedRoom.type === 'direct' 
                          ? selectedRoom.participants?.find(p => p.user_id !== user.id)?.is_online ? 'active' : ''
                          : ''
                      }`}></div>
                    </div>
                    <div className="chat-contact-details">
                      <div className="chat-contact-name">
                        {selectedRoom.type === 'direct' 
                          ? selectedRoom.participants?.find(p => p.user_id !== user.id)?.user_name || 'Bilinmeyen'
                          : selectedRoom.name
                        }
                      </div>
                      <div className="chat-contact-description">
                        {selectedRoom.type === 'direct' ? (
                          selectedRoom.participants?.find(p => p.user_id !== user.id)?.is_online ? (
                            <span style={{ color: '#28a745', fontWeight: '500' }}>Çevrimiçi</span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>
                              {selectedRoom.participants?.find(p => p.user_id !== user.id)?.last_seen ? 
                                `Son görülme: ${formatMessageTime(selectedRoom.participants.find(p => p.user_id !== user.id).last_seen)}` : 
                                'Çevrimdışı'
                              }
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#6c757d' }}>
                            {selectedRoom.participants?.length || 0} üye
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="chat-actions">
                    <Dropdown show={showChatMenu} onToggle={setShowChatMenu} align="end">
                      <Dropdown.Toggle
                        as="button"
                        className="chat-action-btn"
                        onClick={() => setShowChatMenu(!showChatMenu)}
                      >
                      <svg width="4" height="18" viewBox="0 0 4 18" fill="none">
                        <circle cx="2" cy="2" r="2" fill="#6c757d"/>
                        <circle cx="2" cy="9" r="2" fill="#6c757d"/>
                        <circle cx="2" cy="16" r="2" fill="#6c757d"/>
                      </svg>
                      </Dropdown.Toggle>

                      <Dropdown.Menu className="chat-menu">
                        <Dropdown.Item 
                          onClick={() => handlePinChat(selectedRoom.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M16 4V2C16 1.45 15.55 1 15 1H9C8.45 1 8 1.45 8 2V4H7C6.45 4 6 4.45 6 5S6.45 6 7 6H8V12L6 14V15H10V22H14V15H18V14L16 12V6H17C17.55 6 18 5.55 18 5S17.55 4 17 4H16Z" fill="currentColor"/>
                          </svg>
                          {selectedRoom.is_pinned ? 'Sabitlemeyi Kaldır' : 'Başa Sabitle'}
                        </Dropdown.Item>
                        
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={() => handleDeleteAllMessages(selectedRoom.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                          </svg>
                          Tüm Mesajları Sil
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                <div className="chat-messages">
                      {loadingMessages ? (
                        <div className="messages-loading">
                          Mesajlar yükleniyor...
                        </div>
                      ) : (
                        <>
                          {messages.map((message, index) => (
                            <div 
                              key={`${message.id}-${index}`} 
                              className={`message ${message.sender_id === user.id ? 'sent' : 'received'}`}
                            >
                    <div className="message-content">
                                {message.sender_id !== user.id && (
                                  <div className="message-sender">{message.sender_name}</div>
                                )}
                                
                                {/* Mesaj içeriği */}
                                {message.message_type === 'image' && message.file_url ? (
                                  <div className="message-image">
                                    <img 
                                      src={getFileUrl(message.file_url)}
                                      alt={message.file_name}
                                      style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px', cursor: 'pointer' }}
                                      onClick={() => openImageZoom(getFileUrl(message.file_url), message.file_name)}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                      }}
                                    />
                                    <div style={{ display: 'none' }}>
                                      📷 {message.file_name}
                                    </div>
                                    {message.content && message.content !== message.file_name && (
                                      <div className="message-text">{message.content}</div>
                                    )}
                                  </div>
                                ) : message.message_type === 'file' && message.file_url ? (
                                  <div className="message-file">
                                    <div className="file-info">
                                      <div className="file-icon">
                                        {message.file_type?.includes('pdf') ? '📄' :
                                         message.file_type?.includes('excel') || message.file_type?.includes('sheet') ? '📊' :
                                         message.file_type?.includes('word') || message.file_type?.includes('document') ? '📝' :
                                         message.file_type?.includes('powerpoint') || message.file_type?.includes('presentation') ? '📽️' :
                                         message.file_type?.includes('zip') || message.file_type?.includes('rar') ? '🗜️' :
                                         '📎'}
                                      </div>
                                      <div className="file-details">
                                        <div className="file-name">{message.file_name}</div>
                                        <div className="file-size">{message.file_size || 'Bilinmeyen boyut'}</div>
                                      </div>
                                      <button 
                                        className="file-download-btn"
                                        onClick={() => downloadFile(getFileUrl(message.file_url), message.file_name)}
                                      >
                                        ⬇️
                                      </button>
                                    </div>
                                    {message.content && message.content !== message.file_name && (
                                      <div className="message-text">{message.content}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="message-text">{message.content}</div>
                                )}
                                
                                <div className="message-time">
                                  {formatMessageTime(message.created_at)}
                                  {/* Okundu durumu göstergesi */}
                                  {message.sender_id === user.id && (
                                    <span className={`read-status ${message.is_read_by_me ? 'read' : 'unread'}`}>
                                      {message.is_read_by_me ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                    </div>
                  </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                </div>

                <div className="modern-chat-input-container">
                      <form onSubmit={handleSendMessage} className="modern-chat-input-wrapper">
                        <input
                          ref={fileInputRef}
                          type="file"
                          style={{ display: 'none' }}
                          onChange={handleFileSelect}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                        />
                        
                        <div className="input-actions-left">
                          <button 
                            type="button" 
                            className="modern-file-btn"
                            onClick={handleFileButtonClick}
                            disabled={!isConnected || uploading}
                            title="Dosya Ekle"
                          >
                            {uploading ? (
                              <div className="loading-spinner"></div>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor"/>
                              </svg>
                            )}
                          </button>
                        </div>

                        <div className="input-field-container">
                          <textarea 
                            placeholder="Mesaj yazın..." 
                            className="modern-chat-input"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={!isConnected}
                            rows="1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                          />
                          {!isConnected && (
                            <div className="connection-status-indicator">
                              <span>Bağlantı kesildi</span>
                            </div>
                          )}
                        </div>

                        <div className="input-actions-right">
                          <button 
                            type="submit" 
                            className={`modern-send-btn ${newMessage.trim() ? 'active' : ''}`}
                            disabled={!newMessage.trim() || !isConnected}
                            title="Gönder"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="no-chat-selected">
                    <div className="no-chat-message">
                      <h4>Mesajlaşma başlatmak için bir sohbet odası seçin</h4>
                      <p>Sol taraftan bir oda seçerek mesajlaşmaya başlayabilirsiniz.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Resim Zoom Modal */}
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={closeImageZoom}>
          <div className="image-zoom-container">
            <button className="image-zoom-close" onClick={closeImageZoom}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <img 
              src={zoomedImage.url} 
              alt={zoomedImage.name}
              className="image-zoom-img"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="image-zoom-info">
              <span>{zoomedImage.name}</span>
              <button 
                className="image-zoom-download"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFile(zoomedImage.url, zoomedImage.name);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                  İndir
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPanel;