import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

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

// Tüm kullanıcıları getir
export const getUsers = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: getAuthHeaders(token),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Department listesini getir
export const getDepartments = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/users/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Mevcut kullanıcının bilgilerini getir
export const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/users/me`, {
      headers: getAuthHeaders(token),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: Kullanıcı oluştur
export const createUser = async (userData, token) => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData, {
      headers: getAuthHeaders(token),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: Kullanıcı izinlerini güncelle
export const updateUserPermissions = async (userId, permissions, token) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}/permissions`, { permissions }, {
      headers: getAuthHeaders(token),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Kullanıcı güncelle
export const updateUser = async (userId, userData, token) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData, {
      headers: getAuthHeaders(token),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// Kullanıcı sil
export const deleteUser = async (userId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: getAuthHeaders(token),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    // Backend'den gelen hata mesajını doğru şekilde ilet
    if (error.response?.data) {
      throw error.response.data;
    } else {
      throw { message: error.message || 'Kullanıcı silinirken hata oluştu' };
    }
  }
};