import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket hook must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, accessToken, loading } = useAuth();

  useEffect(() => {
    // Loading tamamlanana kadar bekle
    if (loading) {
      console.log('⏳ SocketContext: Auth loading, socket bağlantısı bekleniyor...');
      return;
    }
    
    if (user && accessToken) {
      console.log('🔐 SocketContext: Token mevcut, socket bağlantısı kuruluyor...', { userId: user.id, hasToken: !!accessToken });
      
      // Socket.IO bağlantısını oluştur
      const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '');
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token: accessToken
        }
      });

      // Bağlantı olaylarını dinle
      newSocket.on('connect', async () => {
        console.log('Socket.IO bağlantısı kuruldu:', newSocket.id);
        setIsConnected(true);
        console.log(`Kullanıcı ${user.id} odaya katılıyor: user-${user.id}`);
        newSocket.emit('join-room', `user-${user.id}`);
        try {
          newSocket.emit('update-status', { isOnline: true });
          console.log('Kullanıcı online durumuna geçirildi (socket event)');
        } catch (error) {
          console.error('Online durum güncelleme hatası:', error);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket.IO bağlantısı koptu:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket.IO bağlantı hatası:', error);
        setIsConnected(false);
      });

      // Kullanıcı durumu olaylarını dinle
      newSocket.on('user-joined', (data) => {
        console.log('Kullanıcı katıldı:', data);
        setOnlineUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      });

      newSocket.on('user-left', (data) => {
        console.log('Kullanıcı ayrıldı:', data);
        setOnlineUsers(prev => prev.filter(userId => userId !== data.userId));
      });

      // Online/Offline durumu olaylarını dinle
      newSocket.on('user-online', (data) => {
        console.log('🟢 Kullanıcı online oldu (SocketContext):', data);
        setOnlineUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      });

      newSocket.on('user-offline', (data) => {
        console.log('🔴 Kullanıcı offline oldu (SocketContext):', data);
        setOnlineUsers(prev => prev.filter(userId => userId !== data.userId));
      });

      setSocket(newSocket);

      // Sayfa kapandığında offline yap
      const handleBeforeUnload = async () => {
        try {
          newSocket.emit('update-status', { isOnline: false });
          console.log('Kullanıcı offline durumuna geçirildi (socket event)');
        } catch (error) {
          console.error('Offline durum güncelleme hatası:', error);
        }
      };

      // Visibility change eventi (sayfa minimize/maximize veya sekme değişikliği)
      const handleVisibilityChange = async () => {
        if (document.hidden) {
          try {
            newSocket.emit('update-status', { isOnline: false });
            console.log('Sayfa gizlendi - offline yapıldı (socket event)');
          } catch (error) {
            console.error('Offline durum güncelleme hatası:', error);
          }
        } else {
          try {
            newSocket.emit('update-status', { isOnline: true });
            console.log('Sayfa görünür - online yapıldı (socket event)');
          } catch (error) {
            console.error('Online durum güncelleme hatası:', error);
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        // Offline yap
        try {
          newSocket.emit('update-status', { isOnline: false });
        } catch (e) {}
        newSocket.disconnect();
        newSocket.close();
      };
    } else {
      // User veya token yoksa socket'i kapat
      if (socket) {
        console.log('❌ SocketContext: Kullanıcı veya token eksik, socket bağlantısı kapatılıyor...', { 
          hasUser: !!user, 
          hasToken: !!accessToken, 
          loading 
        });
        socket.disconnect();
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
    }
  }, [user, accessToken, loading]);

  // Socket bağlantısını kapat
  const disconnect = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Belirli bir odaya katıl
  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      console.log(`Chat odasına katılıyor: room-${roomId}`);
      socket.emit('join-room', `room-${roomId}`);
    }
  };

  // Belirli bir odadan ayrıl
  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('leave-room', `room-${roomId}`);
    }
  };

  // Mesaj gönder
  const sendMessage = (roomId, message) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        roomId,
        message,
        timestamp: new Date()
      });
    }
  };

  // Mesaj dinleyicisi ekle
  const onMessage = (callback) => {
    if (socket) {
      console.log('Mesaj dinleyicisi eklendi');
      
      const messageHandler = (message) => {
        console.log('SocketContext: new-message event alındı:', message);
        console.log('SocketContext: callback çağrılıyor...');
        callback(message);
      };
      
      socket.on('new-message', messageHandler);
      
      return () => {
        console.log('Mesaj dinleyicisi kaldırıldı');
        socket.off('new-message', messageHandler);
      };
    }
  };

  // Chat listesi güncelleme dinleyicisi ekle
  const onChatListUpdate = (callback) => {
    if (socket) {
      console.log('Chat listesi güncelleme dinleyicisi eklendi');
      
      const updateHandler = (data) => {
        console.log('Chat listesi güncelleme alındı:', data);
        if (typeof callback === 'function') {
          callback(data);
        }
      };
      
      socket.on('chat-list-update', updateHandler);
      
      return () => {
        console.log('Chat listesi güncelleme dinleyicisi kaldırıldı');
        socket.off('chat-list-update', updateHandler);
      };
    }
  };

  // Kullanıcı durumu dinleyicisi ekle
  const onUserStatusChange = (callback) => {
    if (socket) {
      const handleUserJoined = (data) => callback({ type: 'joined', ...data });
      const handleUserLeft = (data) => callback({ type: 'left', ...data });
      
      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);
      
      return () => {
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
      };
    }
  };

  // Mesaj okundu dinleyicisi ekle
  const onMessageRead = (callback) => {
    if (socket) {
      console.log('Mesaj okundu dinleyicisi eklendi');
      
      const readHandler = (data) => {
        console.log('Mesaj okundu event alındı:', data);
        if (typeof callback === 'function') {
          callback(data);
        }
      };
      
      socket.on('message-read', readHandler);
      
      return () => {
        console.log('Mesaj okundu dinleyicisi kaldırıldı');
        socket.off('message-read', readHandler);
      };
    }
  };

  useEffect(() => {
    if (socket && user) {
      // Yeni online users list listener
      socket.on('online-users-list', (data) => {
        console.log('📡 Online users list alındı:', data);
        setOnlineUsers(data.onlineUsers || []);
      });

      return () => {
        socket.off('online-users-list');
      };
    }
  }, [socket, user]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    onMessage,
    onMessageRead,
    onChatListUpdate,
    onUserStatusChange
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};