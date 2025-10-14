import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          withCredentials: true
        });
        
        if (refreshResponse.data.success && refreshResponse.data.accessToken) {
          localStorage.setItem('token', refreshResponse.data.accessToken);
          originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token yenileme hatası:', refreshError);
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Tüm departmanları getir
export const getAllDepartments = async () => {
  try {
    const response = await axios.get(`${API_URL}/departments`, {
      headers: getAuthHeaders(),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Departmanları getirirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Tek departman getir
export const getDepartmentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/departments/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Departman getirirken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Yeni departman oluştur (Admin only)
export const createDepartment = async (departmentData) => {
  try {
    const response = await axios.post(`${API_URL}/departments`, departmentData, {
      headers: getAuthHeaders(),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Departman oluştururken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Departman güncelle (Admin only)
export const updateDepartment = async (id, departmentData) => {
  try {
    const response = await axios.put(`${API_URL}/departments/${id}`, departmentData, {
      headers: getAuthHeaders(),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Departman güncellerken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Departman sil (Admin only)
export const deleteDepartment = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/departments/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Departman silerken hata:', error);
    throw error.response?.data || error.message;
  }
};

// Departman seçenekleri için formatlı liste getir
export const getDepartmentOptions = async () => {
  try {
    const response = await getAllDepartments();
    if (response.success && response.data) {
      return response.data.map(dept => ({
        value: dept.name,
        label: dept.name,
        id: dept.id,
        description: dept.description
      }));
    }
    return [];
  } catch (error) {
    console.error('Departman seçenekleri getirirken hata:', error);
    return [];
  }
};

export default {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentOptions
};