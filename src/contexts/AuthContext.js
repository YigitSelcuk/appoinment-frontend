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
  const [tokenRenewalTimer, setTokenRenewalTimer] = useState(null);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false); // Sonsuz döngüyü önlemek için

  // Uygulama başladığında oturum kontrolü yap
  useEffect(() => {
    if (!authCheckCompleted) {
      console.log('🔍 AuthContext: İlk auth kontrolü başlatılıyor...');
      checkAuthStatus();
    }
  }, [authCheckCompleted]);

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

  // Token renewal timer'ını kur
  useEffect(() => {
    if (accessToken && isAuthenticated) {
      setupTokenRenewalTimer(accessToken);
    } else {
      // Token yoksa timer'ı temizle
      if (tokenRenewalTimer) {
        clearTimeout(tokenRenewalTimer);
        setTokenRenewalTimer(null);
      }
    }

    // Cleanup function
    return () => {
      if (tokenRenewalTimer) {
        clearTimeout(tokenRenewalTimer);
        setTokenRenewalTimer(null);
      }
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

  // JWT token'ın expiry time'ını decode et
  const getTokenExpiry = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  };

  // Token'ın ne kadar süre sonra expire olacağını hesapla
  const getTimeUntilExpiry = (token) => {
    const expiry = getTokenExpiry(token);
    if (!expiry) return null;
    return expiry - Date.now();
  };

  // Proaktif token yenileme timer'ını kur
  const setupTokenRenewalTimer = (token) => {
    // Önceki timer'ı temizle
    if (tokenRenewalTimer) {
      clearTimeout(tokenRenewalTimer);
      setTokenRenewalTimer(null);
    }

    const timeUntilExpiry = getTimeUntilExpiry(token);
    if (!timeUntilExpiry || timeUntilExpiry <= 0) {
      console.log('⚠️ Token zaten expire olmuş, hemen yenileniyor...');
      refreshAccessToken();
      return;
    }

    // Token expire olmadan 5 dakika önce yenile (300000 ms = 5 dakika)
    const renewalTime = Math.max(timeUntilExpiry - 300000, 60000); // En az 1 dakika bekle
    
    console.log(`⏰ Token yenileme timer'ı kuruldu: ${Math.round(renewalTime / 1000)} saniye sonra yenilenecek`);
    
    const timer = setTimeout(async () => {
      console.log('🔄 Proaktif token yenileme başlatılıyor...');
      const newToken = await refreshAccessToken();
      if (newToken) {
        console.log('✅ Token başarıyla yenilendi');
        setupTokenRenewalTimer(newToken); // Yeni token için timer kur
      } else {
        console.log('❌ Token yenileme başarısız');
      }
    }, renewalTime);

    setTokenRenewalTimer(timer);
  };

  // Token yenileme fonksiyonu
  const refreshAccessToken = async () => {
    try {
      console.log('🔄 AuthContext: Refresh token isteği gönderiliyor...');
      const response = await axios.post(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/auth/refresh-token`, {}, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const newToken = response.data.accessToken;
        console.log('✅ AuthContext: Yeni access token alındı');
        setAccessToken(newToken);
        // Eski servisler için uyumluluk: token'ı localStorage'a da yaz
        try { localStorage.setItem('token', newToken); } catch (_) {}
        return newToken;
      }
      console.log('❌ AuthContext: Refresh token başarısız - response.data.success false');
      return null;
    } catch (error) {
      // Refresh token yoksa veya geçersizse sessizce başarısız ol
      console.log('❌ AuthContext: Refresh token hatası:', error.response?.status, error.response?.data?.message);
      return null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 AuthContext: checkAuthStatus başlatıldı');
      
      // Önce localStorage'dan token kontrol et
      let storedToken = null;
      try {
        storedToken = localStorage.getItem('token');
        console.log('🔍 AuthContext: localStorage token:', storedToken ? 'var' : 'yok');
      } catch (_) {}

      // Eğer localStorage'da token yoksa, hiç giriş yapılmamış demektir
      // Refresh token isteği göndermeye gerek yok
      if (!storedToken) {
        console.log('ℹ️ AuthContext: localStorage\'da token yok, kullanıcı hiç giriş yapmamış');
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthCheckCompleted(true);
        setLoading(false);
        return;
      }

      // localStorage'da token varsa, önce onu kullanmayı dene
      try {
        console.log('🔍 AuthContext: Stored token ile /me isteği gönderiliyor...');
        // Stored token ile kullanıcı bilgilerini almaya çalış
        const meResponse = await axios.get(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/users/me`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        const me = meResponse.data;
        if (me?.success && me.data) {
          // Stored token geçerli, state'i güncelle
          console.log('✅ AuthContext: Stored token geçerli, kullanıcı giriş yapmış');
          setAccessToken(storedToken);
          setUser(me.data);
          setIsAuthenticated(true);
          setAuthCheckCompleted(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Stored token geçersiz, localStorage'dan temizle ve refresh token dene
        console.log('❌ AuthContext: Stored token geçersiz, localStorage temizleniyor');
        try { localStorage.removeItem('token'); } catch (_) {}
      }

      // Stored token geçersizse, refresh token ile yeni access token almaya çalış
      console.log('🔄 AuthContext: Stored token geçersiz, refresh token deneniyor...');
      const newToken = await refreshAccessToken();
      
      if (!newToken) {
        // Refresh token da başarısızsa, kullanıcı oturumu sonlanmış demektir
        console.log('❌ AuthContext: Refresh token başarısız, kullanıcı oturumu sonlanmış');
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('token'); } catch (_) {}
        setAuthCheckCompleted(true);
        setLoading(false);
        return;
      }

      // Yeni token ile kullanıcı bilgilerini al
      try {
        console.log('🔍 AuthContext: Yeni token ile /me isteği gönderiliyor...');
        // Interceptor kurulmadan önce de Authorization başlığını elle ekleyelim
        const meResponse = await axios.get(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/users/me`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${newToken}` }
        });
        const me = meResponse.data;
        if (me?.success && me.data) {
          console.log('✅ AuthContext: Yeni token ile kullanıcı bilgileri alındı');
          setUser(me.data);
          setIsAuthenticated(true);
        } else {
          // Kullanıcı bilgileri alınamazsa sadece state'i temizle
          console.log('❌ AuthContext: Kullanıcı bilgileri alınamadı');
          setAccessToken(null);
          setUser(null);
          setIsAuthenticated(false);
          try { localStorage.removeItem('token'); } catch (_) {}
        }
      } catch (e) {
        // Hata durumunda sadece state'i temizle (sessizce)
        console.log('❌ AuthContext: /me isteği hatası:', e.response?.status);
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('token'); } catch (_) {}
      }
    } catch (error) {
      // Hata durumunda sadece state'i temizle (sessizce)
      console.log('❌ AuthContext: checkAuthStatus genel hatası:', error.message);
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      try { localStorage.removeItem('token'); } catch (_) {}
    } finally {
      setAuthCheckCompleted(true);
      setLoading(false);
      console.log('🏁 AuthContext: checkAuthStatus tamamlandı');
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 AuthContext: Login isteği gönderiliyor...');
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
        console.log('✅ AuthContext: Login başarılı');
        setAccessToken(response.data.accessToken);
        try { localStorage.setItem('token', response.data.accessToken); } catch (_) {}
        setUser(response.data.user);
        setIsAuthenticated(true);
        setAuthCheckCompleted(true);
        
        return { success: true };
      }
    } catch (error) {
      console.log('❌ AuthContext: Login hatası:', error.response?.data?.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Giriş yapılırken bir hata oluştu',
        validationErrors: error.response?.data?.errors
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext: Logout isteği gönderiliyor...');
      await axios.post(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()}/auth/logout`, {}, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    } finally {
      // Token renewal timer'ını temizle
      if (tokenRenewalTimer) {
        clearTimeout(tokenRenewalTimer);
        setTokenRenewalTimer(null);
      }
      
      // Memory'deki verileri temizle
      console.log('🧹 AuthContext: State temizleniyor...');
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthCheckCompleted(false); // Logout sonrası tekrar auth check yapılabilsin
      try { localStorage.removeItem('token'); } catch (_) {}
      
      // Google Calendar oturumunu da temizle
      try { localStorage.removeItem('googleSignedIn'); } catch (_) {}
      try { localStorage.removeItem('googleCalendarEnabled'); } catch (_) {}
      
      // Sayfa yenilenmesi yerine sadece state'i temizle
      // window.location.reload(); // Bu satır sonsuz döngüye neden oluyor - KALDIRILDI
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