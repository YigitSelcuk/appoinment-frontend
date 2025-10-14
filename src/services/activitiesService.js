const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API çağrıları için yardımcı fonksiyon
const makeRequest = async (url, options = {}, token) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // 403 hatası için özel mesaj
    if (response.status === 403) {
      throw new Error('Bu işlem için yönetici yetkisi gerekir. Lütfen yöneticinizle iletişime geçin.');
    }
    
    // 401 hatası için özel mesaj
    if (response.status === 401) {
      throw new Error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
    }
    
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Tüm aktiviteleri getir
export const getActivities = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.actionType) queryParams.append('actionType', params.actionType);
    if (params.tableName) queryParams.append('tableName', params.tableName);

    const url = `/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await makeRequest(url, {}, token);
  } catch (error) {
    console.error('Aktiviteler getirilirken hata:', error);
    throw error;
  }
};

// Aktivite istatistikleri getir
export const getActivityStats = async (token) => {
  try {
    return await makeRequest('/activities/stats', {}, token);
  } catch (error) {
    console.error('Aktivite istatistikleri getirilirken hata:', error);
    throw error;
  }
};

// Aktivite kaydet
export const logActivity = async (token, activityData) => {
  try {
    return await makeRequest('/activities/log', {
      method: 'POST',
      body: JSON.stringify(activityData),
    }, token);
  } catch (error) {
    console.error('Aktivite kaydedilirken hata:', error);
    throw error;
  }
};

// Default export olarak service objesi
const activitiesService = {
  getActivities,
  getActivityStats,
  logActivity,
};

export default activitiesService;