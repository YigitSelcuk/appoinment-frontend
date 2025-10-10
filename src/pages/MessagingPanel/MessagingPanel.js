import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Alert, Dropdown } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import Calendar from '../../components/Calendar/Calendar';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import chatService from '../../services/chatService';
import './MessagingPanel.css';
import './ContactsPanel.css';

const MessagingPanel = () => {
  const { user, logout, accessToken } = useAuth();
  const { socket, isConnected, onMessage, onChatListUpdate, joinRoom, leaveRoom } = useSocket();
  const [searchParams] = useSearchParams();
  
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
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
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Kullanıcıları yüklerken hata:', error);
    }
  };

  // Yeni chat başlat
  const startNewChat = async (targetUser) => {
    try {
      setShowUserDropdown(false);
      
      // Zaten bu kullanıcıyla sohbet var mı kontrol et
      const existingRoom = chatRooms.find(room => room.contact_id === targetUser.id);
      if (existingRoom) {
        // Varolan sohbeti seç
        await handleRoomSelect({
          id: existingRoom.contact_id,
          name: existingRoom.contact_name,
          avatar: existingRoom.contact_avatar,
          is_online: existingRoom.is_online
        });
        return;
      }
      
      // Yeni chat için direkt kullanıcıyı seç (backend'de otomatik oluşacak)
      const newRoom = {
        id: targetUser.id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        is_online: targetUser.is_online
      };
      
      await handleRoomSelect(newRoom);
      
    } catch (error) {
      console.error('Yeni chat başlatırken hata:', error);
      setError('Yeni sohbet başlatılamadı: ' + error.message);
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

  const togglePinChat = async (contactId) => {
    console.log('Chat sabitleme özelliği gelecekte eklenecek');
  };

  // Chat odalarını yükle
  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations(accessToken);
      if (response.success) {
        const rooms = response.data || [];
        setChatRooms(rooms);
        
        // URL parametresinden userId kontrolü
        const userId = searchParams.get('userId');
        if (userId && !selectedRoom) {
          const targetRoom = rooms.find(room => room.contact_id === parseInt(userId));
          if (targetRoom) {
            // URL'den gelen kullanıcı için manual seçim olarak işaretle (mesajları okundu yap)
            await handleRoomSelect({
              id: targetRoom.contact_id,
              name: targetRoom.contact_name,
              avatar: targetRoom.contact_avatar,
              is_online: targetRoom.is_online
            });
            return;
          } else {
            // Kullanıcı mevcut chat odalarında yoksa, kullanıcı listesinden bul ve yeni chat başlat
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
        
        // Seçili oda kontrolü (varsa koru, yoksa ilkini seç) - Otomatik seçim, okundu işaretleme
        if (!selectedRoom && rooms.length > 0) {
          const firstRoom = {
            id: rooms[0].contact_id,
            name: rooms[0].contact_name,
            avatar: rooms[0].contact_avatar,
            is_online: rooms[0].is_online
          };
          setSelectedRoom(firstRoom);
          // Otomatik seçimde mesajları okundu işaretleme
          await loadMessages(firstRoom.id, false);
          // localStorage'a kaydet
          localStorage.setItem('selectedRoomId', firstRoom.id.toString());
        }
      }
    } catch (error) {
      console.error('Chat odalarını yüklerken hata:', error);
      setError('Chat odaları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Seçili odanın mesajlarını yükle (sadece mesajları getir, okundu işaretleme)
  const loadMessages = async (roomId, markAsRead = false) => {
    if (!roomId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    
    try {
      setLoadingMessages(true);
      // Önce mesajları temizle
      setMessages([]);
      
      const response = await chatService.getMessages(accessToken, roomId, 1, 50, markAsRead);
      if (response.success) {
        setMessages(response.data || []);
        // Chat açıldığında hemen en alta scroll et
        setTimeout(() => {
          scrollToBottom(false); // Instant scroll, smooth değil
        }, 50);
        // Biraz daha bekleyip tekrar scroll et (DOM tam yüklendiğinde)
        setTimeout(() => {
          scrollToBottom(false);
        }, 200);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Mesajları yüklerken hata:', error);
      setError('Mesajlar yüklenirken bir hata oluştu');
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
    const wasFirstMessage = !selectedRoom.last_message || selectedRoom.last_message === null;
    
    console.log('Mesaj gönderiliyor:', { 
      roomId: selectedRoom.id, 
      message: messageText, 
      wasFirstMessage 
    });
    
    setNewMessage('');

    try {
      const response = await chatService.sendMessage(accessToken, selectedRoom.id, messageText);

      if (response.success) {
        console.log('Mesaj başarıyla gönderildi:', response.data);
        
        // Eğer bu ilk mesajsa, seçili odayı ve chat listesini güncelle
        if (wasFirstMessage) {
          const updatedRoom = {
            ...selectedRoom,
            last_message: messageText,
            last_message_time: new Date().toISOString()
          };
          
          setSelectedRoom(updatedRoom);
          
          // Chat listesinde de güncelle
          setChatRooms(prev => prev.map(room => 
            room.id === selectedRoom.id ? updatedRoom : room
          ));
        }
        
        // Mesaj gönderildikten sonra scroll'u en alta getir
        setTimeout(() => {
          scrollToBottom(true); // Smooth scroll
        }, 100);
        
      } else {
        console.error('Mesaj gönderme başarısız:', response);
        setError('Mesaj gönderilemedi');
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      setError('Mesaj gönderilemedi: ' + error.message);
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
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', file.name);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat/${selectedRoom.id}/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Dosya gönderilemedi');
      }

      const result = await response.json();
      console.log('Dosya gönderildi:', result);
      
      // Mesajları yeniden yükle
      loadMessages(selectedRoom.id);
      
    } catch (error) {
      console.error('Dosya gönderme hatası:', error);
      alert('Dosya gönderilemedi: ' + error.message);
    } finally {
      setUploading(false);
      // File input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Sohbeti başa sabitle
  const handlePinChat = async (contactId) => {
    try {
      console.log('Sohbet sabitlendi:', contactId);
      // Burada backend'e istek gönderilecek
      // Şimdilik sadece console log
      setShowChatMenu(false);
    } catch (error) {
      console.error('Sohbet sabitleme hatası:', error);
    }
  };

  // Tüm mesajları sil
  const handleDeleteAllMessages = async (contactId) => {
    if (!window.confirm('Tüm mesajları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      console.log('Tüm mesajlar siliniyor:', contactId);
      // Burada backend'e istek gönderilecek
      // Şimdilik sadece console log ve mesajları temizle
      setMessages([]);
      setShowChatMenu(false);
    } catch (error) {
      console.error('Mesaj silme hatası:', error);
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
      alert('Dosya göndermek için bir sohbet odası seçin');
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
      alert('Desteklenmeyen dosya türü. Lütfen resim, PDF, Excel, Word, PowerPoint, metin veya arşiv dosyası seçin.');
      return;
    }

    handleFileUpload(file);
  };

  // Odayı seç
  const handleRoomSelect = async (room) => {
    try {
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
      setError('Sohbet açılamadı');
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
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
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
      // Fallback: Yeni sekmede aç
      window.open(fileUrl, '_blank');
    }
  };

  // Filtrelenmiş odalar
  const filteredRooms = chatRooms.filter(room =>
    room.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.last_message && room.last_message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  // Seçili oda değiştiğinde - Manuel seçim handleRoomSelect ile yapılıyor, otomatik yeniden yükleme yok

  // WebSocket olayları dinleyicisi
  useEffect(() => {
    if (socket && isConnected) {
      // Yeni mesaj dinleyicisi
      const unsubscribeMessage = onMessage ? 
        onMessage(async (message) => {
        console.log('Yeni mesaj alındı:', message);
        
        // Sadece aktif sohbetteki mesajları göster
        if (selectedRoom && 
            (message.sender_id === selectedRoom.id || 
             message.sender_id === user.id)) {
          
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
              await chatService.markAsRead(accessToken, selectedRoom.id);
            } catch (error) {
              console.error('Mesajları okundu olarak işaretlerken hata:', error);
            }
          }
        }
        
        // Eğer mesaj başkasından geliyorsa bildirim göster ve sayacı artır
        if (message.sender_id !== user.id) {
          // Sayfa aktif değilse veya farklı chat açıksa bildirim göster
          if (document.hidden || !selectedRoom || selectedRoom.id !== message.sender_id) {
            showNotification(
              `${message.sender_name} - Yeni Mesaj`,
              message.message,
              message.sender_avatar
            );
          }
          
          // Eğer mesaj seçili olmayan bir chat'ten geliyorsa sayacı artır
          if (!selectedRoom || selectedRoom.id !== message.sender_id) {
            setUnreadCounts(prev => ({
              ...prev,
              [message.sender_id]: (prev[message.sender_id] || 0) + 1
            }));
          } else {
            // Aktif chat'te mesaj geldiğinde sayacı sıfırla
            setUnreadCounts(prev => ({
              ...prev,
              [message.sender_id]: 0
            }));
          }
        }
        
        // Chat rooms listesini güncelle (son mesaj için)
        setChatRooms(prev => prev.map(room => {
          // Mesajın gönderildiği veya alındığı chat room'u güncelle
          const isMyMessage = message.sender_id === user.id;
          const otherUserId = isMyMessage ? message.receiver_id : message.sender_id;
          
          if (room.contact_id === otherUserId) {
            // Aktif chat'te mesaj geldiğinde unread_count'u sıfırla
            const unreadCount = (selectedRoom && selectedRoom.id === otherUserId && message.sender_id !== user.id) ? 0 : room.unread_count;
            
            return {
              ...room,
              last_message: message.message,
              last_message_time: message.created_at,
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

      // Mesaj okundu dinleyicisi
      const unsubscribeMessagesRead = socket.on ? 
        (() => {
          const handler = (data) => {
            console.log('Mesajlar okundu:', data);
            
            // Mesajları okundu olarak işaretle
            setMessages(prev => prev.map(msg => 
              data.messageIds.includes(msg.id) 
                ? { ...msg, is_read_by_me: true }
                : msg
            ));
            
            // Chat rooms'da unread count'ları güncelle
            setChatRooms(prev => prev.map(room => 
              room.contact_id === data.readerId 
                ? { ...room, unread_count: Math.max(0, (room.unread_count || 0) - data.messageIds.length) }
                : room
            ));
            
            // Chat listesini güncelle
            loadChatRooms();
          };
          
          socket.on('messages-read', handler);
          return () => socket.off('messages-read', handler);
        })() 
        : () => {};

      // Online/Offline durumu dinleyicisi
      const unsubscribeUserOnline = socket.on ? 
        (() => {
          const onlineHandler = (data) => {
            console.log('Kullanıcı online:', data);
            setChatRooms(prev => prev.map(room => 
              room.contact_id === data.userId 
                ? { ...room, is_online: true }
                : room
            ));
          };
          
          const offlineHandler = (data) => {
            console.log('Kullanıcı offline:', data);
            setChatRooms(prev => prev.map(room => 
              room.contact_id === data.userId 
                ? { ...room, is_online: false }
                : room
            ));
          };
          
          socket.on('user-online', onlineHandler);
          socket.on('user-offline', offlineHandler);
          
          return () => {
            socket.off('user-online', onlineHandler);
            socket.off('user-offline', offlineHandler);
          };
        })() 
        : () => {};

      return () => {
        if (typeof unsubscribeMessage === 'function') unsubscribeMessage();
        if (typeof unsubscribeChatList === 'function') unsubscribeChatList();
        if (typeof unsubscribeMessagesRead === 'function') unsubscribeMessagesRead();
        if (typeof unsubscribeUserOnline === 'function') unsubscribeUserOnline();
      };
    }
  }, [socket, isConnected, onMessage, onChatListUpdate, selectedRoom, user.id]);



  // Kullanıcı online/offline durumu dinleyicisi
  useEffect(() => {
    if (socket && isConnected) {
      const handleUserOnline = (data) => {
        console.log('Kullanıcı online oldu:', data);
        const userId = parseInt(data.userId);
        setChatRooms(prev => prev.map(room => 
          room.id === userId ? { ...room, is_online: true } : room
        ));
        
        // Seçili oda güncellemesi
        if (selectedRoom && selectedRoom.id === userId) {
          setSelectedRoom(prev => ({ ...prev, is_online: true }));
        }

        // Available users listesini de güncelle
        setAvailableUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, is_online: true } : user
        ));
      };

      const handleUserOffline = (data) => {
        console.log('Kullanıcı offline oldu:', data);
        const userId = parseInt(data.userId);
        setChatRooms(prev => prev.map(room => 
          room.id === userId ? { ...room, is_online: false, last_seen: data.last_seen } : room
        ));
        
        // Seçili oda güncellemesi
        if (selectedRoom && selectedRoom.id === userId) {
          setSelectedRoom(prev => ({ ...prev, is_online: false, last_seen: data.last_seen }));
        }

        // Available users listesini de güncelle
        setAvailableUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, is_online: false, last_seen: data.last_seen } : user
        ));
      };

      socket.on('user-online', handleUserOnline);
      socket.on('user-offline', handleUserOffline);

      return () => {
        socket.off('user-online', handleUserOnline);
        socket.off('user-offline', handleUserOffline);
      };
    }
  }, [socket, isConnected, selectedRoom]);

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
      if (!event.target.closest('.add-user-btn') && !event.target.closest('.user-dropdown-menu')) {
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

  return (
    <div className="messaging-panel-page">
      <div className="messaging-container">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
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
                    <div className="messaging-search-container">
                      <input 
                        type="text" 
                        placeholder="Kullanıcı ara veya mesaj ara" 
                        className="messaging-search-input"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          console.log('Arama terimi:', e.target.value);
                        }}
                        onFocus={() => {
                          if (searchTerm.length > 0) {
                            setShowUserDropdown(true);
                          }
                        }}
                      />
                      
{searchTerm.length > 0 && (
                        <div className="messaging-search-dropdown" style={{
                          position: 'absolute',
                          top: '100%',
                          left: '0',
                          right: '0',
                          background: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          zIndex: 9999,
                          marginTop: '4px',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          {/* Kullanıcı Arama Sonuçları */}
                          {availableUsers.filter(user => 
                            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length > 0 && (
                            <>
                              <div className="dropdown-header">Kullanıcılar</div>
                              {availableUsers
                                .filter(user => 
                                  user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  user.email.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(user => (
                                  <div
                                    key={user.id}
                                    onClick={() => {
                                      console.log('Kullanıcı seçildi:', user);
                                      startNewChat(user);
                                      setSearchTerm('');
                                    }}
                                    className="user-dropdown-item"
                                  >
                                    <div className="user-dropdown-avatar">
                                      <img 
                                        src={user.avatar || "/assets/images/logo.png"} 
                                        alt={user.name}
                                        onError={(e) => {
                                          e.target.src = "/assets/images/logo.png";
                                        }}
                                      />
                                      <div className={`user-online-indicator ${user.is_online ? 'online' : 'offline'}`}></div>
                                    </div>
                                    <div className="user-dropdown-info">
                                      <div className="user-dropdown-name">{user.name}</div>
                                      <div className="user-dropdown-email">{user.department || user.email}</div>
                                    </div>
                                  </div>
                                ))
                              }
                            </>
                          )}
                          
                          {/* Mesaj Arama Sonuçları */}
                          {chatRooms.filter(room => 
                            room.last_message && 
                            room.last_message.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length > 0 && (
                            <>
                              <div className="dropdown-header">Mesajlar</div>
                              {chatRooms
                                .filter(room => 
                                  room.last_message && 
                                  room.last_message.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(room => (
                                  <div
                                    key={`message-${room.contact_id}`}
                                    onClick={() => {
                                      console.log('Mesaj seçildi:', room);
                                      const roomData = {
                                        id: room.contact_id,
                                        name: room.contact_name,
                                        avatar: room.contact_avatar,
                                        is_online: room.is_online
                                      };
                                      handleRoomSelect(roomData);
                                      setSearchTerm('');
                                    }}
                                    className="user-dropdown-item"
                                  >
                                    <div className="user-dropdown-avatar">
                                      <img 
                                        src={room.contact_avatar || "/assets/images/logo.png"} 
                                        alt={room.contact_name}
                                        onError={(e) => {
                                          e.target.src = "/assets/images/logo.png";
                                        }}
                                      />
                                    </div>
                                    <div className="user-dropdown-info">
                                      <div className="user-dropdown-name">{room.contact_name}</div>
                                      <div className="user-dropdown-email" style={{
                                        color: '#666',
                                        fontSize: '12px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {room.last_message.length > 50 
                                          ? room.last_message.substring(0, 50) + '...' 
                                          : room.last_message
                                        }
                                      </div>
                                    </div>
                                  </div>
                                ))
                              }
                            </>
                          )}
                          
                          {/* Sonuç Bulunamadı */}
                          {availableUsers.filter(user => 
                            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 && 
                          chatRooms.filter(room => 
                            room.last_message && 
                            room.last_message.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 && (
                            <div className="dropdown-item disabled">Sonuç bulunamadı</div>
                          )}
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
                    const roomData = {
                      id: room.contact_id,
                      name: room.contact_name,
                      avatar: room.contact_avatar,
                      is_online: room.is_online
                    };
                    
                    return (
                      <div 
                        key={`room-${room.contact_id}-${index}`} 
                        className={`messaging-contact-item ${selectedRoom?.id === room.contact_id ? 'active' : ''} ${room.is_online ? 'online' : 'offline'}`}
                        onClick={() => handleRoomSelect(roomData)}
                      >
                        <div className="messaging-contact-avatar">
                          <img 
                            src={room.contact_avatar || "/assets/images/logo.png"} 
                            alt={room.contact_name}
                            onError={(e) => {
                              e.target.src = "/assets/images/logo.png";
                            }}
                          />
                          <div className={`messaging-online-indicator ${room.is_online ? 'active' : ''}`}></div>
                        </div>
                        <div className="messaging-contact-info">
                          <div className="messaging-contact-name">
                            {room.contact_name}
                          </div>
                          <div className="messaging-contact-description">
                            {room.department || 'Bilgi yok'}
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
                            src={selectedRoom.avatar || "/assets/images/logo.png"} 
                            alt={selectedRoom.name}
                        onError={(e) => {
                          e.target.src = "/assets/images/logo.png";
                        }}
                      />
                      <div className={`online-indicator ${selectedRoom.is_online ? 'active' : ''}`}></div>
                    </div>
                    <div className="chat-contact-details">
                          <div className="chat-contact-name">{selectedRoom.name}</div>
                          <div className="chat-contact-description">
                            {selectedRoom.is_online ? (
                              <span style={{ color: '#28a745', fontWeight: '500' }}>Çevrimiçi</span>
                            ) : (
                              <span style={{ color: '#6c757d' }}>
                                {selectedRoom.last_seen ? 
                                  `Son görülme: ${formatMessageTime(selectedRoom.last_seen)}` : 
                                  'Çevrimdışı'
                                }
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
                          Başa Sabitle
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
                                    {message.message && message.message !== message.file_name && (
                                      <div className="message-text">{message.message}</div>
                                    )}
                                  </div>
                                ) : message.message_type === 'file' && message.file_url ? (
                                  <div className="message-file">
                                    <div className="file-info">
                                      <div className="file-icon">
                                        {message.file_type?.includes('pdf') ? '📄' :
                                         message.file_type?.includes('excel') || message.file_type?.includes('spreadsheet') ? '📊' :
                                         message.file_type?.includes('word') || message.file_type?.includes('document') ? '📝' :
                                         message.file_type?.includes('zip') || message.file_type?.includes('rar') ? '🗜️' :
                                         '📎'}
                                      </div>
                                      <div className="file-details">
                                        <div className="file-name">{message.file_name}</div>
                                        <div className="file-size">
                                          {message.file_size ? (message.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                                        </div>
                                      </div>
                                      <button 
                                        className="file-download"
                                        onClick={() => downloadFile(getFileUrl(message.file_url), message.file_name)}
                                        title="Dosyayı İndir"
                                      >
                                        ⬇️
                                      </button>
                                    </div>
                                    {message.message && message.message !== message.file_name && (
                                      <div className="message-text">{message.message}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="message-text">{message.message}</div>
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