import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import chatService from '../../services/chatService';
import axios from 'axios';
import './FloatingChat.css';

const FloatingChat = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { socket, isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Messaging paneline git
  const handleMessagingClick = () => {
    navigate('/messaging-panel');
  };

  // Chat odalarını yükle
  const loadChatRooms = async () => {
    if (!user || !accessToken) return;
    
    try {
      const response = await chatService.getConversations(accessToken);
      
      if (response.success) {
        // Son mesaj tarihine göre sırala
        const sortedRooms = response.data.sort((a, b) => {
          return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
        });
        
        // En fazla 5 oda göster
        const topRooms = sortedRooms.slice(0, 5);
        setChatRooms(topRooms);
        
        // Unread count'ları güncelle
        updateUnreadCounts(response.data);
      }
    } catch (error) {
      console.error('Chat odaları yüklenirken hata:', error);
    }
  };

  // Okunmamış mesaj sayılarını güncelle (getConversations'dan alıyoruz artık)
  const updateUnreadCounts = (rooms) => {
    const counts = {};
    rooms.forEach(room => {
      if (room.unread_count > 0) {
        counts[room.contact_id] = room.unread_count;
      }
    });
    setUnreadCounts(counts);
  };



  // Başlangıçta gerçek online durumunu kontrol et
  useEffect(() => {
    const checkOnlineStatus = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/online-status`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            setIsOnline(response.data.data.isOnline);
          }
        } catch (error) {
          console.error('Online durum kontrolü hatası:', error);
          setIsOnline(false);
        }
      }
    };
    
    checkOnlineStatus();
    loadChatRooms();
  }, [user, accessToken]);

  // Socket event listener'ları
  useEffect(() => {
    if (socket && isConnected && user) {
      // Kullanıcı durumu değişikliklerini dinle
      const handleUserOnline = (data) => {
        const userId = parseInt(data.userId);
        if (userId === user.id) {
          setIsOnline(true);
        }
        
        // Chat rooms'da online durumu güncelle
        setChatRooms(prev => prev.map(room => 
          room.contact_id === userId ? { ...room, is_online: true } : room
        ));
      };
      
      const handleUserOffline = (data) => {
        const userId = parseInt(data.userId);
        if (userId === user.id) {
          setIsOnline(false);
        }
        
        // Chat rooms'da offline durumu güncelle
        setChatRooms(prev => prev.map(room => 
          room.contact_id === userId ? { ...room, is_online: false, last_seen: data.last_seen } : room
        ));
      };
      
      // Chat açıldığında unread count'u sıfırla ve mesajları okundu olarak işaretle
      const handleChatOpened = async (event) => {
        const { roomId } = event.detail;
        setUnreadCounts(prev => ({
          ...prev,
          [roomId]: 0
        }));
        
        // Mesajları okundu olarak işaretle
        try {
          await chatService.markAsRead(roomId);
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
        
        // Mesaj verisinden sender_id'yi al
        const senderId = data.sender_id || data.senderId;
        
        setChatRooms(prev => {
          const updatedRooms = prev.map(room => {
            if (room.id === senderId) {
              return { ...room, last_message_time: new Date().toISOString() };
            }
            return room;
          });
          
          // Yeniden sırala: Pin edilenler önce, sonra son mesaj tarihine göre
          return updatedRooms.sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
          });
        });
        
        // Eğer mesaj başkasından geliyorsa
        if (senderId && senderId !== user.id) {
          // MessagingPanel'de aktif chat kontrol et
          const currentPath = window.location.pathname;
          const isMessagingPanelOpen = currentPath === '/messaging-panel';
          
          // Eğer MessagingPanel açık ve bu chat aktifse mesajları okundu olarak işaretle
          if (isMessagingPanelOpen) {
            // Aktif chat'i localStorage'dan kontrol et
            const selectedRoomId = localStorage.getItem('selectedRoomId');
            
            // Sadece aktif chat'teki mesajları okundu işaretle
            if (selectedRoomId && parseInt(selectedRoomId) === senderId) {
              try {
                console.log('Aktif chat mesajları okundu olarak işaretleniyor:', senderId);
                await chatService.markAsRead(senderId);
                // Okunmamış sayacı sıfırla
                setUnreadCounts(prev => ({
                  ...prev,
                  [senderId]: 0
                }));
              } catch (error) {
                console.error('Mesajları okundu olarak işaretlerken hata:', error);
                // Hata durumunda sayacı artır
                console.log('Okunmamış sayacı artırılıyor:', senderId);
                setUnreadCounts(prev => ({
                  ...prev,
                  [senderId]: (prev[senderId] || 0) + 1
                }));
              }
            } else {
              // Aktif chat değilse sayacı artır
              console.log('Aktif chat değil, okunmamış sayacı artırılıyor:', senderId);
              setUnreadCounts(prev => ({
                ...prev,
                [senderId]: (prev[senderId] || 0) + 1
              }));
            }
          } else {
            // MessagingPanel açık değilse sayacı artır
            console.log('MessagingPanel açık değil, okunmamış sayacı artırılıyor:', senderId);
            setUnreadCounts(prev => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
            }));
          }
        }
      };
      
      socket.on('user-online', handleUserOnline);
      socket.on('user-offline', handleUserOffline);
      socket.on('new-message', handleNewMessage);
      socket.on('chat-list-update', handleChatListUpdate);
      
      // Custom event listener'ı ekle
      window.addEventListener('chatOpened', handleChatOpened);
      
      return () => {
        socket.off('user-online', handleUserOnline);
        socket.off('user-offline', handleUserOffline);
        socket.off('new-message', handleNewMessage);
        socket.off('chat-list-update', handleChatListUpdate);
        window.removeEventListener('chatOpened', handleChatOpened);
      };
    }
  }, [socket, isConnected, user]);

  return (
    <div className="floating-chat">
      {/* Messaging başlığı */}
      <div className="messaging-title" onClick={handleMessagingClick}>
        MESAJLAŞMA
      </div>

      {/* Chat Avatarları */}
      <div className="chat-avatars">
        {chatRooms.map((room, index) => (
          <div 
            key={`chat-${room.contact_id}-${index}`}
            className="chat-avatar"
            onClick={handleMessagingClick}
            title={room.contact_name}
          >
            <img 
              src={room.contact_avatar || "/assets/images/logo.png"} 
              alt={room.contact_name}
              onError={(e) => {
                e.target.src = "/assets/images/logo.png";
              }}
            />
            <div className={`online-status ${room.is_online ? 'online' : 'offline'}`}></div>
            
            {/* Okunmamış mesaj sayısı */}
            {room.unread_count > 0 && (
              <div className="unread-badge">
                {room.unread_count > 99 ? '99+' : room.unread_count}
              </div>
            )}
          </div>
        ))}
      </div>


    </div>
  );
};

export default FloatingChat;