import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Tüm talepleri getir
export const getRequests = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/requests`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Talepler getirilirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Yeni talep oluştur
export const createRequest = async (requestData) => {
  try {
    const response = await axios.post(`${API_URL}/requests`, requestData, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Talep oluşturulurken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Talep güncelle
export const updateRequest = async (id, requestData) => {
  try {
    const response = await axios.put(`${API_URL}/requests/${id}`, requestData, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Talep güncellenirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Talep sil
export const deleteRequest = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/requests/${id}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Talep silinirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Tek talep getir
export const getRequestById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/requests/${id}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Talep getirilirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// TC Kimlik No kontrolü
export const checkTCExists = async (tcNo) => {
  try {
    const response = await axios.get(`${API_URL}/requests/check-tc/${tcNo}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('TC kontrolü hatası:', error);
    throw error.response?.data || error.message;
  }
};

// Müdürlük bazlı talepleri getir
export const getDepartmentRequests = async (params = {}) => {
  try {
    console.log('getDepartmentRequests service çağrıldı');
    const url = '/requests/department/list';
    console.log('API URL:', `${API_URL}${url}`);
    
    const response = await axios.get(`${API_URL}${url}`, {
      withCredentials: true
    });
    console.log('Service response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Müdürlük talepleri getirilirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Talep durumunu güncelle
export const updateRequestStatus = async (id, statusData) => {
  try {
    const response = await axios.put(`${API_URL}/requests/${id}/status`, statusData, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Talep durumu güncellenirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Talep durum geçmişini getir
export const getRequestStatusHistory = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/requests/${id}/history`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Talep geçmişi getirilirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Talep istatistiklerini getir
export const getRequestStats = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/requests/stats`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (error) {
    console.error('Talep istatistikleri getirilirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Default export olarak service objesi
const requestsService = {
  getRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  getRequestById,
  checkTCExists,
  getDepartmentRequests,
  updateRequestStatus,
  getRequestStatusHistory,
  getRequestStats,
};

export default requestsService;