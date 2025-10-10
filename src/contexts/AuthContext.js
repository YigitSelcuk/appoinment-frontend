import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUser as fetchCurrentUser } from '../services/usersService';
import { setupAxiosInterceptors, clearAxiosInterceptors } from '../utils/axiosInterceptor';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null); // Sadece memory'de tutulacak

  // Uygulama başladığında oturum kontrolü yap
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Axios interceptor'ları kur
  useEffect(() => {
    if (accessToken) {
      const getAccessToken = () => accessToken;
      setupAxiosInterceptors(refreshAccessToken, getAccessToken, logout);
    } else {
      clearAxiosInterceptors();
    }

    // Cleanup function
    return () => {
      clearAxiosInterceptors();
    };
  }, [accessToken, isAuthenticated]);

  // Tarayıcı kapandığında veya sayfa yenilendiğinde logout yapma (devre dışı)
  useEffect(() => {
    // Önceden burada beforeunload/visibilitychange ile logout-beacon gönderiliyordu.
    // Oturumun sayfa yenilemede kaybolmaması için bu davranışı devre dışı bıraktık.
    // Eğer ihtiyaç olursa, sadece online/offline durumunu güncelleyen ayrı bir mekanizma kullanılabilir.
    return () => {
      // herhangi bir cleanup yok
    };
  }, [isAuthenticated, accessToken]);

  // Token yenileme fonksiyonu
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/auth/refresh-token`, {}, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const newToken = response.data.accessToken;
        setAccessToken(newToken);
        // Eski servisler için uyumluluk: token'ı localStorage'a da yaz
        try { localStorage.setItem('token', newToken); } catch (_) {}
        return newToken;
      }
      return null;
    } catch (error) {
      // Refresh token yoksa veya geçersizse sessizce başarısız ol
      return null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Önce localStorage'dan token kontrol et
      let storedToken = null;
      try {
        storedToken = localStorage.getItem('token');
      } catch (_) {}

      // Eğer localStorage'da token varsa, önce onu kullanmayı dene
      if (storedToken) {
        try {
          // Stored token ile kullanıcı bilgilerini almaya çalış
          const meResponse = await axios.get(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/users/me`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          const me = meResponse.data;
          if (me?.success && me.data) {
            // Stored token geçerli, state'i güncelle
            setAccessToken(storedToken);
            setUser(me.data);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Stored token geçersiz, localStorage'dan temizle ve refresh token dene
          try { localStorage.removeItem('token'); } catch (_) {}
        }
      }

      // Stored token yoksa veya geçersizse, refresh token ile yeni access token almaya çalış
      const newToken = await refreshAccessToken();
      
      if (!newToken) {
        // Token yoksa sadece state'i temizle, logout çağırma
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('token'); } catch (_) {}
        setLoading(false);
        return;
      }

      // Yeni token ile kullanıcı bilgilerini al
      try {
        // Interceptor kurulmadan önce de Authorization başlığını elle ekleyelim
        const meResponse = await axios.get(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/users/me`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${newToken}` }
        });
        const me = meResponse.data;
        if (me?.success && me.data) {
          setUser(me.data);
          setIsAuthenticated(true);
        } else {
          // Kullanıcı bilgileri alınamazsa sadece state'i temizle
          setAccessToken(null);
          setUser(null);
          setIsAuthenticated(false);
          try { localStorage.removeItem('token'); } catch (_) {}
        }
      } catch (e) {
        // Hata durumunda sadece state'i temizle (sessizce)
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('token'); } catch (_) {}
      }
    } catch (error) {
      // Hata durumunda sadece state'i temizle (sessizce)
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      try { localStorage.removeItem('token'); } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/auth/login`, 
        { email, password }, 
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        // Access token'ı sadece memory'de tut, refresh token HttpOnly cookie'de
        setAccessToken(response.data.accessToken);
        try { localStorage.setItem('token', response.data.accessToken); } catch (_) {}
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Giriş yapılırken bir hata oluştu',
        validationErrors: error.response?.data?.errors
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/auth/logout`, {}, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Memory'deki verileri temizle
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      try { localStorage.removeItem('token'); } catch (_) {}
      
      // Google Calendar oturumunu da temizle
      try { localStorage.removeItem('googleSignedIn'); } catch (_) {}
      try { localStorage.removeItem('googleCalendarEnabled'); } catch (_) {}
      
      // Sayfa yenilenmesi yerine sadece state'i temizle
      // window.location.reload(); // Bu satır sonsuz döngüye neden oluyor
    }
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    console.log('AuthContext updateUser çağrıldı:', { currentUser: user, updatedData: updatedUserData, finalUser: updatedUser });
    setUser(updatedUser);
    // localStorage kullanımı kaldırıldı - sadece memory'de tutuyoruz
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuthStatus,
    updateUser,
    refreshAccessToken,
    accessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};