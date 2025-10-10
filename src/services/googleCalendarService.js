// Google Calendar API yapılandırması
const config = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
  scope: 'https://www.googleapis.com/auth/calendar',
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  ],
};

class GoogleCalendarService {
  constructor() {
    this.isInitialized = false;
    this.tokenClient = null;
  }

  // Google Calendar API'yi başlat
  async init() {
    try {
      console.log('🚀 Google Calendar init başlatılıyor...');
      console.log('📋 Config:', { 
        clientId: config.clientId ? 'SET' : 'MISSING', 
        apiKey: config.apiKey ? 'SET' : 'MISSING' 
      });
      
      if (!config.clientId || !config.apiKey) {
        console.warn('❌ Google Calendar API credentials not found in environment variables');
        return false;
      }

      // GAPI'yi yükle
      console.log('📡 GAPI yükleniyor...');
      await new Promise((resolve, reject) => {
        if (window.gapi) {
          console.log('✅ GAPI zaten yüklü');
          resolve();
        } else {
          console.log('⏳ GAPI script yükleniyor...');
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => {
            console.log('✅ GAPI script yüklendi');
            resolve();
          };
          script.onerror = (error) => {
            console.error('❌ GAPI script yüklenemedi:', error);
            reject(error);
          };
          document.head.appendChild(script);
        }
      });

      // GAPI'yi başlat
      console.log('🔧 GAPI client yükleniyor...');
      await new Promise((resolve) => {
        window.gapi.load('client', () => {
          console.log('✅ GAPI client yüklendi');
          resolve();
        });
      });

      // Client'ı başlat
      console.log('🔧 GAPI client başlatılıyor...');
      await window.gapi.client.init({
        apiKey: config.apiKey,
        discoveryDocs: config.discoveryDocs,
      });
      console.log('✅ GAPI client başlatıldı');

      // GSI (Google Sign-In) script'ini yükle
      console.log('🔐 GSI script yükleniyor...');
      await new Promise((resolve, reject) => {
        if (window.google && window.google.accounts) {
          console.log('✅ GSI zaten yüklü');
          resolve();
        } else {
          console.log('⏳ GSI script yükleniyor...');
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.onload = () => {
            console.log('✅ GSI script yüklendi');
            resolve();
          };
          script.onerror = (error) => {
            console.error('❌ GSI script yüklenemedi:', error);
            reject(error);
          };
          document.head.appendChild(script);
        }
      });

      // Token client'ı başlat
      console.log('🔐 Token client başlatılıyor...');
      if (!window.google || !window.google.accounts) {
        console.error('❌ Google GSI client yüklenmemiş!');
        return false;
      }
      
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: config.scope,
        callback: '', // Bu callback'i daha sonra ayarlayacağız
        ux_mode: 'popup',
        select_account: true
      });
      console.log('✅ Token client başlatıldı');

      this.isInitialized = true;
      console.log('🎉 Google Calendar başarıyla başlatıldı!');
      
