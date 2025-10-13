const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = (token) => {
  if (!token) {
    throw new Error('Geçersiz token');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Bir hata oluştu');
  }
  return response.json();
};

/**
 * Profesyonel Chat Service
 * Yeni chat sistemi API'sine uygun servis fonksiyonları
 */

// =====================================================
// CHAT ODALARI (ROOMS) İŞLEMLERİ
// =====================================================

// Kullanıcının chat odalarını getir
export const getChatRooms = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat odalarını getirirken hata:', error);
    throw error;
  }
};

// Direct chat oluştur veya mevcut olanı getir
export const createOrGetDirectChat = async (token, otherUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/direct`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        otherUserId
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Direct chat oluştururken hata:', error);
    throw error;
  }
};

// Grup chat oluştur
export const createGroupChat = async (token, name, description, participantIds, avatarUrl) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/group`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        name,
        description,
        participantIds,
        avatarUrl
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Grup chat oluştururken hata:', error);
    throw error;
  }
};

// Chat odası bilgilerini getir
export const getChatRoomInfo = async (token, roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat odası bilgilerini getirirken hata:', error);
    throw error;
  }
};

// =====================================================
// MESAJ İŞLEMLERİ
// =====================================================

// Chat mesajlarını getir
export const getMessages = async (token, roomId, page = 1, limit = 50) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesajları getirirken hata:', error);
    throw error;
  }
};

// Mesaj gönder
export const sendMessage = async (token, roomId, messageContent, messageType = 'text', replyToMessageId = null, metadata = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        messageContent,
        messageType,
        replyToMessageId,
        metadata
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj gönderirken hata:', error);
    throw error;
  }
};

// Dosya mesajı gönder
export const sendFileMessage = async (token, roomId, file, messageType = 'file', replyToMessageId = null) => {
  try {
    if (!token) {
      throw new Error('Geçersiz token');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('messageType', messageType);
    if (replyToMessageId) {
      formData.append('replyToMessageId', replyToMessageId);
    }

    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Bir hata oluştu');
    }
    
    return response.json();
  } catch (error) {
    console.error('Dosya mesajı gönderirken hata:', error);
    throw error;
  }
};

// Mesajları okundu olarak işaretle
export const markMessagesAsRead = async (token, roomId, messageIds = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages/read`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        messageIds
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj okundu işaretleme hatası:', error);
    throw error;
  }
};

// Mesaj düzenle
export const editMessage = async (token, messageId, messageContent) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/messages/${messageId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        messageContent
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj düzenleme hatası:', error);
    throw error;
  }
};

// Mesaj sil
export const deleteMessage = async (token, messageId, deleteType = 'for_me') => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        deleteType
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj silme hatası:', error);
    throw error;
  }
};

// Mesaja reaksiyon ekle/kaldır
export const toggleReaction = async (token, messageId, reaction) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/messages/${messageId}/reaction`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        reaction
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Reaksiyon işlemi hatası:', error);
    throw error;
  }
};

// =====================================================
// KATILIMCI İŞLEMLERİ
// =====================================================

// Chat katılımcılarını getir
export const getChatParticipants = async (token, roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/participants`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Katılımcıları getirirken hata:', error);
    throw error;
  }
};

// =====================================================
// ARAMA VE FİLTRELEME
// =====================================================

// Mesajlarda arama yap
export const searchMessages = async (token, roomId, query, messageType = null, dateFrom = null, dateTo = null, page = 1, limit = 20) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (query) queryParams.append('query', query);
    if (messageType) queryParams.append('messageType', messageType);
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);

    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/search?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj arama hatası:', error);
    throw error;
  }
};

// Kullanıcı arama (yeni chat oluşturmak için)
export const searchUsers = async (token, query, limit = 10) => {
  try {
    const queryParams = new URLSearchParams({
      query,
      limit: limit.toString()
    });

    const response = await fetch(`${API_BASE_URL}/chat/users/search?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    throw error;
  }
};

// =====================================================
// BACKWARD COMPATIBILITY (Eski API'ler için)
// =====================================================

// Eski getConversations fonksiyonu - getChatRooms'a yönlendir
export const getConversations = async (token) => {
  return await getChatRooms(token);
};

// Eski markAsRead fonksiyonu - markMessagesAsRead'e yönlendir
export const markAsRead = async (token, roomId) => {
  return await markMessagesAsRead(token, roomId);
};

// Eski getAllUsers fonksiyonu - doğrudan users endpoint'ini kullan
export const getAllUsers = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/users`, {
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

// Online durumunu güncelle (Socket üzerinden yapılacak, şimdilik boş)
export const updateOnlineStatus = async (token, isOnline) => {
  // Bu işlem artık Socket.js üzerinden yapılacak
  console.log('Online status update will be handled by Socket.js');
  return { success: true };
};

// Chat sabitleme/sabitleme kaldırma
export const pinChat = async (token, roomId, isPinned) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/pin`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ is_pinned: isPinned })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Chat sabitleme hatası:', error);
    throw error;
  }
};

// Tüm mesajları sil (sadece silen kullanıcı için)
export const deleteAllMessages = async (token, roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Tüm mesajları silme hatası:', error);
    throw error;
  }
};

// Export default object
const chatService = {
  getChatRooms,
  createOrGetDirectChat,
  createGroupChat,
  getChatRoomInfo,
  getMessages,
  sendMessage,
  sendFileMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  toggleReaction,
  getChatParticipants,
  searchMessages,
  searchUsers,
  getConversations,
  markAsRead,
  getAllUsers,
  updateOnlineStatus,
  pinChat,
  deleteAllMessages
};

export default chatService;