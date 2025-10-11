import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = (token) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API responses with token refresh
const handleResponse = async (response, originalRequest, refreshTokenFn, getNewTokenFn) => {
  if (!response.ok) {
    const error = await response.json();
    
    // Token süresi dolmuşsa ve refresh fonksiyonları varsa
    if (response.status === 401 && error.code === 'TOKEN_EXPIRED' && refreshTokenFn && getNewTokenFn) {
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
const fetchWithTokenRefresh = async (url, options = {}, refreshTokenFn = null, getNewTokenFn = null) => {
  const response = await fetch(url, options);
  
  const originalRequest = {
    url,
    ...options
  };
  
  return handleResponse(response, originalRequest, refreshTokenFn, getNewTokenFn);
};

// Bildirimleri getir
export const getNotifications = async (token, page = 1, limit = 20, unreadOnly = false, refreshTokenFn = null) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unread_only: 'true' })
    });

    const options = {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/notifications?${queryParams}`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Bildirimler getirme hatası:', error);
    throw error;
  }
};

// Okunmamış bildirim sayısını getir
export const getUnreadCount = async (token, refreshTokenFn = null) => {
  try {
    const options = {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/notifications/unread-count`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Okunmamış bildirim sayısı getirme hatası:', error);
    throw error;
  }
};

// Türe göre bildirimleri getir
export const getNotificationsByType = async (token, type, page = 1, limit = 20, refreshTokenFn = null) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const options = {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/notifications/type/${type}?${queryParams}`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Türe göre bildirimler getirme hatası:', error);
    throw error;
  }
};

// Bildirimi okundu olarak işaretle
export const markAsRead = async (token, notificationId, refreshTokenFn = null) => {
  try {
    const options = {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Bildirim okundu işaretleme hatası:', error);
    throw error;
  }
};

// Tüm bildirimleri okundu olarak işaretle
export const markAllAsRead = async (token, refreshTokenFn = null) => {
  try {
    const options = {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      credentials: 'include'
    };

    return await fetchWithTokenRefresh(
      `${API_BASE_URL}/notifications/mark-all-read`,
      options,
      refreshTokenFn
    );
  } catch (error) {
    console.error('Tüm bildirimleri okundu işaretleme hatası:', error);
    throw error;
  }
};

// Bildirimi sil
export const deleteNotification = async (token, notificationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      credentials: 'include'
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Bildirim silme hatası:', error);
    throw error;
  }
};

// Bildirim türlerine göre renk ve ikon getir
export const getNotificationStyle = (type) => {
  const styles = {
    cv_added: {
      color: '#10B981', // yeşil
      icon: '👤',
      bgColor: '#ECFDF5'
    },
    cv_updated: {
      color: '#3B82F6', // mavi
      icon: '✏️',
      bgColor: '#EFF6FF'
    },
    cv_deleted: {
      color: '#EF4444', // kırmızı
      icon: '🗑️',
      bgColor: '#FEF2F2'
    },
    appointment_created: {
      color: '#8B5CF6', // mor
      icon: '📅',
      bgColor: '#F3E8FF'
    },
    appointment_updated: {
      color: '#F59E0B', // turuncu
      icon: '📝',
      bgColor: '#FFFBEB'
    },
    appointment_reminder: {
      color: '#DC2626', // kırmızı
      icon: '⏰',
      bgColor: '#FEF2F2'
    },
    task_assigned: {
      color: '#06B6D4', // cyan
      icon: '✅',
      bgColor: '#ECFEFF'
    },
    task_unassigned: {
      color: '#6B7280', // gri
      icon: '❌',
      bgColor: '#F9FAFB'
    },
    task_updated: {
      color: '#F59E0B', // turuncu
      icon: '📝',
      bgColor: '#FFFBEB'
    },
    task_deleted: {
      color: '#EF4444', // kırmızı
      icon: '🗑️',
      bgColor: '#FEF2F2'
    },
    task_approval_changed: {
      color: '#8B5CF6', // mor
      icon: '🔄',
      bgColor: '#F3E8FF'
    },
    message_received: {
      color: '#84CC16', // lime
      icon: '💬',
      bgColor: '#F7FEE7'
    },
    request_created: {
      color: '#10B981', // yeşil
      icon: '📋',
      bgColor: '#ECFDF5'
    },
    request_updated: {
      color: '#3B82F6', // mavi
      icon: '📝',
      bgColor: '#EFF6FF'
    },
    request_deleted: {
      color: '#EF4444', // kırmızı
      icon: '🗑️',
      bgColor: '#FEF2F2'
    },
    request: {
      color: '#8B5CF6', // mor
      icon: '📋',
      bgColor: '#F3E8FF'
    },
    system: {
      color: '#6B7280', // gri
      icon: '⚙️',
      bgColor: '#F9FAFB'
    },
    info: {
      color: '#3B82F6', // mavi
      icon: 'ℹ️',
      bgColor: '#EFF6FF'
    },
    success: {
      color: '#10B981', // yeşil
      icon: '✅',
      bgColor: '#ECFDF5'
    },
    warning: {
      color: '#F59E0B', // turuncu
      icon: '⚠️',
      bgColor: '#FFFBEB'
    },
    error: {
      color: '#EF4444', // kırmızı
      icon: '❌',
      bgColor: '#FEF2F2'
    }
  };

  return styles[type] || styles.info;
};

// Bildirim zamanını formatla
export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Şimdi';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  } else if (diffInMinutes < 1440) { // 24 saat
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} saat önce`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    if (days === 1) {
      return 'Dün';
    } else if (days < 7) {
      return `${days} gün önce`;
    } else {
      return notificationTime.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }
};