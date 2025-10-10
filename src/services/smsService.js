const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// SMS gönder
export const sendSMS = async (smsData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify(smsData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Sultangazi SMS API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.message || `SMS gönderilemedi (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error('SMS gönderme hatası detayı:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Toplu SMS gönder
export const sendBulkSMS = async (bulkSmsData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify(bulkSmsData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Toplu SMS API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.message || `Toplu SMS gönderilemedi (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error('Toplu SMS gönderme hatası detayı:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// SMS geçmişini getir
export const getSMSHistory = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.phone) queryParams.append('phone', params.phone);
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/sms/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'SMS geçmişi getirilemedi');
    }

    return data;
  } catch (error) {
    console.error('SMS geçmişi getirme hatası:', error);
    throw error;
  }
};

// SMS istatistikleri
export const getSMSStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'SMS istatistikleri getirilemedi');
    }

    return data;
  } catch (error) {
    console.error('SMS istatistikleri getirme hatası:', error);
    throw error;
  }
};

// Kategorilere göre toplu SMS gönder
export const sendBulkSMSByCategories = async (smsData) => {
  try {
    console.log('Kategorilere göre SMS gönderimi başlatılıyor:', {
      selectedCategories: smsData.selectedCategories,
      message: smsData.message?.substring(0, 50) + '...',
      listName: smsData.listName,
      sendingTitle: smsData.sendingTitle
    });

    const response = await fetch(`${API_BASE_URL}/contacts/send-bulk-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify(smsData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Kategorilere göre SMS API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.message || `Kategorilere göre SMS gönderilemedi (${response.status})`);
    }

    console.log('Kategorilere göre SMS gönderim sonucu:', data);
    return data;
  } catch (error) {
    console.error('Kategorilere göre SMS gönderme hatası detayı:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const smsService = {
  sendSMS,
  sendBulkSMS,
  getSMSHistory,
  getSMSStats,
  sendBulkSMSByCategories
};