      // Başlatma sonrası localStorage'dan token'ı geri yüklemeyi dene
      try {
        console.log('🔍 Init: localStorage\'dan token kontrol ediliyor...');
        const savedToken = localStorage.getItem('googleCalendarToken');
        console.log('🔍 Init: localStorage token:', savedToken ? 'BULUNDU' : 'BULUNAMADI');
        
        if (savedToken) {
          const token = JSON.parse(savedToken);
          console.log('🔍 Init: Token parse edildi:', {
            hasAccessToken: !!token.access_token,
            expiresAt: token.expires_at ? new Date(token.expires_at).toLocaleString() : 'YOK',
            isValid: token.access_token && token.expires_at && Date.now() < token.expires_at
          });
          
          // Token'ın geçerli olup olmadığını kontrol et
          if (token.access_token && token.expires_at && Date.now() < token.expires_at) {
            // Token'ı GAPI client'a set et
            const tokenForGapi = {
              access_token: token.access_token,
              token_type: token.token_type || 'Bearer',
              expires_in: Math.floor((token.expires_at - Date.now()) / 1000)
            };
            window.gapi.client.setToken(tokenForGapi);
            console.log('✅ Init: Google Calendar token localStorage\'dan geri yüklendi ve GAPI client\'a set edildi');
            
            // Set edildikten sonra kontrol et
            const setToken = window.gapi.client.getToken();
            console.log('🔍 Init: GAPI client\'a set edilen token:', setToken);
          } else {
            console.log('⚠️ Init: Kaydedilen token geçersiz veya süresi dolmuş, temizleniyor...');
            localStorage.removeItem('googleCalendarToken');
            localStorage.removeItem('googleSignedIn');
          }
        } else {
          console.log('ℹ️ Init: localStorage\'da token bulunamadı');
        }
      } catch (e) {
        console.error('❌ Init: localStorage\'dan token okuma hatası:', e);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Google Calendar initialization error:', error);
      return false;
    }
  }

  // Backward compatibility
  async initialize() {
    return this.init();
  }

  // Kullanıcı girişi (etkileşimli)
  async signIn() {
    try {
      console.log('🔑 GoogleCalendarService: signIn başlatılıyor...');
      if (!this.isInitialized) {
        console.log('⚠️ GoogleCalendarService: Henüz başlatılmamış, init çağrılıyor...');
        await this.init();
      }

      return new Promise((resolve, reject) => {
        this.tokenClient.callback = (response) => {
          console.log('📞 GoogleCalendarService: Token callback alındı:', response);
          if (response.error !== undefined) {
            console.error('❌ GoogleCalendarService: Token callback hatası:', response.error);
            reject(response);
          } else {
            // Token'ı localStorage'a kaydet
            try {
              const token = window.gapi.client.getToken();
              console.log('🔍 GoogleCalendarService: Alınan token:', token);
              if (token && token.access_token) {
                // Token'a expires_at timestamp'i ekle
                const tokenWithExpiry = {
                  ...token,
                  expires_at: Date.now() + (token.expires_in * 1000)
                };
                localStorage.setItem('googleCalendarToken', JSON.stringify(tokenWithExpiry));
                localStorage.setItem('googleSignedIn', 'true');
                console.log('💾 GoogleCalendarService: Token localStorage\'a kaydedildi', {
                  expiresAt: new Date(tokenWithExpiry.expires_at).toLocaleString(),
                  expiresIn: token.expires_in + ' saniye'
                });
              } else {
                console.warn('⚠️ GoogleCalendarService: Token alınamadı!');
              }
            } catch (e) {
              console.warn('❌ GoogleCalendarService: Token localStorage\'a kaydedilemedi:', e);
            }
            console.log('✅ GoogleCalendarService: signIn başarılı');
            resolve(true);
          }
        };
        
        // Eğer zaten giriş yapılmışsa, yeni token iste, değilse kullanıcıdan izin iste
        if (window.gapi.client.getToken() === null) {
          console.log('🚀 GoogleCalendarService: İlk kez giriş, consent isteniyor...');
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          console.log('🔄 GoogleCalendarService: Mevcut oturum var, token yenileniyor...');
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      });
    } catch (error) {
      console.error('❌ GoogleCalendarService: signIn genel hatası:', error);
      return false;
    }
  }

  // Sessiz giriş (sayfa yenileme sonrası, kullanıcı etkileşimi olmadan mümkünse)
  async silentSignIn() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }
      
      // Önce localStorage'dan token'ı geri yüklemeyi dene
      try {
        const savedToken = localStorage.getItem('googleCalendarToken');
        if (savedToken) {
          const token = JSON.parse(savedToken);
          // Token'ın geçerli olup olmadığını kontrol et
          if (token.access_token && token.expires_at && Date.now() < token.expires_at) {
            // Token'ı GAPI client'a set et
            const tokenForGapi = {
              access_token: token.access_token,
              token_type: token.token_type || 'Bearer',
              expires_in: Math.floor((token.expires_at - Date.now()) / 1000)
            };
            window.gapi.client.setToken(tokenForGapi);
            console.log('✅ Google Calendar token localStorage\'dan geri yüklendi');
            return true;
          } else {
            console.log('⚠️ Kaydedilen token süresi dolmuş, yenileniyor...');
            localStorage.removeItem('googleCalendarToken');
            localStorage.removeItem('googleSignedIn');
          }
        }
      } catch (e) {
        console.warn('localStorage\'dan token okunamadı:', e);
      }
      
      // localStorage'da geçerli token yoksa, sessiz token isteği yap
      return new Promise((resolve, reject) => {
        this.tokenClient.callback = (response) => {
          if (response && response.error) {
            // Sessiz giriş başarısız olabilir (ör. oturum yoksa), false döndür
            return reject(response);
          }
          // Yeni token'ı localStorage'a kaydet
          try {
            const token = window.gapi.client.getToken();
            if (token && token.access_token) {
              // Token'a expires_at timestamp'i ekle
              const tokenWithExpiry = {
                ...token,
                expires_at: Date.now() + (token.expires_in * 1000)
              };
              localStorage.setItem('googleCalendarToken', JSON.stringify(tokenWithExpiry));
              localStorage.setItem('googleSignedIn', 'true');
              console.log('💾 GoogleCalendarService: Sessiz token localStorage\'a kaydedildi', {
                expiresAt: new Date(tokenWithExpiry.expires_at).toLocaleString()
              });
            }
          } catch (e) {
            console.warn('Token localStorage\'a kaydedilemedi:', e);
          }
          resolve(true);
        };
        try {
          this.tokenClient.requestAccessToken({ prompt: '' });
        } catch (e) {
          reject(e);
        }
      });
    } catch (error) {
      console.warn('Google Calendar silent sign-in not available:', error);
      return false;
    }
  }

  // Kullanıcı çıkışı
  async signOut() {
    try {
      const token = window.gapi.client.getToken();
      if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token);
        window.gapi.client.setToken('');
      }
      // localStorage'dan token'ı ve giriş durumunu temizle
      try {
        localStorage.removeItem('googleCalendarToken');
        localStorage.removeItem('googleSignedIn');
        console.log('🧹 GoogleCalendarService: localStorage temizlendi');
      } catch (e) {
        console.warn('localStorage\'dan token temizlenemedi:', e);
      }
      return true;
    } catch (error) {
      console.error('Google Calendar sign out error:', error);
      return false;
    }
  }

  // Google Calendar etkinliklerini getir
  async getEvents(timeMin = null, timeMax = null, userColor = '#4285f4') {
    try {
      // Önce servisin başlatılıp başlatılmadığını kontrol et
      if (!this.isInitialized || !window.gapi?.client?.calendar) {
        console.log('🔄 Google Calendar: Servis başlatılmamış, yeniden başlatılıyor...');
        const initResult = await this.init();
        if (!initResult) {
          console.error('❌ Google Calendar: Servis başlatılamadı');
          return [];
        }
      }
      
      if (!this.isSignedIn()) {
        console.warn('Google Calendar: Kullanıcı giriş yapmamış');
        return [];
      }
      
      // GAPI client'da token yoksa localStorage'dan yükle
      const gapiToken = window.gapi?.client?.getToken();
      if (!gapiToken) {
        const storedToken = localStorage.getItem('googleCalendarToken');
        if (storedToken) {
          try {
            const tokenData = JSON.parse(storedToken);
            const now = Date.now();
            if (tokenData.expires_at && now < tokenData.expires_at) {
              console.log('🔄 GoogleCalendarService: localStorage token GAPI client\'a set ediliyor');
              const tokenForGapi = {
                access_token: tokenData.access_token,
                token_type: tokenData.token_type || 'Bearer',
                expires_in: Math.floor((tokenData.expires_at - now) / 1000)
              };
              window.gapi.client.setToken(tokenForGapi);
              console.log('✅ GoogleCalendarService: Token başarıyla set edildi, expires_in:', tokenForGapi.expires_in);
            } else {
              console.log('⚠️ GoogleCalendarService: localStorage token süresi dolmuş, temizleniyor');
              localStorage.removeItem('googleCalendarToken');
              localStorage.removeItem('googleSignedIn');
            }
          } catch (error) {
            console.error('❌ GoogleCalendarService: Token set hatası:', error);
          }
        }
      }

      const request = {
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        showDeleted: false,
        singleEvents: true,
        maxResults: 250,
        orderBy: 'startTime',
      };

      const response = await window.gapi.client.calendar.events.list(request);
      const events = response.result.items || [];

      // Etkinlikleri uygulama formatına çevir
      return events.map(event => ({
        id: `google_${event.id}`,
        title: event.summary || 'Başlıksız Etkinlik',
        date: event.start.date || event.start.dateTime?.split('T')[0],
        time: event.start.dateTime ? event.start.dateTime.substring(11, 16) : '00:00',
        startTime: event.start.dateTime ? event.start.dateTime.substring(11, 16) : '00:00',
        endTime: event.end.dateTime ? event.end.dateTime.substring(11, 16) : '23:59',
        attendee: event.organizer?.displayName || event.organizer?.email || 'Google Calendar',
        color: userColor, // Kullanıcının rengi
        day: this.calculateDayIndex(event.start.date || event.start.dateTime?.split('T')[0]),
        duration: this.calculateDuration(event.start.dateTime, event.end.dateTime),
        description: event.description || '',
        location: event.location || '',
        isGoogleEvent: true,
        googleEventId: event.id,
        originalEvent: event
      }));
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  // Google Calendar'a etkinlik ekle
  async createEvent(eventData) {
    try {
      // Önce servisin başlatılıp başlatılmadığını kontrol et
      if (!this.isInitialized || !window.gapi?.client?.calendar) {
        console.log('🔄 Google Calendar: Servis başlatılmamış, yeniden başlatılıyor...');
        const initResult = await this.init();
        if (!initResult) {
          throw new Error('Google Calendar servisi başlatılamadı');
        }
      }
      
      if (!this.isSignedIn()) {
        throw new Error('Google Calendar: Kullanıcı giriş yapmamış');
      }
      
      // GAPI client'da token yoksa localStorage'dan yükle
      const gapiToken = window.gapi?.client?.getToken();
      if (!gapiToken) {
        const storedToken = localStorage.getItem('googleCalendarToken');
        if (storedToken) {
          try {
            const tokenData = JSON.parse(storedToken);
            const now = Date.now();
            if (tokenData.expires_at && now < tokenData.expires_at) {
              console.log('🔄 GoogleCalendarService: localStorage token GAPI client\'a set ediliyor (createEvent)');
              window.gapi.client.setToken({
                access_token: tokenData.access_token,
                token_type: tokenData.token_type || 'Bearer',
                expires_in: Math.floor((tokenData.expires_at - now) / 1000)
              });
            }
          } catch (error) {
            console.error('❌ GoogleCalendarService: Token set hatası (createEvent):', error);
          }
        }
      }

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: `${eventData.date}T${eventData.startTime || eventData.time}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: `${eventData.date}T${eventData.endTime}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: eventData.location || ''
      };

      console.log('📅 Google Calendar: Etkinlik oluşturuluyor:', event);
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      
      console.log('✅ Google Calendar: Etkinlik oluşturuldu:', response.result);
      return response.result;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  // Google Calendar'da etkinlik güncelle
  async updateEvent(googleEventId, eventData) {
    try {
      if (!this.isInitialized || !window.gapi?.client?.calendar) {
        console.log('🔄 Google Calendar: Servis başlatılmamış, yeniden başlatılıyor...');
        const initResult = await this.init();
        if (!initResult) {
          throw new Error('Google Calendar servisi başlatılamadı');
        }
      }
      
      if (!this.isSignedIn()) {
        throw new Error('Google Calendar: Kullanıcı giriş yapmamış');
      }
      
      // GAPI client'da token yoksa localStorage'dan yükle
      const gapiToken = window.gapi?.client?.getToken();
      if (!gapiToken) {
        const storedToken = localStorage.getItem('googleCalendarToken');
        if (storedToken) {
          try {
            const tokenData = JSON.parse(storedToken);
            const now = Date.now();
            if (tokenData.expires_at && now < tokenData.expires_at) {
              window.gapi.client.setToken({
                access_token: tokenData.access_token,
                token_type: tokenData.token_type || 'Bearer',
                expires_in: Math.floor((tokenData.expires_at - now) / 1000)
              });
            }
          } catch (error) {
            console.error('❌ GoogleCalendarService: Token set hatası (updateEvent):', error);
          }
        }
      }

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: `${eventData.date}T${eventData.startTime || eventData.time}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: `${eventData.date}T${eventData.endTime}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: eventData.location || ''
      };

      console.log('📅 Google Calendar: Etkinlik güncelleniyor:', googleEventId, event);
      const response = await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        resource: event
      });
      
      console.log('✅ Google Calendar: Etkinlik güncellendi:', response.result);
      return response.result;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }

  // Google Calendar'dan etkinlik sil
  async deleteEvent(googleEventId) {
    console.log('🔍 deleteEvent başlatıldı - googleEventId:', googleEventId);
    
    try {
      if (!this.isInitialized || !window.gapi?.client?.calendar) {
        console.log('🔄 Google Calendar: Servis başlatılmamış, yeniden başlatılıyor...');
        const initResult = await this.init();
        if (!initResult) {
          throw new Error('Google Calendar servisi başlatılamadı');
        }
      }
      
      console.log('🔍 isSignedIn kontrolü:', this.isSignedIn());
      if (!this.isSignedIn()) {
        throw new Error('Google Calendar: Kullanıcı giriş yapmamış');
      }
      
      // GAPI client'da token yoksa localStorage'dan yükle
      const gapiToken = window.gapi?.client?.getToken();
      console.log('🔍 GAPI token:', gapiToken ? 'Mevcut' : 'Yok');
      
      if (!gapiToken) {
        const storedToken = localStorage.getItem('googleCalendarToken');
        console.log('🔍 Stored token:', storedToken ? 'Mevcut' : 'Yok');
        
        if (storedToken) {
          try {
            const tokenData = JSON.parse(storedToken);
            const now = Date.now();
            console.log('🔍 Token süresi:', {
              now: new Date(now).toLocaleString(),
              expiresAt: new Date(tokenData.expires_at).toLocaleString(),
              isValid: now < tokenData.expires_at
            });
            
            if (tokenData.expires_at && now < tokenData.expires_at) {
              window.gapi.client.setToken({
                access_token: tokenData.access_token,
                token_type: tokenData.token_type || 'Bearer',
                expires_in: Math.floor((tokenData.expires_at - now) / 1000)
              });
              console.log('✅ Token GAPI client\'a set edildi');
            } else {
              console.warn('⚠️ Token süresi dolmuş');
            }
          } catch (error) {
            console.error('❌ GoogleCalendarService: Token set hatası (deleteEvent):', error);
          }
        }
      }

      console.log('📅 Google Calendar: Etkinlik siliniyor:', googleEventId);
      console.log('🔍 API çağrısı parametreleri:', {
        calendarId: 'primary',
        eventId: googleEventId
      });
      
      const response = await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId
      });
      
      console.log('✅ Google Calendar: Etkinlik silindi:', googleEventId);
      console.log('🔍 API yanıtı:', response);
      return response;
    } catch (error) {
      console.error('❌ deleteEvent hatası:', {
        message: error.message,
        status: error.status,
        result: error.result,
        googleEventId: googleEventId
      });
      throw error;
    }
  }

  // Gün indeksini hesapla (0 = Pazartesi, 6 = Pazar)0)
  calculateDayIndex(dateString) {
    if (!dateString) return -1;
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Pazar = 6, Pazartesi = 0
  }

  // Süreyi hesapla
  calculateDuration(startDateTime, endDateTime) {
    if (!startDateTime || !endDateTime) return 1;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffMs = end - start;
    return Math.max(0.5, diffMs / (1000 * 60 * 60)); // Minimum 0.5 saat
  }

  // Giriş durumunu kontrol et
  isSignedIn() {
    try {
      // Önce GAPI client'dan token'ı kontrol et
      const gapiToken = window.gapi?.client?.getToken();
      if (gapiToken !== null && gapiToken !== undefined) {
        console.log('🔍 GoogleCalendarService: GAPI token bulundu:', gapiToken);
        return true;
      }
      
      // GAPI client hazır değilse localStorage'dan kontrol et
      const storedToken = localStorage.getItem('googleCalendarToken');
      if (storedToken) {
        try {
          const tokenData = JSON.parse(storedToken);
          const now = Date.now();
          const isValid = tokenData.expires_at && now < tokenData.expires_at;
          console.log('🔍 GoogleCalendarService: localStorage token kontrolü:', {
            hasToken: !!tokenData.access_token,
            expiresAt: new Date(tokenData.expires_at).toLocaleString(),
            isValid
          });
          return isValid;
        } catch (error) {
          console.error('❌ GoogleCalendarService: localStorage token parse hatası:', error);
          return false;
        }
      }
      
      console.log('🔍 GoogleCalendarService: Hiçbir token bulunamadı');
      return false;
    } catch (error) {
      console.error('❌ GoogleCalendarService: isSignedIn hatası:', error);
      return false;
    }
  }
}

export default new GoogleCalendarService();