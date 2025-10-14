import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import chatService from '../../services/chatService';
import { getAvatarUrl } from '../../services/profileService';
import './FloatingChat.css';

const FloatingChat = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [chatRooms, setChatRooms] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Component mount olduğunda unread count'ları temizle
  useEffect(() => {
    setUnreadCounts({});
  }, []);

  // Messaging paneline git
  const handleMessagingClick = () => {
    navigate('/messaging-panel');
  };

  // Belirli bir chat ile messaging paneline git
  const handleChatClick = (roomId) => {
    navigate(`/messaging-panel?roomId=${roomId}`);
  };

  // Chat odalarını yükle
  const loadChatRooms = async () => {
    if (!user || !accessToken) return;
    
    try {
      const response = await chatService.getChatRooms(accessToken);
      
      if (response.success) {
        // Backend'den gelen veriyi frontend formatına çevir
        const mappedRooms = response.data.map(room => ({
          ...room,
          id: room.room_id, // Backend room_id'yi frontend id'ye map et
          name: room.display_name,
          avatar: room.display_avatar,
          last_message_at: room.last_message_time
        }));
        
        // Son mesaj tarihine göre sırala
        const sortedRooms = mappedRooms.sort((a, b) => {
          return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
        });
        
        // En fazla 5 oda göster
        const topRooms = sortedRooms.slice(0, 5);
        setChatRooms(topRooms);
        
        // Unread count'ları güncelle - SADECE gösterilen odalar için
        const counts = {};
        topRooms.forEach(room => {
          if (room.unread_count && room.unread_count > 0) {
            counts[room.id] = room.unread_count;
          }
        });
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Chat odaları yüklenirken hata:', error);
    }
  };

  // Chat room'un diğer katılımcısının online durumunu kontrol et
  const isRoomOnline = (room) => {
    // Backend'den gelen is_online bilgisini kullan
    return room.is_online || false;
  };

  // Chat room'un görünen adını al
  const getRoomDisplayName = (room) => {
    // Backend'den gelen display_name'i kullan
    return room.name || room.display_name || 'Bilinmeyen Kullanıcı';
  };

  // Chat room'un avatar'ını al
  const getRoomAvatar = (room) => {
    // Backend'den gelen display_avatar'ı kullan
    if (room.avatar) {
      // Eğer avatar tam URL değilse profileService'deki getAvatarUrl kullan
      if (room.avatar.startsWith('http')) {
        return room.avatar;
      } else {
        return getAvatarUrl(room.avatar);
      }
    }
    
    // Fallback olarak default avatar
    return "/assets/images/logo.png";
  };



  // Başlangıçta chat odalarını yükle
  useEffect(() => {
    loadChatRooms();
  }, [user, accessToken]);

  // Socket event listener'ları
  useEffect(() => {
    if (socket && isConnected && user) {
      // Chat açıldığında unread count'u sıfırla ve mesajları okundu olarak işaretle
      const handleChatOpened = async (event) => {
        const { roomId } = event.detail;
        setUnreadCounts(prev => ({
          ...prev,
          [roomId]: 0
        }));
        
        // Mesajları okundu olarak işaretle
        try {
          await chatService.markMessagesAsRead(accessToken, roomId);
        } catch (error) {
          console.error('Mesajları okundu olarak işaretlerken hata:', error);
        }
      };
      
      // Chat listesi güncelleme
      const handleChatListUpdate = () => {
        console.log('FloatingChat: Chat listesi güncelleniyor...');
        loadChatRooms();
      };
      
      // Yeni mesaj geldiğinde sıralamayı güncelle
      const handleNewMessage = async (data) => {
        console.log('Yeni mesaj alındı:', data);
        
        const { room_id, sender_id } = data;
        
        setChatRooms(prev => {
          const updatedRooms = prev.map(room => {
            if (room.id === room_id) {
              return { 
                ...room, 
                last_message_at: new Date().toISOString(),
                last_message: data.content || data.message
              };
            }
            return room;
          });
          
          // Yeniden sırala: Son mesaj tarihine göre
          return updatedRooms.sort((a, b) => {
            return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
          });
        });
        
        // Eğer mesaj başkasından geliyorsa unread count'u artır
        if (sender_id && sender_id !== user.id) {
          // Sadece gösterilen odalar için unread count güncelle
          const isRoomDisplayed = chatRooms.some(room => room.id === room_id);
          
          if (isRoomDisplayed) {
            // MessagingPanel'de aktif chat kontrol et
            const currentPath = window.location.pathname;
            const isMessagingPanelOpen = currentPath === '/messaging-panel';
            
            // Eğer MessagingPanel açık ve bu chat aktifse mesajları okundu olarak işaretle
            if (isMessagingPanelOpen) {
              // Aktif chat'i localStorage'dan kontrol et
              const selectedRoomId = localStorage.getItem('selectedRoomId');
              
              // Sadece aktif chat'teki mesajları okundu işaretle
              if (selectedRoomId && parseInt(selectedRoomId) === room_id) {
                try {
                  console.log('Aktif chat mesajları okundu olarak işaretleniyor:', room_id);
                  await chatService.markMessagesAsRead(accessToken, room_id);
                  // Okunmamış sayacı sıfırla
                  setUnreadCounts(prev => ({
                    ...prev,
                    [room_id]: 0
                  }));
                } catch (error) {
                  console.error('Mesajları okundu olarak işaretlerken hata:', error);
                  // Hata durumunda sayacı artır
                  console.log('Okunmamış sayacı artırılıyor:', room_id);
                  setUnreadCounts(prev => ({
                    ...prev,
                    [room_id]: (prev[room_id] || 0) + 1
                  }));
                }
              } else {
                // Aktif chat değilse sayacı artır
                console.log('Aktif chat değil, okunmamış sayacı artırılıyor:', room_id);
                setUnreadCounts(prev => ({
                  ...prev,
                  [room_id]: (prev[room_id] || 0) + 1
                }));
              }
            } else {
              // MessagingPanel açık değilse sayacı artır
              console.log('MessagingPanel açık değil, okunmamış sayacı artırılıyor:', room_id);
              setUnreadCounts(prev => ({
                ...prev,
                [room_id]: (prev[room_id] || 0) + 1
              }));
            }
          }
        }
      };

      // Mesaj okundu durumu güncellemesi
      const handleMessageRead = (data) => {
        const { room_id, user_id } = data;
        
        // Sadece gösterilen odalar için unread count'u sıfırla
        const isRoomDisplayed = chatRooms.some(room => room.id === room_id);
        
        if (isRoomDisplayed) {
          setUnreadCounts(prev => ({
            ...prev,
            [room_id]: 0
          }));
        }
      };

      // Room güncelleme
      const handleRoomUpdate = (data) => {
        setChatRooms(prev => prev.map(room => 
          room.id === data.room_id ? { ...room, ...data.updates } : room
        ));
      };
      
      socket.on('new-message', handleNewMessage);
      socket.on('message-read', handleMessageRead);
      socket.on('room-update', handleRoomUpdate);
      socket.on('chat-list-update', handleChatListUpdate);
      
      // Custom event listener'ı ekle
      window.addEventListener('chatOpened', handleChatOpened);
      
      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('message-read', handleMessageRead);
        socket.off('room-update', handleRoomUpdate);
        socket.off('chat-list-update', handleChatListUpdate);
        window.removeEventListener('chatOpened', handleChatOpened);
      };
    }
  }, [socket, isConnected, user, accessToken]);

  return (
    <div className="floating-chat">
      {/* Messaging başlığı */}
      <div className="messaging-title" onClick={handleMessagingClick}>
        MESAJLAŞMA
      </div>

      {/* Chat Avatarları */}
      <div className="chat-avatars">
        {chatRooms.slice(0, 7).map((room, index) => (
          <div 
            key={`chat-${room.id}-${index}`}
            className="chat-avatar"
            onClick={() => handleChatClick(room.id)}
            title={getRoomDisplayName(room)}
          >
            <img 
              src={getRoomAvatar(room)} 
              alt={getRoomDisplayName(room)}
              onError={(e) => {
                e.target.src = "/assets/images/logo.png";
              }}
            />
            <div className={`online-status ${isRoomOnline(room) ? 'online' : 'offline'}`}></div>
            
            {/* Okunmamış mesaj sayısı */}
            {unreadCounts[room.id] && unreadCounts[room.id] > 0 && (
              <div className="unread-badge">
                {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloatingChat;