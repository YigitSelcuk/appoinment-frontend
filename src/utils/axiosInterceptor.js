import axios from 'axios';

// Axios interceptor'ı kurulum fonksiyonu
export const setupAxiosInterceptors = (refreshAccessToken, getAccessToken, logout) => {
  // Request interceptor - Her istekte access token'ı ekle
  axios.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Token süresi dolmuşsa yenile
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Token süresi dolmuşsa ve daha önce denenmemişse
      if (
        error.response?.status === 401 &&
        error.response?.data?.code === 'TOKEN_EXPIRED' &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          // Yeni access token al
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            // Orijinal isteği yeni token ile tekrar gönder
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } else {
            // Refresh token da geçersizse logout yap
            await logout();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Refresh token hatası durumunda logout yap
          await logout();
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
};

// Interceptor'ları temizleme fonksiyonu
export const clearAxiosInterceptors = () => {
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
};