const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = (token) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API responses with token refresh
const handleResponse = async (response, originalRequest, refreshTokenFn) => {
  if (!response.ok) {
    const error = await response.json();
    
    // Token süresi dolmuşsa ve refresh fonksiyonu varsa
    if (response.status === 401 && error.code === 'TOKEN_EXPIRED' && refreshTokenFn) {
      try {
        // Token'ı yenile
        const newToken = await refreshTokenFn();
        if (newToken) {
          // Yeni token ile isteği tekrar gönder
          const newHeaders = {
            ...originalRequest.headers,
            'Authorization': `Bearer ${newToken}`
          };
          
          const retryResponse = await fetch(originalRequest.url, {
            ...originalRequest,
            headers: newHeaders
          });
          
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      } catch (refreshError) {
        console.error('Token yenileme hatası:', refreshError);
      }
    }
    
    throw new Error(error.message || 'Bir hata oluştu');
  }
  return response.json();
};

// Fetch wrapper with token refresh capability
const fetchWithTokenRefresh = async (url, options = {}, refreshTokenFn = null) => {
  const response = await fetch(url, options);
  
  const originalRequest = {
    url,
    ...options
  };
  
  return handleResponse(response, originalRequest, refreshTokenFn);
};

// Chat odalarını getir
export const getChatRooms = async (token, refreshTokenFn = null) => {
  try {
    const options = {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/messages/messaging/rooms`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Chat odalarını getirirken hata:', error);
    throw error;
  }
};

// Chat odasının mesajlarını getir
export const getChatMessages = async (token, roomId, page = 1, limit = 50, markAsRead = false, refreshTokenFn = null) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      markAsRead: markAsRead.toString()
    });

    const options = {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/messages/messaging/rooms/${roomId}/messages?${queryParams}`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Chat mesajlarını getirirken hata:', error);
    throw error;
  }
};

// Yeni mesaj gönder
export const sendMessage = async (token, roomId, message, messageType = 'text', replyToId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        message,
        messageType,
        replyToId
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj gönderirken hata:', error);
    throw error;
  }
};

// Dosya mesajı gönder
export const sendFileMessage = async (token, roomId, file, message = '') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (message) {
      formData.append('message', message);
    }

    const response = await fetch(`${API_BASE_URL}/messages/messaging/rooms/${roomId}/messages/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: formData
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Dosya gönderirken hata:', error);
    throw error;
  }
};

// Chat odasına katıl
export const joinRoom = async (token, roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messaging/rooms/${roomId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat odasına katılırken hata:', error);
    throw error;
  }
};

// Chat odasından ayrıl
export const leaveRoom = async (token, roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messaging/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat odasından ayrılırken hata:', error);
    throw error;
  }
};

// Online kullanıcıları getir
export const getOnlineUsers = async (token, roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messaging/rooms/${roomId}/users`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Online kullanıcıları getirirken hata:', error);
    throw error;
  }
};

// Tüm kullanıcıları getir (yeni chat başlatmak için)
export const getAllUsers = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/users`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Kullanıcıları getirirken hata:', error);
    throw error;
  }
};

// Yeni chat odası başlat
export const startNewChat = async (token, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/rooms/start`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ userId })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Yeni chat başlatırken hata:', error);
    throw error;
  }
};

// Chat'i sustur/susturmayı kaldır
export const toggleMuteChat = async (token, contactUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/chat/${contactUserId}/mute`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat susturma hatası:', error);
    throw error;
  }
};

// Chat'i sabitle/sabitlemeyi kaldır
export const togglePinChat = async (contactUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/chat/${contactUserId}/pin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat sabitleme hatası:', error);
    throw error;
  }
};

// Chat'i sil
export const deleteChat = async (contactUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/chat/${contactUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat silme hatası:', error);
    throw error;
  }
};

// Chat mesajlarını kalıcı olarak sil
export const deleteChatMessages = async (contactUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/chat/${contactUserId}/messages`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat mesajlarını silme hatası:', error);
    throw error;
  }
};

// Chat ayarlarını getir
export const getChatSettings = async (contactUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/messaging/chat/${contactUserId}/settings`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat ayarlarını getirme hatası:', error);
    throw error;
  }
};

// Okunmamış mesaj sayılarını getir
export const getUnreadCounts = async (refreshTokenFn = null) => {
  try {
    const options = {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/messaging/unread-counts`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Okunmamış mesaj sayılarını getirme hatası:', error);
    throw error;
  }
};

// Mesajları okundu olarak işaretle
export const markMessagesAsRead = async (roomId, refreshTokenFn = null) => {
  try {
    const options = {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/messaging/rooms/${roomId}/mark-read`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Mesajları okundu işaretleme hatası:', error);
    throw error;
  }
};

// Export default object
const messagingService = {
  getChatRooms,
  getChatMessages,
  sendMessage,
  sendFileMessage,
  joinRoom,
  leaveRoom,
  getOnlineUsers,
  getAllUsers,
  startNewChat,
  toggleMuteChat,
  togglePinChat,
  deleteChat,
  deleteChatMessages,
  getChatSettings,
  getUnreadCounts,
  markMessagesAsRead
};

export default messagingService;