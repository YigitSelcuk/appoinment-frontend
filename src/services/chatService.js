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
 * Temiz Chat Service
 * Yeni backend API'sine uygun servis fonksiyonları
 */

// Konuşma listesini getir (mesajlaştığı kullanıcılar)
export const getConversations = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Konuşmaları getirirken hata:', error);
    throw error;
  }
};

// Belirli bir kullanıcıyla mesajları getir
export const getMessages = async (token, contactId, page = 1, limit = 50, markAsRead = false) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      markAsRead: markAsRead.toString()
    });

    const response = await fetch(`${API_BASE_URL}/chat/${contactId}/messages?${queryParams}`, {
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
export const sendMessage = async (token, contactId, message, messageType = 'text') => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${contactId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        message,
        messageType
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj gönderirken hata:', error);
    throw error;
  }
};

// Mesajları okundu olarak işaretle
export const markAsRead = async (token, contactId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${contactId}/mark-read`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj okundu işaretleme hatası:', error);
    throw error;
  }
};

// Tüm kullanıcıları getir (yeni chat başlatmak için)
export const getAllUsers = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/users`, {
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

// Online durumunu güncelle
export const updateOnlineStatus = async (token, isOnline) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/update-status`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        isOnline
      })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Online durum güncelleme hatası:', error);
    throw error;
  }
};

// Dosya mesajı gönder
export const sendFileMessage = async (token, contactId, file, message = '') => {
  try {
    if (!token) {
      throw new Error('Geçersiz token');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    if (message) {
      formData.append('message', message);
    }

    const response = await fetch(`${API_BASE_URL}/chat/${contactId}/messages/file`, {
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

// Export default object
const chatService = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getAllUsers,
  updateOnlineStatus,
  sendFileMessage
};

export default chatService;