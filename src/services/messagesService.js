const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = (token) => {
  if (!token) {
    throw new Error('Erişim token\'ı gerekli');
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

// Tüm mesajları getir (sayfalama ve filtreleme ile)
export const getMessages = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Parametreleri ekle
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/messages?${queryParams}`, {
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

// Mesaj detayını getir
export const getMessageById = async (token, id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj detayını getirirken hata:', error);
    throw error;
  }
};

// Yeni mesaj oluştur
export const createMessage = async (token, messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(messageData)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj oluştururken hata:', error);
    throw error;
  }
};

// Mesajı güncelle
export const updateMessage = async (token, id, messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(messageData)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesajı güncellerken hata:', error);
    throw error;
  }
};

// Mesajı sil
export const deleteMessage = async (token, id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesajı silerken hata:', error);
    throw error;
  }
};

// Çoklu mesaj silme
export const deleteMultipleMessages = async (token, messageIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/delete-multiple`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ messageIds })
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Çoklu mesaj silerken hata:', error);
    throw error;
  }
};

// Mesaj istatistikleri
export const getMessageStats = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/stats`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Mesaj istatistiklerini getirirken hata:', error);
    throw error;
  }
};

// Export default object
const messagesService = {
  getMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  deleteMultipleMessages,
  getMessageStats
};

export default messagesService;